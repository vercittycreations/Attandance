import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { usePresence } from '../../hooks/usePresence';
import NotificationPrompt from '../common/NotificationPrompt';
import InstallPrompt from '../common/InstallPrompt';
import { Capacitor } from '@capacitor/core';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isNative = Capacitor.isNativePlatform();
  usePresence();

  return (
    <div
      className="flex overflow-hidden bg-surface-950"
      style={{
        height: '100dvh', // ✅ dynamic viewport height
        paddingTop: isNative ? 'env(safe-area-inset-top, 40px)' : '0px',
        paddingBottom: isNative ? 'env(safe-area-inset-bottom, 0px)' : '0px',
      }}
    >
      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300
        lg:relative lg:translate-x-0 lg:flex-shrink-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      <InstallPrompt />
      <NotificationPrompt />
    </div>
  );
}