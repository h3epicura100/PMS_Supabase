// ============================================================
// ORDER RAIL PMS — SUPABASE EDGE FUNCTION: SEND DELAY ALERTS
// File: supabase/functions/send-delay-alerts/index.ts
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingDeptTask {
  bookingId: string;
  customerName: string;
  functionType: string;
  eventStartDate: string;
  eventEndDate: string;
  eventDate: string;
  createdAt: string;
  delayDeadlineOverride?: string | null;
  effectiveDeadline: Date;
  deptKey: string;
  deptLabel: string;
  status: string;
}

function normalizePhoneNumber(rawNumber: string | null | undefined): string | null {
  if (!rawNumber) return null;
  let digits = String(rawNumber).replace(/\D/g, "");
  if (!digits) return null;

  if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  if (digits.length === 10) {
    return `91${digits}`;
  }
  return digits;
}

function formatOverdueTime(diffMs: number): string {
  const totalHours = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)));
  if (totalHours < 24) {
    return `${totalHours} hour${totalHours > 1 ? "s" : ""}`;
  }
  const days = Math.floor(totalHours / 24);
  const remHours = totalHours % 24;
  if (remHours === 0) {
    return `${days} day${days > 1 ? "s" : ""}`;
  }
  return `${days}d ${remHours}h`;
}

function getISTDateParts(): { istDateStr: string; istHour: number; istMinute: number } {
  const now = new Date();
  const istFormatter = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = istFormatter.formatToParts(now);
  const partMap: Record<string, string> = {};
  parts.forEach((p) => {
    partMap[p.type] = p.value;
  });

  const istDateStr = `${partMap.year}-${partMap.month}-${partMap.day}`;
  const istHour = parseInt(partMap.hour || "0", 10);
  const istMinute = parseInt(partMap.minute || "0", 10);

  return { istDateStr, istHour, istMinute };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
      Deno.env.get("SUPABASE_ANON_KEY") ??
      "";

    const maytapiProductId = Deno.env.get("MAYTAPI_PRODUCT_ID")?.trim() ?? "";
    const maytapiPhoneId = Deno.env.get("MAYTAPI_PHONE_ID")?.trim() ?? "";
    const maytapiToken = Deno.env.get("MAYTAPI_TOKEN")?.trim() ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Optional manual force parameter from request body
    let forceSend = false;
    try {
      const body = await req.json();
      if (body && body.force) forceSend = true;
    } catch (_) {
      // Empty or non-JSON body is acceptable for standard cron GET/POST
    }

    // 1. Fetch active bookings with finalized menu
    const { data: bookingsData, error: bkErr } = await supabase
      .from("v_pms_bookings_expanded")
      .select(`
        id,
        customer_name,
        function_type,
        event_start_date,
        event_end_date,
        event_date,
        created_at,
        delay_deadline_override,
        status,
        pms_menu_tasks(*),
        pms_department_tasks(*),
        pms_vegetable_entries(*),
        pms_cheese_dairy_entries(*)
      `)
      .eq("status", "active");

    if (bkErr) throw bkErr;

    // 2. Fetch departments master
    const { data: deptsData, error: deptErr } = await supabase
      .from("pms_departments")
      .select("key, label, dept_type, sort_order")
      .order("sort_order");

    if (deptErr) throw deptErr;
    const deptMap = new Map<string, string>();
    (deptsData || []).forEach((d) => deptMap.set(d.key, d.label));

    // 3. Fetch all staff users (exclude admins from delay alerts)
    const { data: usersData, error: uErr } = await supabase
      .from("pms_users")
      .select(`
        id,
        display_name,
        role,
        has_full_access,
        whatsapp_number,
        is_active,
        pms_user_permissions(permission_key)
      `)
      .eq("is_active", true);

    if (uErr) throw uErr;

    // Map department_key -> array of normalized phone numbers
    // ONLY include users explicitly mapped to this department, NEVER full access / admin
    const deptRecipientsMap = new Map<string, string[]>();

    (usersData || []).forEach((u) => {
      // Skip admins / full access users per explicit requirement
      if (u.role === "admin" || u.has_full_access) {
        return;
      }

      const rawNum = u.whatsapp_number;
      const normalized = normalizePhoneNumber(rawNum);
      if (!normalized) return;

      const perms = (u.pms_user_permissions || []).map((p: any) => p.permission_key);
      perms.forEach((pKey: string) => {
        if (!deptRecipientsMap.has(pKey)) {
          deptRecipientsMap.set(pKey, []);
        }
        const list = deptRecipientsMap.get(pKey)!;
        if (!list.includes(normalized)) {
          list.push(normalized);
        }
      });
    });

    // 4. Fetch past notifications history to check deduplication
    const { data: notifData } = await supabase
      .from("pms_whatsapp_notifications")
      .select("booking_id, department_key, type, sent_at, status");

    const sentHistory = notifData || [];

    const now = new Date();
    const { istDateStr, istHour, istMinute } = getISTDateParts();

    // Check which reminder slot matches current IST time window (or if forced)
    // Reminder slots: 11:00 AM (11:00-11:45), 3:00 PM (15:00-15:45), 6:00 PM (18:00-18:45)
    let currentReminderSlot: "reminder_11am" | "reminder_3pm" | "reminder_6pm" | null = null;
    let slotLabel = "";

    if (istHour === 11 && istMinute <= 45) {
      currentReminderSlot = "reminder_11am";
      slotLabel = "11:00 AM";
    } else if (istHour === 15 && istMinute <= 45) {
      currentReminderSlot = "reminder_3pm";
      slotLabel = "3:00 PM";
    } else if (istHour === 18 && istMinute <= 45) {
      currentReminderSlot = "reminder_6pm";
      slotLabel = "6:00 PM";
    }

    const tasksToCheck: BookingDeptTask[] = [];

    // Filter bookings with Finalized menu
    (bookingsData || []).forEach((b) => {
      const menuTask = Array.isArray(b.pms_menu_tasks) ? b.pms_menu_tasks[0] : b.pms_menu_tasks;
      if (menuTask?.status !== "Finalized") return;

      const createdAtDate = new Date(b.created_at);
      let effectiveDeadline: Date;

      if (b.delay_deadline_override) {
        effectiveDeadline = new Date(b.delay_deadline_override);
      } else {
        effectiveDeadline = new Date(createdAtDate.getTime() + 48 * 60 * 60 * 1000);
      }

      (deptsData || []).forEach((d) => {
        const dt = (b.pms_department_tasks || []).find(
          (t: any) => t.department_key === d.key || t.department === d.key
        );

        let isComplete = false;
        if (d.dept_type === "vegetables") {
          const vEntries = (b.pms_vegetable_entries || []);
          isComplete = vEntries.length > 0 && vEntries.every((e: any) => e.status === "Complete");
        } else if (d.dept_type === "cheeseDairy") {
          const cEntries = (b.pms_cheese_dairy_entries || []);
          isComplete = cEntries.length > 0 && cEntries.every((e: any) => e.status === "Complete");
        } else {
          isComplete = dt?.status === "Complete";
        }

        if (!isComplete) {
          tasksToCheck.push({
            bookingId: b.id,
            customerName: b.customer_name || "—",
            functionType: b.function_type || "—",
            eventStartDate: b.event_start_date || b.event_date,
            eventEndDate: b.event_end_date || b.event_date,
            eventDate: b.event_date,
            createdAt: b.created_at,
            delayDeadlineOverride: b.delay_deadline_override,
            effectiveDeadline,
            deptKey: d.key,
            deptLabel: d.label,
            status: "Pending",
          });
        }
      });
    });

    const results = [];
    const maytapiConfigured = Boolean(
      maytapiProductId && maytapiPhoneId && maytapiToken
    );

    for (const task of tasksToCheck) {
      const diffMs = now.getTime() - task.effectiveDeadline.getTime();
      const isDelayed = diffMs > 0;

      if (!isDelayed) continue; // Grace period active (within 48hrs + extensions)

      // Check notification history for this booking + department
      const historyForTask = sentHistory.filter(
        (h) => h.booking_id === task.bookingId && h.department_key === task.deptKey
      );

      const hasEverSentInitial = historyForTask.some((h) => h.type === "initial_delay" && h.status === "Sent");

      let sendType: "initial_delay" | "reminder_11am" | "reminder_3pm" | "reminder_6pm" | null = null;
      let headerTitle = "⚠️ *TASK DELAYED*";

      if (!hasEverSentInitial) {
        // First delay alert
        sendType = "initial_delay";
        headerTitle = "⚠️ *TASK DELAYED*";
      } else if (currentReminderSlot || forceSend) {
        // Daily scheduled reminder
        const targetSlot = currentReminderSlot || "reminder_11am";
        const alreadySentSlotToday = historyForTask.some((h) => {
          if (h.type !== targetSlot || h.status !== "Sent") return false;
          const sentIst = new Intl.DateTimeFormat("en-IN", {
            timeZone: "Asia/Kolkata",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(new Date(h.sent_at));
          return sentIst === istDateStr;
        });

        if (!alreadySentSlotToday) {
          sendType = targetSlot;
          headerTitle = `⏰ *TASK DELAY REMINDER (${slotLabel || "SCHEDULED"})*`;
        }
      }

      if (!sendType) continue;

      const recipients = deptRecipientsMap.get(task.deptKey) || [];
      if (recipients.length === 0) {
        console.warn(`[DelayAlerts] No phone numbers found for department: ${task.deptKey}`);
        results.push({
          bookingId: task.bookingId,
          department: task.deptKey,
          status: "Skipped",
          reason: "No recipients mapped to department",
        });
        continue;
      }

      const overdueText = formatOverdueTime(diffMs);
      const dateDisplay =
        task.eventStartDate === task.eventEndDate
          ? task.eventStartDate
          : `${task.eventStartDate} to ${task.eventEndDate}`;

      const divider = "────────────────";
      const message = [
        headerTitle,
        divider,
        `📋 *Booking ID:* ${task.bookingId}`,
        `👤 *Customer:* ${task.customerName}`,
        `🎊 *Function:* ${task.functionType}`,
        `📅 *Date:* ${dateDisplay}`,
        `📁 *Department:* ${task.deptLabel}`,
        `⏰ *Overdue:* ${overdueText}`,
        divider,
        `⚡ *Action Required:* Please complete your department task.`,
        `🌐 https://pms-supabase.vercel.app/`,
        `_Order Rail PMS_`,
      ].join("\n");

      let sendStatus = "Sent";
      let errorMsg: string | null = null;

      if (maytapiConfigured) {
        const sendEndpoint = `https://api.maytapi.com/api/${maytapiProductId}/${maytapiPhoneId}/sendMessage`;
        for (const phone of recipients) {
          try {
            const resp = await fetch(sendEndpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-maytapi-key": maytapiToken,
              },
              body: JSON.stringify({
                to_number: phone,
                type: "text",
                message,
              }),
            });
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok || data.success === false) {
              sendStatus = "Partial";
              errorMsg = data.message || `HTTP ${resp.status}`;
            }
          } catch (e: any) {
            sendStatus = "Partial";
            errorMsg = e?.message || "Send error";
          }
        }
      } else {
        sendStatus = "Skipped";
        errorMsg = "Maytapi not configured in environment";
      }

      // Record in pms_whatsapp_notifications
      try {
        await supabase.from("pms_whatsapp_notifications").insert({
          booking_id: task.bookingId,
          department_key: task.deptKey,
          type: sendType,
          recipients,
          status: sendStatus,
          error_message: errorMsg,
        });
      } catch (insertErr) {
        console.warn("[DelayAlerts] Failed to record notification in DB:", insertErr);
      }

      results.push({
        bookingId: task.bookingId,
        department: task.deptKey,
        type: sendType,
        recipientsCount: recipients.length,
        status: sendStatus,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        timestamp: now.toISOString(),
        istDate: istDateStr,
        istHour,
        currentReminderSlot,
        checkedTasks: tasksToCheck.length,
        processedAlerts: results.length,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error?.message || "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
