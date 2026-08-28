import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { PageContainer } from './PageContainer';
import { Footer } from './Footer';
import { NAVIGATION } from '../../constants/permissions';
import { useRealtime } from '../../hooks/useRealtime';

export function AppLayout() {
  useRealtime(); // Enable live Supabase PostgreSQL real-time synchronization

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  let currentNav = null;
  for (const group of NAVIGATION) {
    const item = group.items.find(i => i.route === location.pathname);
    if (item) {
      currentNav = item;
      break;
    }
  }

  return (
    <div className="h-screen flex bg-pms-bg overflow-hidden">
      <Sidebar
        isOpen={sidebarOpen}
        onCloseMobile={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto app-main-content">
        <Topbar
          title={currentNav?.label || 'Dashboard'}
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
        />

        <main className="flex-1 flex flex-col justify-between">
          <PageContainer>
            <Outlet />
          </PageContainer>

          <Footer className="border-t border-slate-200/60 bg-white/40 mt-auto" />
        </main>
      </div>
    </div>
  );
}
