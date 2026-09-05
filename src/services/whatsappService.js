import { supabase } from './supabase';
import { storageService } from './storageService';
import { authService } from '../features/auth/authService';
import { formatDateRangeDisplay, formatDateDisplay, formatShortDateDisplay } from '../utils/dateUtils';

const MAYTAPI_PRODUCT_ID = import.meta.env.VITE_MAYTAPI_PRODUCT_ID;
const MAYTAPI_PHONE_ID = import.meta.env.VITE_MAYTAPI_PHONE_ID;
const MAYTAPI_TOKEN = import.meta.env.VITE_MAYTAPI_TOKEN;
const DEFAULT_NUMBER = import.meta.env.VITE_WHATSAPP_DEFAULT_NUMBER || '917000206500';

/**
 * Normalizes phone number into digits without '+' or spaces (e.g. 917000206500).
 */
export function normalizePhoneNumber(rawNumber) {
  if (!rawNumber) return null;
  let digits = String(rawNumber).replace(/\D/g, '');
  if (!digits) return null;

  // If leading 0 with 11 digits (e.g. 07000206500), strip 0
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // 10 digits Indian mobile number (e.g. 7000206500) -> prepend 91
  if (digits.length === 10) {
    return `91${digits}`;
  }

  return digits;
}

export const whatsappService = {
  /**
   * Checks if Maytapi credentials are configured in environment variables.
   */
  isConfigured() {
    return Boolean(
      MAYTAPI_PRODUCT_ID &&
      MAYTAPI_PHONE_ID &&
      MAYTAPI_TOKEN &&
      MAYTAPI_PRODUCT_ID.trim() !== '' &&
      MAYTAPI_PHONE_ID.trim() !== '' &&
      MAYTAPI_TOKEN.trim() !== ''
    );
  },

  /**
   * Internal helper to send a text message via Maytapi.
   */
  async _sendText(toNumber, text) {
    const endpoint = `https://api.maytapi.com/api/${MAYTAPI_PRODUCT_ID.trim()}/${MAYTAPI_PHONE_ID.trim()}/sendMessage`;
    const payload = {
      to_number: toNumber,
      type: 'text',
      message: text,
    };

    console.log(`[WhatsApp Service] Sending text to ${toNumber}...`, payload);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-maytapi-key': MAYTAPI_TOKEN.trim(),
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));
    console.log(`[WhatsApp Service] Text response for ${toNumber}:`, { status: response.status, ok: response.ok, data });

    if (!response.ok || data.success === false) {
      const errMsg = data.message || data.error || `HTTP ${response.status}: Failed to send text message`;
      throw new Error(errMsg);
    }

    return data;
  },

  /**
   * Internal helper to send media/attachment with caption via Maytapi.
   * Maytapi type 'media' expects the direct public URL in the 'message' field
   * and the caption/text in the 'caption' / 'text' fields.
   */
  async _sendMedia(toNumber, mediaUrl, caption = '') {
    const endpoint = `https://api.maytapi.com/api/${MAYTAPI_PRODUCT_ID.trim()}/${MAYTAPI_PHONE_ID.trim()}/sendMessage`;
    const payload = {
      to_number: toNumber,
      type: 'media',
      message: mediaUrl,
      caption: caption || '',
      text: caption || '',
    };

    console.log(`[WhatsApp Service] Sending media with caption to ${toNumber}...`, payload);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-maytapi-key': MAYTAPI_TOKEN.trim(),
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));
    console.log(`[WhatsApp Service] Media response for ${toNumber}:`, { status: response.status, ok: response.ok, data });

    if (!response.ok || data.success === false) {
      const errMsg = data.message || data.error || `HTTP ${response.status}: Failed to send media`;
      throw new Error(errMsg);
    }

    return data;
  },

  /**
   * Sends a WhatsApp message (with attachment as single message if documentUrl is provided).
   */
  async sendMessage({ toNumber, message, documentUrl, caption }) {
    if (!this.isConfigured()) {
      throw new Error('Maytapi credentials are not configured in .env');
    }

    const cleanTo = normalizePhoneNumber(toNumber);
    if (!cleanTo) {
      throw new Error(`Invalid recipient phone number: ${toNumber}`);
    }

    if (documentUrl) {
      return await this._sendMedia(cleanTo, documentUrl, caption || message);
    } else {
      return await this._sendText(cleanTo, message);
    }
  },

  /**
   * Builds a clean, mobile-optimized WhatsApp message for a finalized menu.
   */
  buildMenuFinalizedMessage(booking, remarks, schedule = []) {
    const bookingId = booking?.id || '—';
    const customer = booking?.customerName || booking?.customer?.name || booking?.customer_name || '—';
    const functionType = booking?.functionType || booking?.function_type || '—';
    const venue = booking?.venueName || booking?.venue?.name || booking?.venue_name || '—';
    
    const startDate = booking?.eventStartDate || booking?.event_start_date || booking?.eventDate || booking?.event_date;
    const endDate = booking?.eventEndDate || booking?.event_end_date || booking?.eventDate || booking?.event_date;
    const dateRange = formatDateRangeDisplay(startDate, endDate);

    const pax = (booking?.totalGuestCount ?? booking?.guestCount ?? booking?.total_guest_count)?.toLocaleString() || '—';
    const remarksText = remarks || booking?.menu?.remarks || booking?.remarks || '';
    const refName = booking?.referenceName || booking?.reference_name || '';
    const refNum = booking?.referenceNumber || booking?.reference_number || '';

    const divider = `────────────────`;

    const lines = [
      `🎉 *MENU FINALIZED*`,
      divider,
      `📋 *Booking ID:* ${bookingId}`,
      `👤 *Customer:* ${customer}`,
      `🎊 *Function:* ${functionType}`,
      `📍 *Venue:* ${venue}`,
      `📅 *Date:* ${dateRange}`,
      `👥 *Total Guests:* ${pax} Pax`,
    ];

    if (refName) {
      lines.push(`🤝 *Reference:* ${refName}${refNum ? ` (${refNum})` : ''}`);
    }

    // Schedule breakdown
    const activeSchedule = (schedule && schedule.length > 0)
      ? schedule
      : (booking?.eventSchedule || booking?.pms_event_schedule || []);

    if (activeSchedule && activeSchedule.length > 0) {
      lines.push(``);
      lines.push(divider);
      lines.push(`🗓️ *SCHEDULE & SESSIONS*`);
      
      activeSchedule.forEach((s) => {
        const sDate = formatShortDateDisplay(s.date || s.event_date);
        const sLabel = s.timeLabel || s.time_label || 'Session';
        const sPax = Number(s.guestCount ?? s.guest_count ?? 0).toLocaleString();
        lines.push(`▫️ ${sDate} (${sLabel}) : ${sPax} Pax`);
      });
    }

    // Remarks
    if (remarksText && remarksText.trim()) {
      lines.push(``);
      lines.push(divider);
      lines.push(`📝 *Remarks / Instructions:*`);
      lines.push(`${remarksText.trim()}`);
    }

    lines.push(``);
    lines.push(divider);
    lines.push(`📎 _Finalized menu attached above_`);
    lines.push(`_Order Rail PMS_`);

    return lines.join('\n');
  },

  /**
   * Dispatches menu finalized WhatsApp notifications to all registered department user numbers (Staff & Admin)
   * plus the default fallback number.
   * Attaches the file directly with the details message as a single WhatsApp message.
   */
  async sendMenuFinalizedNotification(booking, attachmentPath, attachmentName, remarks) {
    if (!this.isConfigured()) {
      console.info('[WhatsApp Service] Maytapi credentials not configured in .env. Skipping WhatsApp notification.');
      return {
        status: 'Skipped',
        sent: 0,
        failed: 0,
        reason: 'Maytapi credentials not configured in .env',
      };
    }

    // 1. Fetch all registered user phone numbers (Staff & Admin) from authService / database
    const recipientSet = new Set();

    try {
      const users = await authService.loadUsers();
      if (users && Array.isArray(users)) {
        users.forEach(u => {
          const rawNum = u.whatsapp_number || u.whatsappNumber;
          if (rawNum) {
            const formatted = normalizePhoneNumber(rawNum);
            if (formatted) {
              recipientSet.add(formatted);
              console.log(`[WhatsApp Service] Recipient added: ${formatted} (User: ${u.display_name || u.name || u.id}, Role: ${u.role || 'staff'})`);
            }
          }
        });
      }
    } catch (err) {
      console.warn('[WhatsApp Service] Could not fetch users via authService:', err);
      try {
        const { data: dbUsers } = await supabase
          .from('pms_users')
          .select('id, display_name, role, whatsapp_number')
          .not('whatsapp_number', 'is', null);

        if (dbUsers && Array.isArray(dbUsers)) {
          dbUsers.forEach(u => {
            const formatted = normalizePhoneNumber(u.whatsapp_number);
            if (formatted) recipientSet.add(formatted);
          });
        }
      } catch (dbErr) {
        console.warn('[WhatsApp Service] Database query fallback failed:', dbErr);
      }
    }

    // 2. Always include the default configured number
    const defaultFormatted = normalizePhoneNumber(DEFAULT_NUMBER);
    if (defaultFormatted) {
      recipientSet.add(defaultFormatted);
    }

    const recipients = Array.from(recipientSet);

    if (recipients.length === 0) {
      return {
        status: 'Skipped',
        sent: 0,
        failed: 0,
        reason: 'No recipient WhatsApp numbers found',
      };
    }

    console.log(`[WhatsApp Service] Dispatching to ${recipients.length} recipients:`, recipients);

    // 3. Resolve attachment public URL (Supabase storage buckets are public)
    let publicMediaUrl = null;
    if (attachmentPath) {
      try {
        const resolvedUrl = storageService.getPublicUrl(attachmentPath);
        if (resolvedUrl && (resolvedUrl.startsWith('http://') || resolvedUrl.startsWith('https://'))) {
          publicMediaUrl = resolvedUrl;
        } else {
          console.warn('[WhatsApp Service] Attachment path is not an accessible HTTP URL:', resolvedUrl);
        }
      } catch (err) {
        console.warn('[WhatsApp Service] Failed to resolve attachment public URL:', err);
      }
    }

    // 4. Fetch schedule sessions if not already in booking object
    let schedule = booking?.eventSchedule || booking?.pms_event_schedule || [];
    if ((!schedule || schedule.length === 0) && booking?.id) {
      try {
        const { data: schedData } = await supabase
          .from('pms_event_schedule')
          .select('*')
          .eq('booking_id', booking.id)
          .order('sort_order', { ascending: true });
        if (schedData && schedData.length > 0) {
          schedule = schedData;
        }
      } catch (e) {
        console.warn('[WhatsApp Service] Could not fetch event schedule for message:', e);
      }
    }

    // 5. Construct mobile-optimized message text
    const message = this.buildMenuFinalizedMessage(booking, remarks, schedule);

    // 6. Send as a single message: Media with message caption (or Text if no media)
    const results = await Promise.allSettled(
      recipients.map(async (phone) => {
        if (publicMediaUrl) {
          // Single message: document attachment with the full event details as caption
          await this._sendMedia(phone, publicMediaUrl, message);
        } else {
          // Fallback if no media attachment
          await this._sendText(phone, message);
        }

        return { phone, success: true };
      })
    );

    let sentCount = 0;
    let failedCount = 0;
    const errors = [];

    results.forEach((res, index) => {
      if (res.status === 'fulfilled') {
        sentCount++;
      } else {
        failedCount++;
        errors.push({
          number: recipients[index],
          error: res.reason?.message || 'Unknown send error',
        });
      }
    });

    let status = 'Sent';
    if (sentCount === 0 && failedCount > 0) {
      status = 'Failed';
    } else if (failedCount > 0) {
      status = 'Partial';
    }

    console.log('[WhatsApp Service] Batch notification summary:', {
      status,
      sentCount,
      failedCount,
      totalRecipients: recipients.length,
      errors,
    });

    return {
      status,
      sent: sentCount,
      failed: failedCount,
      recipients: recipients.length,
      errors,
    };
  },
};
