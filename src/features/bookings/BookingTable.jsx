import React from 'react';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Button } from '../../components/common/Button';
import { formatDateDisplay } from '../../utils/dateUtils';
import { Edit2, RotateCcw } from 'lucide-react';

export function BookingTable({ bookings = [], isHistoryTab = false, onEdit, onReopen }) {
  if (!bookings.length) {
    return (
      <div className="bg-white border border-pms-border rounded-xl p-12 text-center">
        <h3 className="text-base font-semibold text-pms-text">Nothing here</h3>
        <p className="text-xs text-pms-muted mt-1">
          {isHistoryTab ? 'No cancelled or closed bookings yet.' : 'No active bookings yet.'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-pms-border rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-pms-border text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <th className="py-3 px-4">Booking ID</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Event</th>
              <th className="py-3 px-4">Event Date</th>
              <th className="py-3 px-4">Guests</th>
              <th className="py-3 px-4">Reference</th>
              <th className="py-3 px-4">Menu Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pms-border">
            {bookings.map((b) => {
              const menuStatus = b.menu?.status === 'Finalized' ? 'Complete' : 'Pending';

              return (
                <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-pms-primary">
                    {b.id}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-pms-text">{b.customerName}</div>
                    <div className="text-[11px] text-pms-muted font-mono">{b.customerMobile}</div>
                  </td>
                  <td className="py-3 px-4 text-pms-text">
                    {b.functionType || '—'}
                  </td>
                  <td className="py-3 px-4 font-medium text-pms-text">
                    {formatDateDisplay(b.eventDate)}
                  </td>
                  <td className="py-3 px-4 text-pms-text font-medium">
                    {b.guestCount || '—'}
                  </td>
                  <td className="py-3 px-4 text-pms-muted">
                    <div>{b.referenceName || '—'}</div>
                    {b.referenceNumber && (
                      <div className="text-[10px] font-mono">{b.referenceNumber}</div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={menuStatus} />
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(b)}
                        title="Edit booking"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </Button>

                      {isHistoryTab && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onReopen(b.id)}
                          title="Reopen booking"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-pms-accent" />
                          <span>Reopen</span>
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
