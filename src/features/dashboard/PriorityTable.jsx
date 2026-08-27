import React from 'react';
import { StatusBadge } from '../../components/shared/StatusBadge';
import { DelayBadge } from '../../components/shared/DelayBadge';
import { Button } from '../../components/common/Button';
import { formatDateDisplay } from '../../utils/dateUtils';
import { AlertCircle } from 'lucide-react';

export function PriorityTable({ items = [], onUpdateDept }) {
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
        <div className="bg-white border border-pms-border rounded-xl overflow-hidden shadow-sm">
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
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pms-border">
                {items.map(({ booking, deptConfig, deptData, plannedDate, delayInfo }) => {
                  const rowTint = delayInfo.cls === 'delayed' ? 'bg-red-50/50' : 'bg-amber-50/50';

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
                      <td className="py-3 px-4 text-pms-text font-medium">
                        {formatDateDisplay(booking.eventDate)}
                      </td>
                      <td className="py-3 px-4 text-pms-muted font-medium">
                        {formatDateDisplay(plannedDate)}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={deptData.status || 'Pending'} />
                      </td>
                      <td className="py-3 px-4">
                        <DelayBadge delayInfo={delayInfo} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => onUpdateDept(booking, deptConfig)}
                        >
                          Update
                        </Button>
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
