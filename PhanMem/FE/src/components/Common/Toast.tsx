import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 3000,
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />,
    error: <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />,
    warning: <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />,
    info: <Info className="h-5 w-5 text-sky-500 shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-100 bg-emerald-50/50',
    error: 'border-rose-100 bg-rose-50/50',
    warning: 'border-amber-100 bg-amber-50/50',
    info: 'border-sky-100 bg-sky-50/50',
  };

  return (
    <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-2xl border p-4 shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-5 fade-in duration-300 ${borders[type]}`}>
      {icons[type]}
      <p className="text-xs font-bold text-slate-800 leading-normal tracking-wide">{message}</p>
      <button
        onClick={onClose}
        className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/50 hover:text-slate-700 transition focus:outline-none"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
