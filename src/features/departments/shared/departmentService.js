import { supabase } from '../../../services/supabase';
import { storageService } from '../../../services/storageService';

export const departmentService = {
  /**
   * Updates status, remarks and attachment for simple department tasks strictly in Supabase.
   */
  async updateDeptTask(bookingId, deptKey, { status, remarks, attachmentFile, existingAttachment, updatedBy }) {
    let attachment = existingAttachment || null;

    if (status === 'Complete' && attachmentFile) {
      const uploaded = await storageService.uploadAttachment(`departments/${bookingId}/${deptKey}`, attachmentFile);
      if (uploaded) {
        attachment = uploaded;
      }
    }

    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
      .from('pms_department_tasks')
      .upsert({
        booking_id: bookingId,
        department_key: deptKey,
        status,
        remarks,
        attachment_path: attachment?.path || null,
        attachment_name: attachment?.name || null,
        updated_by: updatedBy,
        updated_at: nowIso,
        completed_at: status === 'Complete' ? nowIso : null,
      }, { onConflict: 'booking_id,department_key' })
      .select();

    if (error) {
      console.error('Failed to update department task in Supabase:', error.message);
      throw new Error(error.message);
    }

    return data;
  }
};
