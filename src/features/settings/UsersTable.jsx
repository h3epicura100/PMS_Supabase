import React from 'react';
import { Button } from '../../components/common/Button';
import { Edit2, Trash2 } from 'lucide-react';
import { NAVIGATION } from '../../constants/permissions';

export function UsersTable({ users = [], onEdit, onDelete }) {
  const pageLabels = {};
  NAVIGATION.forEach(group => {
    group.items.forEach(item => {
      pageLabels[item.key] = item.label;
    });
  });

  return (
    <div className="bg-white border border-pms-border rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-pms-border text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <th className="py-3 px-4">User ID</th>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Page Access</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pms-border">
            {users.map((u) => {
              const isFull = u.role === 'admin' || u.has_full_access || u.allowedPages?.includes('ALL');

              return (
                <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-semibold text-pms-primary">
                    {u.id}
                  </td>
                  <td className="py-3 px-4 font-semibold text-pms-text">
                    {u.display_name || u.name || '—'}
                  </td>
                  <td className="py-3 px-4 font-medium text-pms-text capitalize">
                    {u.role}
                  </td>
                  <td className="py-3 px-4">
                    {isFull ? (
                      <span className="bg-blue-100 text-pms-primary font-semibold text-[10px] px-2 py-0.5 rounded">
                        Full Access
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {(u.allowedPages || []).map((p) => (
                          <span key={p} className="bg-slate-100 text-slate-700 text-[10px] px-2 py-0.5 rounded font-medium">
                            {pageLabels[p] || p}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button size="sm" variant="ghost" onClick={() => onEdit(u)}>
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => onDelete(u.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </Button>
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
