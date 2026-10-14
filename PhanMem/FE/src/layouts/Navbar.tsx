import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Clock, Cpu } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

interface NavbarProps {
  onToggleSidebar: () => void;
}

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Trang chủ',
  sensor: 'Dữ liệu cảm biến',
  history: 'Lịch sử hoạt động',
  profile: 'Thông tin cá nhân',
};

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const location = useLocation();
  const currentTab = location.pathname.substring(1) || 'dashboard';
  const { isEsp32Online } = useApp();

  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const secs = String(now.getSeconds()).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      setTimeStr(`${hours}:${mins}:${secs} - ${day}/${month}/${year}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-6 shadow-xs">
      {/* Nút Toggle Sidebar & Tiêu đề trang */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none cursor-pointer"
        >
          <Menu className="h-5.5 w-5.5" />
        </button>
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">
          {PAGE_TITLES[currentTab] || 'Trang chủ'}
        </h2>
      </div>

      {/* Trạng thái ESP32 Online & Thời gian */}
      <div className="flex items-center gap-3">
        {/* ESP32 Status Badge */}
        {isEsp32Online ? (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200/70 px-3 py-1.5 text-emerald-700 font-bold text-xs shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <Cpu className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>ESP32 Online</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl bg-slate-100 border border-slate-200 px-3 py-1.5 text-slate-500 font-bold text-xs shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-400" />
            </span>
            <Cpu className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span>ESP32 Offline</span>
          </div>
        )}

        {/* Real-time Clock */}
        <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-100 px-3.5 py-1.5 text-slate-600 font-bold text-xs shadow-sm">
          <Clock className="h-4 w-4 text-slate-400" />
          <span className="tabular-nums">{timeStr}</span>
        </div>
      </div>
    </header>
  );
};
