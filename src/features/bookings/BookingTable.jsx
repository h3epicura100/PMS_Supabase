import React from 'react';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Button } from '../../components/common/Button';
import { formatDateRangeDisplay, formatDateDisplay } from '../../utils/dateUtils';
import { Edit2, RotateCcw, Calendar, Users } from 'lucide-react';

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
              <th className="py-3 px-4">Booking Date</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Event</th>
              <th className="py-3 px-4">Event Date</th>
              <th className="py-3 px-4">Guests</th>
              <th className="py-3 px-4">Reference</th>
              <th className="py-3 px-4">Remarks</th>
              <th className="py-3 px-4">Menu Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pms-border">
            {bookings.map((b) => {
              const menuStatus = b.menu?.status === 'Finalized' ? 'Complete' : 'Pending';
              const dateRange = formatDateRangeDisplay(b.eventStartDate || b.eventDate, b.eventEndDate || b.eventDate);
              const sessionCount = b.eventSchedule?.length || 0;
              const paxDisplay = (b.totalGuestCount ?? b.guestCount)?.toLocaleString() || '—';

              return (
                <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-pms-primary">
                    {b.id}
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium whitespace-nowrap">
                    {formatDateDisplay(b.bookingDate || b.createdAt)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-pms-text">{b.customerName}</div>
                    <div className="text-[11px] text-pms-muted font-mono">{b.customerMobile}</div>
                  </td>
                  <td className="py-3 px-4 text-pms-text">
                    <span className="font-medium">{b.functionType || '—'}</span>
                    {b.venueName && (
                      <div className="text-[11px] text-pms-muted truncate max-w-[150px]">{b.venueName}</div>
                    )}
                  </td>
                  <td className="py-3 px-4 font-medium text-pms-text whitespace-nowrap">
                    <div>{dateRange}</div>
                    {sessionCount > 1 && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-pms-accent bg-blue-50 px-1.5 py-0.2 rounded font-medium mt-0.5">
                        <Calendar className="w-2.5 h-2.5" />
                        {sessionCount} sessions
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-pms-text font-medium whitespace-nowrap">
                    <div className="font-mono font-semibold text-slate-800">{paxDisplay}</div>
                    {sessionCount > 1 && (
                      <span className="text-[10px] text-slate-400">Total Guests</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-pms-muted">
                    <div>{b.referenceName || '—'}</div>
                    {b.referenceNumber && (
                      <div className="text-[10px] font-mono">{b.referenceNumber}</div>
                    )}
                  </td>
                  <td className="py-3 px-4 max-w-[180px] text-slate-700 font-normal">
                    {b.remarks ? (
                      <span className="truncate block" title={b.remarks}>{b.remarks}</span>
                    ) : (
                      <span className="text-slate-400">—</span>
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
