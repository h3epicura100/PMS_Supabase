import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { BookingSummary } from '../../components/shared/BookingSummary';
import { Textarea } from '../../components/common/Textarea';
import { Button } from '../../components/common/Button';
import { AttachmentUploader } from '../../components/common/AttachmentUploader';
import { clearFilesFromSession } from '../../utils/fileSessionStore';
import { useUpdateMenuDecision } from './menuHooks';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';

export function MenuDecisionModal({ isOpen, onClose, booking }) {
  const [status, setStatus] = useState('Pending');
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [newFiles, setNewFiles] = useState([]);
  const [keptAttachments, setKeptAttachments] = useState([]);
  const [deletedPaths, setDeletedPaths] = useState([]);
  const [error, setError] = useState('');

  const updateMenuMutation = useUpdateMenuDecision();
  const sessionKey = booking?.id ? `menu_${booking.id}` : null;

  useEffect(() => {
    if (booking?.menu) {
      setStatus(booking.menu.status || 'Pending');
      setReason(booking.menu.reason || '');
      setRemarks(booking.menu.remarks || '');
      const existing = Array.isArray(booking.menu.attachments)
        ? booking.menu.attachments
        : (booking.menu.attachment ? [booking.menu.attachment] : []);
      setKeptAttachments(existing);
      setNewFiles([]);
      setDeletedPaths([]);
      setError('');
    }
  }, [booking]);

  if (!booking) return null;

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

    if (status !== 'Finalized' && !reason.trim()) {
      setError('Reason is required when menu is Pending or Rejected.');
      return;
    }

    const totalAttachments = (newFiles?.length || 0) + (keptAttachments?.length || 0);
    if (status === 'Finalized' && totalAttachments === 0) {
      setError('Please attach at least one menu document (PDF / Image / Video) to finalize.');
      return;
    }

    try {
      await updateMenuMutation.mutateAsync({
        bookingId: booking.id,
        payload: {
          status,
          reason,
          remarks,
          attachmentFiles: newFiles,
          keptAttachments,
          deletedPaths,
          bookingData: booking,
        },
      });

      if (sessionKey) {
        clearFilesFromSession(sessionKey);
      }

      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save menu decision.');
    }
  };

  const statusOptions = [
    { key: 'Pending', label: 'Pending', icon: Clock, activeBorder: 'border-amber-500 bg-amber-50/50 text-amber-700' },
    { key: 'Rejected', label: 'Rejected', icon: XCircle, activeBorder: 'border-red-500 bg-red-50/50 text-red-700' },
    { key: 'Finalized', label: 'Finalized', icon: CheckCircle2, activeBorder: 'border-emerald-500 bg-emerald-50/50 text-emerald-700' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
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
            <div className="pt-1 border-t border-slate-100">
              <AttachmentUploader
                label="Menu Document"
                sessionKey={sessionKey}
                required={true}
                maxFiles={1}
                maxSizeMb={50}
                newFiles={newFiles}
                onNewFilesChange={setNewFiles}
                existingAttachments={keptAttachments}
                onDeleteExisting={handleDeleteExisting}
                hint="Upload confirmed menu PDF, image, or doc to attach to WhatsApp notification (up to 50 MB, 1 file)"
              />
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

        <div className="pt-4 sm:pt-5 border-t border-slate-200 flex items-center justify-end gap-3 mt-6">
          <Button type="button" variant="ghost" onClick={handleClose}>
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
