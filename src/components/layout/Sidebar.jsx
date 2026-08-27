import React from 'react';
import { NavLink } from 'react-router-dom';
import { NAVIGATION } from '../../constants/permissions';
import { useAuth } from '../../hooks/useAuth';

export function Sidebar({ isOpen, onCloseMobile }) {
  const { currentUser, userPermissions, logout, hasAccess } = useAuth();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 h-screen bg-pms-primary text-white flex flex-col shrink-0 transition-transform duration-200 ease-in-out lg:sticky lg:top-0 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="p-5 border-b border-blue-700/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/H3-logo.svg"
              alt="H3 Logo"
              className="w-10 h-10 object-contain bg-white rounded-lg p-1 shadow-sm"
            />
            <div>
              <h1 className="font-bold text-lg leading-tight">Order Rail</h1>
              <p className="text-[10px] text-blue-200 tracking-wider uppercase font-medium">Catering Ops</p>
            </div>
          </div>
        </div>

        {/* Navigation items grouped */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {NAVIGATION.map((group, gIdx) => {
            const visibleItems = group.items.filter(item => hasAccess(item.key));
            if (!visibleItems.length) return null;

            return (
              <div key={gIdx} className="space-y-1">
                {group.group && (
                  <div className="px-3 text-[10px] font-semibold tracking-wider text-blue-300 uppercase mb-2">
                    {group.group}
                  </div>
                )}

                {visibleItems.map((item) => (
                  <NavLink
                    key={item.route}
                    to={item.route}
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                        isActive
                          ? 'bg-blue-700 text-white font-semibold shadow-sm'
                          : 'text-blue-100 hover:bg-blue-800/80 hover:text-white'
                      }`
                    }
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            );
          })}
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-blue-700/50 bg-blue-900/30">
          <div className="mb-2">
            <div className="text-xs font-semibold text-white truncate">
              {currentUser?.display_name || currentUser?.id || 'User'}
            </div>
            <div className="text-[10px] text-blue-300 uppercase tracking-wider">
              {currentUser?.role || 'Staff'}
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full text-xs text-blue-200 border border-blue-700 hover:bg-blue-800 hover:text-white rounded-md py-1.5 transition-colors font-medium"
          >
            Log Out
          </button>
        </div>
      </aside>
    </>
  );
}
