import React from 'react';
import { formatDateRangeDisplay } from '../../utils/dateUtils';
import { calculatePipelineInfo } from '../../utils/bookingUtils';
import { Calendar } from 'lucide-react';

export function BookingProgress({ bookings = [] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
        <h3 className="text-base font-bold text-pms-text">Booking Progress</h3>
      </div>

      {!bookings.length ? (
        <div className="bg-white border border-pms-border rounded-xl p-6 text-center text-xs text-pms-muted">
          This fills in once a menu is locked.
        </div>
      ) : (
        <>
          {/* Mobile Card Layout (Visible on screens < md) */}
          <div className="space-y-3.5 md:hidden">
            {bookings.map((b) => {
              const info = calculatePipelineInfo(b);
              const dateRange = formatDateRangeDisplay(b.eventStartDate || b.eventDate, b.eventEndDate || b.eventDate);
              const sessionCount = b.eventSchedule?.length || 0;

              return (
                <div
                  key={b.id}
                  className="bg-white border border-pms-border rounded-xl p-4 shadow-sm space-y-3"
                >
                  {/* Card Header: ID & Customer */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div>
                      <span className="font-mono text-xs font-bold text-pms-primary block">
                        {b.id}
                      </span>
                      <span className="text-sm font-bold text-pms-text block mt-0.5">
                        {b.customerName}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">Status</span>
                      <span className="font-mono font-bold text-slate-800 text-xs">{info.done}/{info.total} done</span>
                    </div>
                  </div>

                  {/* Event Date */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-semibold uppercase text-slate-400">Event Date:</span>
                    <div className="text-right">
                      <span className="font-medium text-pms-text">{dateRange}</span>
                      {sessionCount > 1 && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-pms-accent bg-blue-50 px-1.5 py-0.2 rounded font-medium ml-1.5">
                          <Calendar className="w-2.5 h-2.5" />
                          {sessionCount} sessions
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold uppercase text-slate-400 text-[10px]">Overall Progress</span>
                      <span className="font-medium text-emerald-600 font-mono font-bold">{info.pct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${info.pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Pending Departments */}
                  <div className="pt-2 border-t border-slate-100 text-xs">
                    <span className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">Pending Departments:</span>
                    {info.pending.length ? (
                      <div className="flex flex-wrap gap-1">
                        {info.pending.map((p, idx) => (
                          <span key={idx} className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded font-medium">
                            {p}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-emerald-600 font-medium text-[11px]">All clear</span>
                    )}
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
                    <th className="py-3 px-4">Event Date</th>
                    <th className="py-3 px-4">Overall Progress</th>
                    <th className="py-3 px-4">Completed / Total</th>
                    <th className="py-3 px-4">Pending Departments</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-pms-border">
                  {bookings.map((b) => {
                    const info = calculatePipelineInfo(b);
                    const dateRange = formatDateRangeDisplay(b.eventStartDate || b.eventDate, b.eventEndDate || b.eventDate);
                    const sessionCount = b.eventSchedule?.length || 0;

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
                        <td className="py-3 px-4 min-w-[140px]">
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-1">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${info.pct}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-pms-muted font-medium">{info.pct}%</span>
                        </td>
                        <td className="py-3 px-4 text-pms-text font-medium">
                          {info.done} / {info.total}
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
        </>
      )}
    </div>
  );
}
