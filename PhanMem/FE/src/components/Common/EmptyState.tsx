import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
  description?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message = 'Không có dữ liệu',
  description = 'Hệ thống hiện chưa ghi nhận thông tin nào phù hợp.',
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-200/80 rounded-2xl bg-slate-50/50">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 mb-3 shadow-inner">
        <Inbox className="h-6 w-6" />
      </div>
      <h3 className="text-sm font-bold text-slate-700 tracking-tight">{message}</h3>
      {description && <p className="text-xs text-slate-450 mt-1 max-w-xs leading-relaxed">{description}</p>}
    </div>
  );
};
