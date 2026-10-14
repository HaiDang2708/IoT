import React from 'react';

interface LoadingProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Loading: React.FC<LoadingProps> = ({
  text = 'Đang tải...',
  size = 'md',
}) => {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-3',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-4">
      <div
        className={`animate-spin rounded-full border-sky-500 border-t-transparent ${sizes[size]}`}
        role="status"
      />
      {text && <span className="text-xs font-semibold text-slate-450 tracking-wide">{text}</span>}
    </div>
  );
};
