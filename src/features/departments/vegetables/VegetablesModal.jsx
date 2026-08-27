import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/common/Modal';
import { BookingSummary } from '../../../components/shared/BookingSummary';
import { VegetableEntry } from './VegetableEntry';
import { Button } from '../../../components/common/Button';
import { vegetablesService } from './vegetablesService';
import { useAuth } from '../../../hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

export function VegetablesModal({ isOpen, onClose, booking, onViewMenu }) {
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  const deptData = booking?.departments?.vegetables;

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
      { vegType: 'Normal', source: 'Local', status: 'Pending', remarks: '' }
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
      setError('Please add at least one vegetable entry before saving.');
      return;
    }

    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      if (e.status === 'Pending' && !e.remarks?.trim()) {
        setError(`Item #${i + 1}: Remarks are required while status is Pending.`);
        return;
      }
      if (e.status === 'Complete' && !e.attachmentFile && !e.attachment) {
        setError(`Item #${i + 1}: Attachment is required to mark it Complete.`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await vegetablesService.saveVegetables(
        booking.id,
        entries,
        currentUser?.id || 'admin'
      );

      queryClient.invalidateQueries({ queryKey: ['pms_bookings'] });
      queryClient.invalidateQueries({ queryKey: ['pms_dashboard'] });
      toast.success('Vegetables entries saved successfully!');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save vegetable entries.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Vegetables — ${booking.id}`}
      subtitle="Manage normal and English vegetable requirements."
    >
      <BookingSummary booking={booking} onViewMenu={onViewMenu} />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          {entries.map((entry, idx) => (
            <VegetableEntry
              key={idx}
              entry={entry}
              index={idx}
              onChange={handleEntryChange}
              onRemove={handleRemoveEntry}
            />
          ))}

          {!entries.length && (
            <div className="p-8 text-center text-xs text-slate-500 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              No vegetable entries added yet. Click "+ Add Vegetable Item" below.
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleAddEntry}
          className="w-full py-2.5 px-4 border-2 border-dashed border-pms-accent text-pms-primary font-semibold text-xs rounded-xl hover:bg-blue-50/50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Vegetable Item</span>
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
            {isSubmitting ? 'Saving...' : 'Save Vegetables'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
