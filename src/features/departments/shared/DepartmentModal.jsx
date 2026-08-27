import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/common/Modal';
import { BookingSummary } from '../../../components/shared/BookingSummary';
import { Textarea } from '../../../components/common/Textarea';
import { Button } from '../../../components/common/Button';
import { departmentService } from './departmentService';
import { useAuth } from '../../../hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { UploadCloud, CheckCircle2, Clock } from 'lucide-react';

export function DepartmentModal({ isOpen, onClose, booking, deptConfig, onViewMenu }) {
  const [status, setStatus] = useState('Pending');
  const [remarks, setRemarks] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  const deptKey = deptConfig?.key;
  const deptData = booking?.departments?.[deptKey];

  useEffect(() => {
    if (deptData) {
      setStatus(deptData.status || 'Pending');
      setRemarks(deptData.remarks || '');
      setFile(null);
      setError('');
    }
  }, [deptData, booking]);

  if (!booking || !deptConfig) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (selected.size > 5 * 1024 * 1024) {
        setError('File size must be under 5 MB');
        return;
      }
      setError('');
      setFile(selected);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (status === 'Pending' && !remarks.trim()) {
      setError('Remarks are required while status is Pending.');
      return;
    }

    if (status === 'Complete' && !file && !deptData?.attachment) {
      setError('Please attach a file to mark this Complete.');
      return;
    }

    setIsSubmitting(true);
    try {
      await departmentService.updateDeptTask(booking.id, deptKey, {
        status,
        remarks,
        attachmentFile: file,
        existingAttachment: deptData?.attachment,
        updatedBy: currentUser?.id || 'admin',
      });

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
      onClose={onClose}
      title={`${deptConfig.label} — ${booking.id}`}
      subtitle="Update status, remarks and upload task proof."
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
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span>Attachment Proof <span className="text-red-500 font-bold">*</span></span>
              <span className="text-[10px] text-slate-400 font-normal">Max 5MB</span>
            </label>

            <label className="border-2 border-dashed border-slate-200 rounded-xl p-4 bg-slate-50/50 hover:bg-slate-100/50 hover:border-pms-accent transition-all cursor-pointer flex items-center gap-3">
              <UploadCloud className="w-6 h-6 text-pms-accent flex-shrink-0" />
              <div className="flex-1 min-w-0 text-xs">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="font-semibold text-slate-900 truncate">
                  {file ? file.name : (deptData?.attachment?.name || 'Click to select task proof attachment')}
                </div>
                <div className="text-[11px] text-slate-400">
                  {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Upload confirmation photo or document'}
                </div>
              </div>
            </label>
          </div>
        )}

        {error && (
          <div className="text-xs font-medium text-red-600 bg-red-50 p-3 rounded-xl border border-red-200 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 mt-6">
          <Button type="button" variant="ghost" onClick={onClose}>
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
