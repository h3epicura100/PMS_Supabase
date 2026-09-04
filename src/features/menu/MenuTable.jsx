import React from 'react';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { Button } from '../../components/common/Button';
import { formatDateRangeDisplay } from '../../utils/dateUtils';
import { storageService } from '../../services/storageService';
import { Paperclip, Calendar } from 'lucide-react';

function AttachmentCell({ attachment }) {
  if (!attachment || (!attachment.name && !attachment.path)) {
    return <span className="text-slate-400">—</span>;
  }

  const handleView = async () => {
    if (attachment.path?.startsWith('data:')) {
      window.open(attachment.path, '_blank');
      return;
    }
    const url = await storageService.getSignedUrl(attachment.path);
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <button
      onClick={handleView}
      type="button"
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-pms-primary bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
      title="View Attachment"
    >
      <Paperclip className="w-3.5 h-3.5 text-pms-accent" />
      <span className="max-w-[130px] truncate">{attachment.name || 'View Attachment'}</span>
    </button>
  );
}

export function MenuTable({ bookings = [], onUpdateMenu }) {
  if (!bookings.length) {
    return (
      <div className="bg-white border border-pms-border rounded-xl p-12 text-center">
        <h3 className="text-base font-semibold text-pms-text">Nothing here</h3>
        <p className="text-xs text-pms-muted mt-1">No bookings found in this view.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-pms-border rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-pms-border text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Booking ID</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Event Date</th>
              <th className="py-3 px-4">Venue</th>
              <th className="py-3 px-4">Guests</th>
              <th className="py-3 px-4">Menu Status</th>
              <th className="py-3 px-4">Remarks</th>
              <th className="py-3 px-4">Attachment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pms-border">
            {bookings.map((b) => {
              const displayRemarks = b.menu?.remarks || b.menu?.reason || '—';
              const menuStatus = b.menu?.status || (b.status === 'closed' || b.closed ? 'Finalized' : 'Pending');
              const dateRange = formatDateRangeDisplay(b.eventStartDate || b.eventDate, b.eventEndDate || b.eventDate);
              const sessionCount = b.eventSchedule?.length || 0;
              const paxDisplay = (b.totalGuestCount ?? b.guestCount)?.toLocaleString() || '—';

              return (
                <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap">
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => onUpdateMenu(b)}
                    >
                      Update
                    </Button>
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-pms-primary">
                    {b.id}
                  </td>
                  <td className="py-3 px-4 font-semibold text-pms-text">
                    {b.customerName}
                  </td>
                  <td className="py-3 px-4 text-pms-text font-medium whitespace-nowrap">
                    <div>{dateRange}</div>
                    {sessionCount > 1 && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-pms-accent bg-blue-50 px-1.5 py-0.2 rounded font-medium mt-0.5">
                        <Calendar className="w-2.5 h-2.5" />
                        {sessionCount} sessions
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-pms-muted">
                    {b.venueName || '—'}
                  </td>
                  <td className="py-3 px-4 text-pms-text font-medium whitespace-nowrap">
                    <span className="font-mono font-semibold text-slate-800">{paxDisplay}</span>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={menuStatus} />
                  </td>
                  <td className="py-3 px-4 max-w-[200px] truncate text-slate-700 font-normal">
                    {displayRemarks}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <AttachmentCell attachment={b.menu?.attachment} />
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
