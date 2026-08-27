import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/common/Modal';
import { BookingSummary } from '../../../components/shared/BookingSummary';
import { CheeseDairyEntry } from './CheeseDairyEntry';
import { Button } from '../../../components/common/Button';
import { cheeseDairyService } from './cheeseDairyService';
import { useAuth } from '../../../hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

export function CheeseDairyModal({ isOpen, onClose, booking, onViewMenu }) {
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  const deptData = booking?.departments?.cheeseDairy;

  useEffect(() => {
    if (deptData?.entries) {
      setEntries(deptData.entries.map(e => ({ ...e })));
    } else {
      setEntries([]);
    }
    setError('');
  }, [deptData, booking]);

  if (!booking) return null;

  const handleAddEntry = () => {
    setEntries(prev => [
      ...prev,
      { itemType: 'Normal', source: 'Local', status: 'Pending', remarks: '' }
    ]);
  };

  const handleEntryChange = (index, updated) => {
    setEntries(prev => {
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  };

  const handleRemoveEntry = (index) => {
    setEntries(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!entries.length) {
      setError('Please add at least one cheese/dairy entry before saving.');
      return;
    }

    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      if (e.status === 'Pending' && !e.remarks?.trim()) {
        setError(`Item #${i + 1}: Remarks are required while status is Pending.`);
        return;
      }
      if (e.status === 'Complete' && !e.attachmentFile && !e.attachment) {
        setError(`Item #${i + 1}: Attachment proof is required to mark it Complete.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await cheeseDairyService.saveCheeseDairy(
        booking.id,
        entries,
        currentUser?.id || 'admin'
      );

      queryClient.invalidateQueries({ queryKey: ['pms_bookings'] });
      queryClient.invalidateQueries({ queryKey: ['pms_dashboard'] });
      toast.success('Cheese & Dairy Products entries saved successfully!');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save cheese & dairy entries.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Cheese & Dairy Products — ${booking.id}`}
      subtitle="Manage normal and English cheese/dairy requirements."
    >
      <BookingSummary booking={booking} onViewMenu={onViewMenu} />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          {entries.map((entry, idx) => (
            <CheeseDairyEntry
              key={idx}
              entry={entry}
              index={idx}
              onChange={handleEntryChange}
              onRemove={handleRemoveEntry}
            />
          ))}

          {!entries.length && (
            <div className="p-8 text-center text-xs text-slate-500 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              No cheese & dairy entries added yet. Click "+ Add Product Item" below.
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleAddEntry}
          className="w-full py-2.5 px-4 border-2 border-dashed border-pms-accent text-pms-primary font-semibold text-xs rounded-xl hover:bg-blue-50/50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Product Item</span>
        </button>

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
            {isSubmitting ? 'Saving...' : 'Save Products'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
