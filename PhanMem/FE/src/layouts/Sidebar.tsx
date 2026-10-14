import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Activity, History, User, Cpu, LogOut } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

interface SidebarProps {
  isCollapsed: boolean;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const MENU_ITEMS = [
  { id: 'dashboard', name: 'Trang chủ', icon: LayoutDashboard },
  { id: 'sensor', name: 'Dữ liệu cảm biến', icon: Activity },
  { id: 'history', name: 'Lịch sử hoạt động', icon: History },
  { id: 'profile', name: 'Thông tin cá nhân', icon: User },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  isOpen,
  setIsOpen,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useApp();
  const currentTab = location.pathname.substring(1) || 'dashboard';

  const activeIndex = useMemo(
    () => MENU_ITEMS.findIndex(item => item.id === currentTab),
    [currentTab]
  );

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleTabClick = (tabId: string) => {
    navigate(`/${tabId}`);
    setIsOpen(false);
  };

  return (
    <>
      {/* Lớp phủ mờ đóng menu khi click ra ngoài trên Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-white/40 text-slate-700 transition-all duration-300 ease-in-out backdrop-blur-md
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
          ${isCollapsed ? 'lg:w-20' : 'lg:w-64'} 
          lg:translate-x-0 lg:static h-screen border-r border-white/20 shadow-lg shadow-slate-100/10`}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center gap-3 border-b border-white/20 px-4 py-3 overflow-hidden">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
            <Cpu className="h-6 w-6 animate-pulse" />
          </div>
          <div className={`flex flex-col transition-all duration-300 origin-left whitespace-nowrap
            ${isCollapsed ? 'w-0 opacity-0 scale-95 pointer-events-none' : 'w-auto opacity-100 scale-100'}`}>
            <h1 className="text-sm font-black text-slate-800 tracking-wide">HỆ THỐNG IOT</h1>
            <span className="text-[10px] text-slate-400 font-medium">Smart Home Gateway</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto relative">
          {activeIndex !== -1 && (
            <div 
              className="absolute left-3 right-3 h-11 bg-blue-500 rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-300 ease-out pointer-events-none"
              style={{
                transform: `translateY(${activeIndex * 48}px)`,
                top: '16px',
              }}
            />
          )}

          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 group relative z-10 cursor-pointer
                  ${isActive 
                    ? 'text-white' 
                    : 'text-slate-600 hover:bg-slate-200/30 hover:text-slate-900'}`}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className={`h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
                <span className={`truncate transition-all duration-300 origin-left whitespace-nowrap
                  ${isCollapsed ? 'w-0 opacity-0 scale-95 pointer-events-none ml-0' : 'w-auto opacity-100 scale-100'}`}>
                  {item.name}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer - Nút Đăng xuất */}
        <div className="p-3 border-t border-slate-100 mt-auto">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 group text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer"
            title={isCollapsed ? 'Đăng xuất' : undefined}
          >
            <LogOut className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110 text-red-400 group-hover:text-red-600" />
            <span className={`truncate transition-all duration-300 origin-left whitespace-nowrap
              ${isCollapsed ? 'w-0 opacity-0 scale-95 pointer-events-none ml-0' : 'w-auto opacity-100 scale-100'}`}>
              Đăng xuất
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};
