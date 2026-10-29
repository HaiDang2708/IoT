import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export const CopyTimeButton: React.FC<{ timeStr: string }> = ({ timeStr }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(timeStr);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error('Không thể sao chép:', err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? 'Đã sao chép!' : 'Sao chép thời gian'}
      className={`inline-flex items-center justify-center p-1 rounded-md transition-all duration-200 ${
        copied
          ? 'bg-emerald-50 text-emerald-600 scale-105'
          : 'text-slate-400 hover:text-sky-600 hover:bg-slate-100 opacity-60 hover:opacity-100'
      }`}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
};
