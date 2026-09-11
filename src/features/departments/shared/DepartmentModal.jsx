import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/common/Modal';
import { BookingSummary } from '../../../components/shared/BookingSummary';
import { Textarea } from '../../../components/common/Textarea';
import { Button } from '../../../components/common/Button';
import { AttachmentUploader } from '../../../components/common/AttachmentUploader';
import { clearFilesFromSession } from '../../../utils/fileSessionStore';
import { departmentService } from './departmentService';
import { useAuth } from '../../../hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, Clock } from 'lucide-react';

export function DepartmentModal({ isOpen, onClose, booking, deptConfig, onViewMenu }) {
  const [status, setStatus] = useState('Pending');
  const [remarks, setRemarks] = useState('');
  const [newFiles, setNewFiles] = useState([]);
  const [keptAttachments, setKeptAttachments] = useState([]);
  const [deletedPaths, setDeletedPaths] = useState([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  const deptKey = deptConfig?.key;
  const deptData = booking?.departments?.[deptKey];
  const sessionKey = booking?.id && deptKey ? `dept_${deptKey}_${booking.id}` : null;

  useEffect(() => {
    if (deptData) {
      setStatus(deptData.status || 'Pending');
      setRemarks(deptData.remarks || '');
      const existing = Array.isArray(deptData.attachments)
        ? deptData.attachments
        : (deptData.attachment ? [deptData.attachment] : []);
      setKeptAttachments(existing);
      setNewFiles([]);
      setDeletedPaths([]);
      setError('');
    }
  }, [deptData, booking]);

  if (!booking || !deptConfig) return null;

  const handleDeleteExisting = (idx, att) => {
    if (att?.path) {
      setDeletedPaths(prev => [...prev, att.path]);
    }
    setKeptAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  const handleClose = () => {
    if (sessionKey) {
      clearFilesFromSession(sessionKey);
    }
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (status === 'Pending' && !remarks.trim()) {
      setError('Remarks are required while status is Pending.');
      return;
    }

    const totalAttachments = (newFiles?.length || 0) + (keptAttachments?.length || 0);
    if (status === 'Complete' && totalAttachments === 0) {
      setError('Please attach at least one file (photo, video or document) to mark this Complete.');
      return;
    }

    setIsSubmitting(true);
    try {
      await departmentService.updateDeptTask(booking.id, deptKey, {
        status,
        remarks,
        attachmentFiles: newFiles,
        keptAttachments,
        deletedPaths,
        updatedBy: currentUser?.id || 'admin',
      });

      if (sessionKey) {
        clearFilesFromSession(sessionKey);
      }

      queryClient.invalidateQueries({ queryKey: ['pms_bookings'] });
      queryClient.invalidateQueries({ queryKey: ['pms_dashboard'] });
      toast.success(`${deptConfig.label} status updated!`);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update department task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`${deptConfig.label} — ${booking.id}`}
      subtitle="Update status, remarks and upload proof of task completion."
      maxWidth="max-w-2xl"
    >
      <BookingSummary booking={booking} onViewMenu={onViewMenu} />

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Status Pills */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 block">
            Status <span className="text-red-500 font-bold">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setStatus('Pending')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                status === 'Pending'
                  ? 'border-amber-500 bg-amber-50 text-amber-800 ring-2 ring-amber-500/20'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <Clock className="w-4 h-4 opacity-70" />
              <span>Pending</span>
            </button>

            <button
              type="button"
              onClick={() => setStatus('Complete')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                status === 'Complete'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 opacity-70" />
              <span>Complete</span>
            </button>
          </div>
        </div>

        <Textarea
          label="Remarks"
          required={status === 'Pending'}
          optional={status === 'Complete'}
          placeholder="Notes or status explanation..."
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
        />

        {status === 'Complete' && (
          <div className="pt-1 border-t border-slate-100">
            <AttachmentUploader
              label="Attachment Proof (Photos / Videos / Docs)"
              sessionKey={sessionKey}
              required={true}
              maxFiles={10}
              maxSizeMb={50}
              newFiles={newFiles}
              onNewFilesChange={setNewFiles}
              existingAttachments={keptAttachments}
              onDeleteExisting={handleDeleteExisting}
              hint="Upload photos, videos of completed work, or receipts (up to 50 MB each, max 10 files)"
            />
          </div>
        )}

        {error && (
          <div className="text-xs font-medium text-red-600 bg-red-50 p-3 rounded-xl border border-red-200 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="pt-4 sm:pt-5 border-t border-slate-200 flex items-center justify-end gap-3 mt-6">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
