import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { usePresence } from '../../hooks/usePresence';
import NotificationPrompt from '../common/NotificationPrompt';
import InstallPrompt from '../common/InstallPrompt';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  usePresence();

  return (
    <div className="flex h-screen overflow-hidden bg-surface-950">

      {/* Sidebar overlay — mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64
        transform transition-transform duration-300
        lg:relative lg:translate-x-0 lg:flex-shrink-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-shrink-0">
          <Topbar onMenuClick={() => setSidebarOpen(true)} />
        </div>
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      <InstallPrompt />
      <NotificationPrompt />
    </div>
  );
}