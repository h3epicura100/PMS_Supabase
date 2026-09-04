import React from 'react';
import { formatDateRangeDisplay } from '../../utils/dateUtils';
import { calculatePipelineInfo } from '../../utils/bookingUtils';
import { Calendar } from 'lucide-react';

export function UpcomingEvents({ bookings = [] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block" />
        <h3 className="text-base font-bold text-pms-text">Upcoming Events</h3>
      </div>

      {!bookings.length ? (
        <div className="bg-white border border-pms-border rounded-xl p-6 text-center text-xs text-pms-muted">
          Nothing scheduled yet — finalize a menu to see it here.
        </div>
      ) : (
        <div className="bg-white border border-pms-border rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-pms-border text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Booking ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Event Date</th>
                  <th className="py-3 px-4">Guests</th>
                  <th className="py-3 px-4">Overall Progress</th>
                  <th className="py-3 px-4">Pending Departments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pms-border">
                {bookings.map((b) => {
                  const info = calculatePipelineInfo(b);
                  const dateRange = formatDateRangeDisplay(b.eventStartDate || b.eventDate, b.eventEndDate || b.eventDate);
                  const sessionCount = b.eventSchedule?.length || 0;
                  const paxDisplay = (b.totalGuestCount ?? b.guestCount)?.toLocaleString() || '—';

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
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
                      <td className="py-3 px-4 text-pms-text font-medium whitespace-nowrap">
                        <span className="font-mono font-semibold text-slate-800">{paxDisplay}</span>
                      </td>
                      <td className="py-3 px-4 min-w-[140px]">
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-1">
                          <div
                            className="bg-pms-primary h-full rounded-full transition-all duration-300"
                            style={{ width: `${info.pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-pms-muted font-medium">
                          {info.pct}% ({info.done}/{info.total})
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {info.pending.length ? (
                          <div className="flex flex-wrap gap-1">
                            {info.pending.slice(0, 3).map((p, idx) => (
                              <span key={idx} className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded font-medium">
                                {p}
                              </span>
                            ))}
                            {info.pending.length > 3 && (
                              <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded font-medium">
                                +{info.pending.length - 3} more
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-emerald-600 font-medium text-[11px]">All clear</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
