import React from 'react';
import { StatusBadge } from '../../../components/shared/StatusBadge';
import { DelayBadge } from '../../../components/shared/DelayBadge';
import { Button } from '../../../components/common/Button';
import { formatDateDisplay } from '../../../utils/dateUtils';
import { derivedPlannedDate, calculateDelayInfo } from '../../../utils/delayUtils';
import { storageService } from '../../../services/storageService';
import { Paperclip } from 'lucide-react';

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
      title="View Attachment Proof"
    >
      <Paperclip className="w-3.5 h-3.5 text-pms-accent" />
      <span className="max-w-[120px] truncate">{attachment.name || 'View Proof'}</span>
    </button>
  );
}

export function DepartmentTable({ bookings = [], deptKey, isPendingTab, onUpdate, onViewMenu }) {
  if (!bookings.length) {
    return (
      <div className="bg-white border border-pms-border rounded-xl p-12 text-center">
        <h3 className="text-base font-semibold text-pms-text">Nothing here</h3>
        <p className="text-xs text-pms-muted mt-1">
          {isPendingTab ? 'All caught up on this department.' : 'No completed tasks yet.'}
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
              <th className="py-3 px-4">Action</th>
              <th className="py-3 px-4">Booking ID</th>
              <th className="py-3 px-4">Customer</th>
              <th className="py-3 px-4">Event Date</th>
              {isPendingTab && <th className="py-3 px-4">Planned Date</th>}
              <th className="py-3 px-4">Venue</th>
              <th className="py-3 px-4">Guests</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Delay Days</th>
              {!isPendingTab && <th className="py-3 px-4">Remarks</th>}
              {!isPendingTab && <th className="py-3 px-4">Attachment</th>}
              <th className="py-3 px-4">Updated By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pms-border">
            {bookings.map((b) => {
              const deptData = b.departments?.[deptKey] || {};
              const plannedDate = derivedPlannedDate(b.eventDate);
              const delayInfo = calculateDelayInfo(plannedDate, deptData.status, deptData.updatedAt);

              const rowTint = delayInfo.cls === 'delayed'
                ? 'bg-red-50/40 hover:bg-red-50/70'
                : delayInfo.cls === 'atrisk'
                ? 'bg-amber-50/40 hover:bg-amber-50/70'
                : 'hover:bg-slate-50/80';

              let remarksText = '—';
              let attachmentElement = <span className="text-slate-400">—</span>;

              if ((deptKey === 'vegetables' || deptKey === 'cheeseDairy') && Array.isArray(deptData.entries) && deptData.entries.length > 0) {
                const remarksList = deptData.entries
                  .map(e => e.remarks)
                  .filter(Boolean);
                remarksText = remarksList.length > 0 ? remarksList.join('; ') : '—';

                const entryWithAttachment = deptData.entries.find(e => e.attachment && (e.attachment.name || e.attachment.path));
                if (entryWithAttachment) {
                  attachmentElement = <AttachmentCell attachment={entryWithAttachment.attachment} />;
                }
              } else {
                remarksText = deptData.remarks || '—';
                attachmentElement = <AttachmentCell attachment={deptData.attachment} />;
              }

              return (
                <tr key={b.id} className={`transition-colors ${rowTint}`}>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <Button size="sm" variant="primary" onClick={() => onUpdate(b)}>
                      Update
                    </Button>
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-pms-primary">
                    {b.id}
                  </td>
                  <td className="py-3 px-4 font-semibold text-pms-text">
                    {b.customerName}
                  </td>
                  <td className="py-3 px-4 text-pms-text font-medium">
                    {formatDateDisplay(b.eventDate)}
                  </td>
                  {isPendingTab && (
                    <td className="py-3 px-4 text-pms-muted font-medium">
                      {formatDateDisplay(plannedDate)}
                    </td>
                  )}
                  <td className="py-3 px-4 text-pms-muted">
                    {b.venueName || '—'}
                  </td>
                  <td className="py-3 px-4 text-pms-text font-medium">
                    {b.guestCount || '—'}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={deptData.status || 'Pending'} />
                  </td>
                  <td className="py-3 px-4">
                    <DelayBadge delayInfo={delayInfo} />
                  </td>
                  {!isPendingTab && (
                    <td className="py-3 px-4 max-w-[180px] truncate text-slate-700 font-normal">
                      {remarksText}
                    </td>
                  )}
                  {!isPendingTab && (
                    <td className="py-3 px-4 whitespace-nowrap">
                      {attachmentElement}
                    </td>
                  )}
                  <td className="py-3 px-4 text-pms-muted">
                    {deptData.updatedBy || '—'}
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
