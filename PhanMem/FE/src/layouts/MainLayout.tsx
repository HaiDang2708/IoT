import React, { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const MainLayout: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('dang_iot_sidebar_collapsed');
    return saved !== null ? saved === 'true' : true;
  });
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState(false);

  const toggleSidebar = useCallback(() => {
    if (window.innerWidth <= 992) {
      setIsSidebarOpenMobile(prev => !prev);
    } else {
      setIsSidebarCollapsed(prev => {
        const next = !prev;
        localStorage.setItem('dang_iot_sidebar_collapsed', String(next));
        return next;
      });
    }
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        isOpen={isSidebarOpenMobile}
        setIsOpen={setIsSidebarOpenMobile}
      />

      {/* Main Screen Container */}
      <div className="flex flex-col flex-1 h-screen min-w-0 overflow-hidden relative">
        <Navbar onToggleSidebar={toggleSidebar} />

        <main className="flex-1 min-h-0 overflow-hidden p-4 md:p-5 flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
