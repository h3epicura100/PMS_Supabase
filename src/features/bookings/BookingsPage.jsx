import React, { useState } from 'react';
import { useBookings, useReopenBooking } from './bookingHooks';
import { BookingTable } from './BookingTable';
import { BookingModal } from './BookingModal';
import { Button } from '../../components/common/Button';
import { Plus } from 'lucide-react';

export function BookingsPage() {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'history'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const { data: bookings = [], isLoading } = useBookings();
  const reopenMutation = useReopenBooking();

  const pendingBookings = bookings.filter(b => b.status === 'active' || (!b.status && !b.closed && !b.cancelled));
  const historyBookings = bookings.filter(b => b.status === 'closed' || b.status === 'cancelled' || b.closed || b.cancelled);

  const currentList = activeTab === 'pending' ? pendingBookings : historyBookings;

  const handleOpenNew = () => {
    setSelectedBooking(null);
    setIsModalOpen(true);
  };

  const handleEdit = (booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const handleReopen = (id) => {
    reopenMutation.mutate(id);
  };

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-pms-muted">Loading bookings rail...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-pms-border pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'pending'
                ? 'bg-pms-primary text-white shadow-sm'
                : 'text-pms-muted hover:bg-slate-100 hover:text-pms-text'
            }`}
          >
            <span>Pending</span>
            <span className={`px-2 py-0.5 text-xs rounded-full ${activeTab === 'pending' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {pendingBookings.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${
              activeTab === 'history'
                ? 'bg-pms-primary text-white shadow-sm'
                : 'text-pms-muted hover:bg-slate-100 hover:text-pms-text'
            }`}
          >
            <span>History</span>
            <span className={`px-2 py-0.5 text-xs rounded-full ${activeTab === 'history' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {historyBookings.length}
            </span>
          </button>
        </div>

        <Button variant="primary" onClick={handleOpenNew}>
          <Plus className="w-4 h-4" />
          <span>New Booking</span>
        </Button>
      </div>

      {/* Table */}
      <BookingTable
        bookings={currentList}
        isHistoryTab={activeTab === 'history'}
        onEdit={handleEdit}
        onReopen={handleReopen}
      />

      {/* Modal */}
      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialValues={selectedBooking}
      />
    </div>
  );
}
