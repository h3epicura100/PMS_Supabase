import { supabase } from '../../../services/supabase';
import { storageService } from '../../../services/storageService';

export const vegetablesService = {
  /**
   * Saves repeatable vegetable entries directly in Supabase.
   */
  async saveVegetables(bookingId, entries, updatedBy) {
    const processedEntries = [];
    const nowIso = new Date().toISOString();

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      let attachment = entry.attachment || null;

      if (entry.status === 'Complete' && entry.attachmentFile) {
        const uploaded = await storageService.uploadAttachment(`vegetables/${bookingId}/${i}`, entry.attachmentFile);
        if (uploaded) {
          attachment = uploaded;
        }
      }

      processedEntries.push({
        id: entry.id || undefined,
        vegType: entry.vegType,
        source: entry.vegType === 'English' ? entry.source : null,
        status: entry.status,
        remarks: entry.remarks,
        attachment,
        updatedBy,
        updatedAt: nowIso,
      });
    }

    const overallStatus = processedEntries.length > 0 && processedEntries.every(e => e.status === 'Complete')
      ? 'Complete'
      : 'Pending';

    // Clear existing entries for booking in Supabase and insert new list
    const { error: deleteError } = await supabase
      .from('pms_vegetable_entries')
      .delete()
      .eq('booking_id', bookingId);

    if (deleteError) console.warn('Supabase delete entries warning:', deleteError.message);

    const insertRows = processedEntries.map((e, idx) => ({
      booking_id: bookingId,
      sort_order: idx,
      veg_type: e.vegType,
      source: e.source,
      status: e.status,
      remarks: e.remarks,
      attachment_path: e.attachment?.path || null,
      attachment_name: e.attachment?.name || null,
      updated_by: updatedBy,
      updated_at: nowIso,
      completed_at: e.status === 'Complete' ? nowIso : null,
    }));

    if (insertRows.length > 0) {
      const { error: insertError } = await supabase
        .from('pms_vegetable_entries')
        .insert(insertRows);

      if (insertError) {
        console.error('Failed to insert vegetable entries in Supabase:', insertError.message);
        throw new Error(insertError.message);
      }
    }

    // Update parent department task row in Supabase
    const { error: deptError } = await supabase
      .from('pms_department_tasks')
      .upsert({
        booking_id: bookingId,
        department_key: 'vegetables',
        status: overallStatus,
        updated_by: updatedBy,
        updated_at: nowIso,
      }, { onConflict: 'booking_id,department_key' });

    if (deptError) {
      console.error('Failed to update vegetables department task:', deptError.message);
    }

    return processedEntries;
  }
};
