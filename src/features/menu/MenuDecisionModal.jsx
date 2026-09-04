import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { BookingSummary } from '../../components/shared/BookingSummary';
import { Textarea } from '../../components/common/Textarea';
import { Button } from '../../components/common/Button';
import { useUpdateMenuDecision } from './menuHooks';
import { UploadCloud, CheckCircle2, Clock, XCircle, FileText } from 'lucide-react';

export function MenuDecisionModal({ isOpen, onClose, booking }) {
  const [status, setStatus] = useState('Pending');
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  const updateMenuMutation = useUpdateMenuDecision();

  useEffect(() => {
    if (booking?.menu) {
      setStatus(booking.menu.status || 'Pending');
      setReason(booking.menu.reason || '');
      setRemarks(booking.menu.remarks || '');
      setFile(null);
      setError('');
    }
  }, [booking]);

  if (!booking) return null;

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

    if (status !== 'Finalized' && !reason.trim()) {
      setError('Reason is required when menu is Pending or Rejected.');
      return;
    }

    if (status === 'Finalized' && !file && !booking.menu?.attachment) {
      setError('Please attach the menu document to finalize.');
      return;
    }

    await updateMenuMutation.mutateAsync({
      bookingId: booking.id,
      payload: {
        status,
        reason,
        remarks,
        attachmentFile: file,
        existingAttachment: booking.menu?.attachment,
      },
    });

    onClose();
  };

  const statusOptions = [
    { key: 'Pending', label: 'Pending', icon: Clock, activeBorder: 'border-amber-500 bg-amber-50/50 text-amber-700' },
    { key: 'Rejected', label: 'Rejected', icon: XCircle, activeBorder: 'border-red-500 bg-red-50/50 text-red-700' },
    { key: 'Finalized', label: 'Finalized', icon: CheckCircle2, activeBorder: 'border-emerald-500 bg-emerald-50/50 text-emerald-700' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Menu Decision — ${booking.id}`}
      subtitle="Lock or reject the menu for this booking."
      maxWidth="max-w-3xl"
    >
      <BookingSummary booking={booking} defaultOpenSchedule={true} />


      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Status Pills */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 block">
            Select Menu Status <span className="text-red-500 font-bold">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {statusOptions.map((opt) => {
              const IconComp = opt.icon;
              const isSelected = status === opt.key;
              return (
                <button
                  type="button"
                  key={opt.key}
                  onClick={() => setStatus(opt.key)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-xs font-semibold cursor-pointer gap-1.5 ${
                    isSelected
                      ? `${opt.activeBorder} shadow-sm ring-2 ring-pms-accent/20`
                      : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                  }`}
                >
                  <IconComp className={`w-4 h-4 ${isSelected ? 'opacity-100' : 'opacity-50'}`} />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {status !== 'Finalized' ? (
          <Textarea
            label="Reason"
            required
            placeholder="Why is the menu pending or rejected?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Attachment Document <span className="text-red-500 font-bold">*</span></span>
                <span className="text-[10px] text-slate-400 font-normal">PDF / Image / Doc up to 5MB</span>
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
                    {file ? file.name : (booking.menu?.attachment?.name || 'Click to select menu attachment')}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'Upload confirmed menu PDF or image file'}
                  </div>
                </div>
              </label>
            </div>

            <Textarea
              label="Remarks"
              optional
              placeholder="Additional instructions for kitchen and logistics team..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
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
          <Button type="submit" variant="primary" disabled={updateMenuMutation.isPending}>
            {updateMenuMutation.isPending ? 'Saving...' : 'Save Decision'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
