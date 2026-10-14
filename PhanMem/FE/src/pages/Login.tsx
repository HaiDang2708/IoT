import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Common/Button';
import { Toast } from '../components/Common/Toast';
import { LogIn, User, Lock, Activity, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useApp();

  // Tự động chuyển vào Dashboard nếu đã đăng nhập
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Quản lý form trong 1 state duy nhất
  const [form, setForm] = useState({
    username: '',
    password: '',
    remember: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const username = form.username.trim();
    const password = form.password.trim();

    if (!username || !password) {
      setToastMessage('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!');
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(username, password);
      if (success) {
        navigate('/dashboard');
      } else {
        setToastMessage('Tên đăng nhập hoặc mật khẩu không chính xác!');
      }
    } catch (err: any) {
      setToastMessage(err.message || 'Lỗi khi kết nối tới máy chủ!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-tr from-slate-100 via-sky-50 to-slate-100 relative overflow-hidden font-sans">
      {/* Background glowing effects */}
      <div className="absolute top-[-10%] left-[-10%] h-[60%] w-[60%] rounded-full bg-sky-300/20 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[60%] w-[60%] rounded-full bg-indigo-300/20 blur-[130px] pointer-events-none" />

      <div className="w-full max-w-md p-6 relative z-10 animate-in fade-in zoom-in-95 duration-300">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-xl shadow-sky-500/20 mb-4 ring-4 ring-white">
            <Activity className="h-7 w-7 animate-pulse" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800">SmartHome IoT</h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">Hệ thống giám sát và điều khiển</p>
        </div>

        {/* Login Form Panel Card */}
        <div className="rounded-3xl border border-white/60 bg-white/75 p-8 shadow-2xl shadow-slate-200/80 backdrop-blur-xl">
          <h2 className="text-lg font-extrabold text-slate-800 mb-6">Đăng nhập hệ thống</h2>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Input */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Tên đăng nhập
              </label>
              <div className="relative flex items-center rounded-xl border border-slate-200 bg-white focus-within:ring-4 focus-within:ring-sky-100 focus-within:border-sky-500 transition duration-200">
                <User className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  name="username"
                  required
                  placeholder="Tên đăng nhập..."
                  value={form.username}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full h-11 pl-10 pr-4 text-xs font-semibold text-slate-700 bg-transparent focus:outline-none placeholder-slate-400"
                />
              </div>
            </div>

            {/* Password Input (có nút hiện/ẩn) */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Mật khẩu
              </label>
              <div className="relative flex items-center rounded-xl border border-slate-200 bg-white focus-within:ring-4 focus-within:ring-sky-100 focus-within:border-sky-500 transition duration-200">
                <Lock className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="w-full h-11 pl-10 pr-10 text-xs font-semibold text-slate-700 bg-transparent focus:outline-none placeholder-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember info */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold select-none gap-2 pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  name="remember"
                  checked={form.remember}
                  onChange={handleChange}
                  className="rounded border-slate-300 bg-white text-sky-500 focus:ring-0 cursor-pointer"
                />
                <span>Ghi nhớ phiên</span>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              icon={LogIn}
              className="w-full h-11 rounded-xl shadow-lg shadow-sky-500/10 font-bold mt-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 border-none text-white transition duration-200"
              isLoading={isLoading}
            >
              {isLoading ? 'Đang xác thực...' : 'Đăng Nhập'}
            </Button>
          </form>
        </div>

        {/* Footer legal text */}
        <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-8">
          Đề tài nghiên cứu khoa học IoT &copy; 2026
        </p>
      </div>

      {toastMessage && (
        <Toast
          message={toastMessage}
          type="error"
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
};
