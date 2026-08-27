import { supabase } from '../../services/supabase';
import { storageService } from '../../services/storageService';

export const menuService = {
  /**
   * Updates menu decision status, reason, remarks & attachment in Supabase.
   */
  async updateMenuDecision(bookingId, { status, reason, remarks, attachmentFile, existingAttachment }) {
    let attachment = existingAttachment || null;

    if (status === 'Finalized' && attachmentFile) {
      const uploaded = await storageService.uploadAttachment(`menu/${bookingId}`, attachmentFile);
      if (uploaded) {
        attachment = uploaded;
      }
    }

    const finalizationDate = status === 'Finalized' ? new Date().toISOString().slice(0, 10) : null;

    const { data, error } = await supabase
      .from('pms_menu_tasks')
      .upsert({
        booking_id: bookingId,
        status,
        reason: status !== 'Finalized' ? reason : null,
        remarks: status === 'Finalized' ? remarks : null,
        attachment_path: attachment?.path || null,
        attachment_name: attachment?.name || null,
        finalization_date: finalizationDate,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'booking_id' })
      .select();

    if (error) {
      console.error('Failed to update menu decision in Supabase:', error.message);
      throw new Error(error.message);
    }

    return data;
  }
};
