import React from 'react';

export function DeptPerformance({ deptStats = [], performance = [] }) {
  const data = deptStats.length ? deptStats : performance;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
        <h3 className="text-base font-bold text-pms-text">Department Performance</h3>
      </div>

      {!data.length ? (
        <div className="bg-white border border-pms-border rounded-xl p-6 text-center text-xs text-pms-muted">
          No department data available.
        </div>
      ) : (
        <>
          {/* Mobile Card Layout (Visible on screens < md) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
            {data.map((d) => (
              <div
                key={d.key}
                className="bg-white border border-pms-border rounded-xl p-3.5 shadow-sm space-y-2.5"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-sm text-pms-text">{d.label}</span>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {d.total} tasks
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">Pending</span>
                    <span className="font-bold text-slate-700 text-sm">{d.pending}</span>
                  </div>
                  <div className="bg-emerald-50/60 border border-emerald-100/60 p-2 rounded-lg">
                    <span className="text-[10px] uppercase font-semibold text-emerald-600 block">Complete</span>
                    <span className="font-bold text-emerald-700 text-sm">{d.complete}</span>
                  </div>
                  <div className="bg-amber-50/60 border border-amber-100/60 p-2 rounded-lg">
                    <span className="text-[10px] uppercase font-semibold text-amber-600 block">Due Today</span>
                    <span className="font-bold text-amber-700 text-sm">{d.dueToday}</span>
                  </div>
                  <div className="bg-red-50/60 border border-red-100/60 p-2 rounded-lg">
                    <span className="text-[10px] uppercase font-semibold text-red-600 block">Delayed</span>
                    <span className="font-bold text-red-700 text-sm">{d.delayed}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table (Visible on screens >= md) */}
          <div className="hidden md:block bg-white border border-pms-border rounded-xl overflow-hidden shadow-sm">
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
                  {data.map((d) => (
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
        </>
      )}
    </div>
  );
}
