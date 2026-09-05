import { supabase } from '../../services/supabase';
import { DEPT_LIST } from '../../constants/departments';

function emptyDept(cfg) {
  const base = { status: 'Pending', remarks: '', attachment: null, updatedBy: '', updatedAt: '' };
  if (cfg.type === 'vegetables' || cfg.type === 'cheeseDairy') { base.entries = []; }
  return base;
}

function ensureBookingShape(b) {
  b.departments = b.departments || {};
  DEPT_LIST.forEach(cfg => {
    if (!b.departments[cfg.key]) b.departments[cfg.key] = emptyDept(cfg);
    const d = b.departments[cfg.key];
    if (cfg.type === 'vegetables' || cfg.type === 'cheeseDairy') { d.entries = d.entries || []; }
  });
  b.menu = b.menu || { status: 'Pending', details: '', reason: '', remarks: '', attachment: null, finalizationDate: '' };
  b.status = b.status || 'active';
  return b;
}

export const bookingService = {
  /**
   * Fetches real-time bookings strictly from Supabase with joined schedule and department entries.
   */
  async getBookings() {
    const { data, error } = await supabase
      .from('v_pms_bookings_expanded')
      .select(`
        *,
        pms_menu_tasks(*),
        pms_department_tasks(*),
        pms_vegetable_entries(*),
        pms_cheese_dairy_entries(*),
        pms_event_schedule(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase query error:', error.message);
      throw error;
    }

    if (!data || !Array.isArray(data)) return [];

    return data.map(b => {
      const depts = {};
      DEPT_LIST.forEach(cfg => {
        const dt = (b.pms_department_tasks || []).find(t => t.department_key === cfg.key || t.department === cfg.key);
        
        if (cfg.type === 'vegetables') {
          const entries = (b.pms_vegetable_entries || []).map(e => ({
            id: e.id,
            vegType: e.veg_type,
            source: e.source,
            status: e.status,
            remarks: e.remarks,
            attachment: e.attachment_path ? { name: e.attachment_name, path: e.attachment_path } : null,
            updatedBy: e.updated_by,
            updatedAt: e.updated_at,
          }));
          const allDone = entries.length > 0 && entries.every(e => e.status === 'Complete');

          depts[cfg.key] = {
            status: allDone ? 'Complete' : 'Pending',
            entries,
            updatedBy: (dt && dt.updated_by) || (entries[0] && entries[0].updatedBy) || '',
            updatedAt: (dt && dt.updated_at) || (entries[0] && entries[0].updatedAt) || '',
          };
        } else if (cfg.type === 'cheeseDairy') {
          const entries = (b.pms_cheese_dairy_entries || []).map(e => ({
            id: e.id,
            itemType: e.item_type,
            source: e.source,
            status: e.status,
            remarks: e.remarks,
            attachment: e.attachment_path ? { name: e.attachment_name, path: e.attachment_path } : null,
            updatedBy: e.updated_by,
            updatedAt: e.updated_at,
          }));
          const allDone = entries.length > 0 && entries.every(e => e.status === 'Complete');

          depts[cfg.key] = {
            status: allDone ? 'Complete' : 'Pending',
            entries,
            updatedBy: (dt && dt.updated_by) || (entries[0] && entries[0].updatedBy) || '',
            updatedAt: (dt && dt.updated_at) || (entries[0] && entries[0].updatedAt) || '',
          };
        } else {
          depts[cfg.key] = {
            status: dt ? dt.status : 'Pending',
            remarks: dt ? dt.remarks : '',
            attachment: dt && dt.attachment_path ? { name: dt.attachment_name, path: dt.attachment_path } : null,
            updatedBy: dt ? dt.updated_by : '',
            updatedAt: dt ? dt.updated_at : '',
          };
        }
      });

      const menuTask = Array.isArray(b.pms_menu_tasks) ? b.pms_menu_tasks[0] : b.pms_menu_tasks;

      const eventSchedule = (b.pms_event_schedule || []).map(s => ({
        id: s.id,
        date: s.event_date,
        timeLabel: s.time_label,
        guestCount: Number(s.guest_count || 0),
        sortOrder: s.sort_order ?? 0,
      })).sort((a, b) => a.sortOrder - b.sortOrder);

      const computedTotalPax = eventSchedule.reduce((sum, s) => sum + (s.guestCount || 0), 0);
      const totalGuestCount = b.total_guest_count != null ? Number(b.total_guest_count) : computedTotalPax;
      const eventStartDate = b.event_start_date || b.event_date;
      const eventEndDate = b.event_end_date || b.event_date;

      return ensureBookingShape({
        id: b.id,
        bookingDate: b.booking_date || (b.created_at ? b.created_at.slice(0, 10) : null),
        createdAt: b.created_at ? b.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
        customerName: b.customer_name || '—',
        customerMobile: b.customer_mobile || '—',
        altNumber: b.alt_number,
        functionType: b.function_type,
        eventStartDate,
        eventEndDate,
        eventDate: eventStartDate || eventEndDate,
        guestCount: totalGuestCount,
        totalGuestCount,
        eventSchedule,
        venueName: b.venue_name,
        referenceName: b.reference_name,
        referenceNumber: b.reference_number,
        remarks: b.remarks,
        status: b.status || 'active',
        menu: {
          status: menuTask ? menuTask.status : 'Pending',
          reason: menuTask ? menuTask.reason : '',
          remarks: menuTask ? menuTask.remarks : '',
          attachment: menuTask && menuTask.attachment_path ? { name: menuTask.attachment_name, path: menuTask.attachment_path } : null,
          finalizationDate: menuTask ? menuTask.finalization_date : '',
          whatsappStatus: menuTask ? menuTask.whatsapp_status : null,
          whatsappSentAt: menuTask ? menuTask.whatsapp_sent_at : null,
        },
        departments: depts,
      });
    });
  },

  /**
   * Creates a new booking via atomic Supabase RPC pms_create_booking.
   */
  async createBooking(bookingData, createdBy = 'admin') {
    const schedulePayload = (bookingData.eventSchedule || []).map((s, idx) => ({
      date: s.date,
      time_label: s.timeLabel,
      guest_count: Number(s.guestCount),
      sort_order: idx,
    }));

    const { data, error } = await supabase.rpc('pms_create_booking', {
      p_customer_name: bookingData.customerName,
      p_customer_mobile: bookingData.customerMobile,
      p_alt_number: bookingData.altNumber || null,
      p_function_type: bookingData.functionType || null,
      p_event_start_date: bookingData.eventStartDate,
      p_event_end_date: bookingData.eventEndDate,
      p_schedule: schedulePayload,
      p_venue_name: bookingData.venueName || null,
      p_reference_name: bookingData.referenceName || null,
      p_reference_number: bookingData.referenceNumber || null,
      p_remarks: bookingData.remarks || null,
      p_created_by: createdBy,
    });

    if (error) {
      console.error('Failed to create booking in Supabase:', error.message);
      throw new Error(error.message || 'Failed to create booking in database.');
    }

    return data;
  },

  /**
   * Updates an existing booking in Supabase.
   */
  async updateBooking(id, bookingData) {
    const eventStartDate = bookingData.eventStartDate || bookingData.eventDate;
    const eventEndDate = bookingData.eventEndDate || bookingData.eventDate;

    const { error: bookingError } = await supabase
      .from('pms_bookings')
      .update({
        event_start_date: eventStartDate,
        event_end_date: eventEndDate,
        event_date: eventStartDate || eventEndDate,
        remarks: bookingData.remarks,
      })
      .eq('id', id);

    if (bookingError) {
      console.error('Failed to update booking in Supabase:', bookingError.message);
      throw new Error(bookingError.message || 'Failed to update booking.');
    }

    if (bookingData.eventSchedule && Array.isArray(bookingData.eventSchedule)) {
      const schedulePayload = bookingData.eventSchedule.map((s, idx) => ({
        date: s.date,
        time_label: s.timeLabel,
        guest_count: Number(s.guestCount),
        sort_order: idx,
      }));

      const { error: schedError } = await supabase.rpc('pms_upsert_event_schedule', {
        p_booking_id: id,
        p_schedule: schedulePayload,
      });

      if (schedError) {
        console.error('Failed to update event schedule in Supabase:', schedError.message);
        throw new Error(schedError.message || 'Failed to update event schedule.');
      }
    }
  },

  /**
   * Closes booking (move to history).
   */
  async closeBooking(id) {
    const { error } = await supabase.from('pms_bookings').update({ status: 'closed' }).eq('id', id);
    if (error) throw new Error(error.message);
  },

  /**
   * Reopens history booking.
   */
  async reopenBooking(id) {
    const { error } = await supabase.from('pms_bookings').update({ status: 'active' }).eq('id', id);
    if (error) throw new Error(error.message);
  }
};
