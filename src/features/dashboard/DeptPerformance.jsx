import React from 'react';

export function DeptPerformance({ performance = [] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
        <h3 className="text-base font-bold text-pms-text">Department Performance</h3>
      </div>

      <div className="bg-white border border-pms-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-pms-border text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Total Tasks</th>
                <th className="py-3 px-4">Pending</th>
                <th className="py-3 px-4">Complete</th>
                <th className="py-3 px-4">Due Today</th>
                <th className="py-3 px-4">Delayed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pms-border">
              {performance.map((d) => (
                <tr key={d.key} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-semibold text-pms-text">
                    {d.label}
                  </td>
                  <td className="py-3 px-4 text-pms-text font-medium">{d.total}</td>
                  <td className="py-3 px-4 text-pms-text font-medium">{d.pending}</td>
                  <td className="py-3 px-4 text-emerald-600 font-semibold">{d.complete}</td>
                  <td className={`py-3 px-4 font-semibold ${d.dueToday > 0 ? 'text-amber-600 font-bold' : 'text-pms-text'}`}>
                    {d.dueToday}
                  </td>
                  <td className={`py-3 px-4 font-semibold ${d.delayed > 0 ? 'text-red-600 font-bold' : 'text-pms-text'}`}>
                    {d.delayed}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
