import { supabase } from '../../../services/supabase';
import { storageService } from '../../../services/storageService';

export const cheeseDairyService = {
  /**
   * Saves repeatable cheese & dairy entries directly in Supabase.
   */
  async saveCheeseDairy(bookingId, entries, updatedBy) {
    const processedEntries = [];
    const nowIso = new Date().toISOString();

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      let attachment = entry.attachment || null;

      if (entry.status === 'Complete' && entry.attachmentFile) {
        const uploaded = await storageService.uploadAttachment(`cheeseDairy/${bookingId}/${i}`, entry.attachmentFile);
        if (uploaded) {
          attachment = uploaded;
        }
      }

      processedEntries.push({
        id: entry.id || undefined,
        itemType: entry.itemType || 'Normal',
        source: entry.itemType === 'English' ? (entry.source || 'Local') : null,
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
      .from('pms_cheese_dairy_entries')
      .delete()
      .eq('booking_id', bookingId);

    if (deleteError) console.warn('Supabase delete entries warning:', deleteError.message);

    const insertRows = processedEntries.map((e, idx) => ({
      booking_id: bookingId,
      sort_order: idx,
      item_type: e.itemType,
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
        .from('pms_cheese_dairy_entries')
        .insert(insertRows);

      if (insertError) {
        console.error('Failed to insert cheese dairy entries in Supabase:', insertError.message);
        throw new Error(insertError.message);
      }
    }

    // Update parent department task row in Supabase
    const { error: deptError } = await supabase
      .from('pms_department_tasks')
      .upsert({
        booking_id: bookingId,
        department_key: 'cheeseDairy',
        status: overallStatus,
        updated_by: updatedBy,
        updated_at: nowIso,
      }, { onConflict: 'booking_id,department_key' });

    if (deptError) {
      console.error('Failed to update cheeseDairy department task:', deptError.message);
    }

    return processedEntries;
  }
};
