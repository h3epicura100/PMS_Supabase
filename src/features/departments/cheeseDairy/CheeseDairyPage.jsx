import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { bookingService } from '../../bookings/bookingService';
import { DepartmentTable } from '../shared/DepartmentTable';
import { CheeseDairyModal } from './CheeseDairyModal';
import { Button } from '../../../components/common/Button';
import { RefreshCw } from 'lucide-react';

export function CheeseDairyPage() {
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedBooking, setSelectedBooking] = useState(null);

  const { data: bookings = [], isLoading, refetch } = useQuery({
    queryKey: ['pms_bookings'],
    queryFn: () => bookingService.getBookings(),
  });

  const activeBookings = bookings.filter(b => b.status === 'active');

  const pendingBookings = activeBookings.filter(
    b => b.departments?.cheeseDairy?.status === 'Pending'
  );
  const completedBookings = activeBookings.filter(
    b => b.departments?.cheeseDairy?.status === 'Complete'
  );

  const currentList = activeTab === 'pending' ? pendingBookings : completedBookings;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-pms-border pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Cheese & Dairy Products</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track and complete cheese & dairy procurement for upcoming catering events.
          </p>
        </div>

        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </Button>
      </div>

      <div className="flex items-center gap-2 border-b border-pms-border">
        <button
          onClick={() => setActiveTab('pending')}
          className={`py-2 px-4 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-pms-primary text-white font-bold'
              : 'text-pms-muted hover:text-pms-text bg-slate-100'
          }`}
        >
          Pending ({pendingBookings.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`py-2 px-4 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer ${
            activeTab === 'history'
              ? 'bg-pms-primary text-white font-bold'
              : 'text-pms-muted hover:text-pms-text bg-slate-100'
          }`}
        >
          History ({completedBookings.length})
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-400">
          Loading Cheese & Dairy records...
        </div>
      ) : (
        <DepartmentTable
          bookings={currentList}
          deptKey="cheeseDairy"
          isPendingTab={activeTab === 'pending'}
          onUpdate={(b) => setSelectedBooking(b)}
        />
      )}

      {selectedBooking && (
        <CheeseDairyModal
          isOpen={Boolean(selectedBooking)}
          onClose={() => setSelectedBooking(null)}
          booking={selectedBooking}
        />
      )}
    </div>
  );
}
