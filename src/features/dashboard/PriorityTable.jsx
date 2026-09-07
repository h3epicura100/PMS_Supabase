import React from 'react';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { DelayBadge } from '../../components/shared/DelayBadge';
import { formatDateDisplay, formatDateRangeDisplay } from '../../utils/dateUtils';

export function PriorityTable({ items = [] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
        <h3 className="text-base font-bold text-pms-text">Today's Priority</h3>
      </div>

      {!items.length ? (
        <div className="bg-white border border-pms-border rounded-xl p-6 text-center text-xs text-pms-muted">
          Nothing due today, and nothing delayed. All clear.
        </div>
      ) : (
        <>
          {/* Mobile Card Layout (Visible on screens < md) */}
          <div className="space-y-3 md:hidden">
            {items.map(({ booking, deptConfig, deptData, plannedDate, delayInfo }) => {
              const cardBorderTint = delayInfo.cls === 'delayed'
                ? 'border-red-300 bg-red-50/40'
                : 'border-amber-300 bg-amber-50/40';
              const dateRange = formatDateRangeDisplay(booking.eventStartDate || booking.eventDate, booking.eventEndDate || booking.eventDate);

              return (
                <div
                  key={`${booking.id}_${deptConfig.key}`}
                  className={`border rounded-xl p-4 shadow-sm space-y-2.5 ${cardBorderTint}`}
                >
                  <div className="flex items-start justify-between gap-2 border-b border-slate-200/60 pb-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-pms-primary block">
                        {booking.id}
                      </span>
                      <span className="text-sm font-bold text-pms-text block mt-0.5">
                        {booking.customerName}
                      </span>
                    </div>
                    <span className="bg-white border border-slate-200 text-slate-800 text-[11px] font-semibold px-2 py-0.5 rounded shadow-2xs">
                      {deptConfig.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={deptData.status || 'Pending'} />
                    <DelayBadge delayInfo={delayInfo} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs pt-1">
                    <div className="flex items-center justify-between sm:justify-start sm:gap-3 py-0.5">
                      <span className="text-[11px] font-semibold uppercase text-slate-400">Event Date:</span>
                      <span className="font-medium text-pms-text">{dateRange}</span>
                    </div>
                    <div className="flex items-center justify-between sm:justify-start sm:gap-3 py-0.5">
                      <span className="text-[11px] font-semibold uppercase text-slate-400">Planned Date:</span>
                      <span className="font-medium text-pms-muted">{formatDateDisplay(plannedDate)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table (Visible on screens >= md) */}
          <div className="hidden md:block bg-white border border-pms-border rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-pms-border text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Booking ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Event Date</th>
                    <th className="py-3 px-4">Planned Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Delay Days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pms-border">
                  {items.map(({ booking, deptConfig, deptData, plannedDate, delayInfo }) => {
                    const rowTint = delayInfo.cls === 'delayed' ? 'bg-red-50/50' : 'bg-amber-50/50';
                    const dateRange = formatDateRangeDisplay(booking.eventStartDate || booking.eventDate, booking.eventEndDate || booking.eventDate);

                    return (
                      <tr key={`${booking.id}_${deptConfig.key}`} className={`${rowTint} hover:bg-slate-100/80 transition-colors`}>
                        <td className="py-3 px-4 font-mono font-semibold text-pms-primary">
                          {booking.id}
                        </td>
                        <td className="py-3 px-4 font-semibold text-pms-text">
                          {booking.customerName}
                        </td>
                        <td className="py-3 px-4 font-medium text-pms-text">
                          {deptConfig.label}
                        </td>
                        <td className="py-3 px-4 text-pms-text font-medium whitespace-nowrap">
                          {dateRange}
                        </td>
                        <td className="py-3 px-4 text-pms-muted font-medium whitespace-nowrap">
                          {formatDateDisplay(plannedDate)}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={deptData.status || 'Pending'} />
                        </td>
                        <td className="py-3 px-4">
                          <DelayBadge delayInfo={delayInfo} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
