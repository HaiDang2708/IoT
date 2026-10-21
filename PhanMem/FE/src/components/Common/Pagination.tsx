import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
  onItemsPerPageChange?: (size: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  className = '',
}) => {
  const safeTotalPages = Math.max(1, totalPages);
  const [inputValue, setInputValue] = useState<string>(String(itemsPerPage || 10));

  useEffect(() => {
    if (itemsPerPage !== undefined) {
      setInputValue(String(itemsPerPage));
    }
  }, [itemsPerPage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlurOrSubmit = () => {
    const parsed = parseInt(inputValue, 10);
    if (!isNaN(parsed) && parsed > 0) {
      const validSize = Math.min(Math.max(parsed, 1), 200); // Giới hạn 1 - 200 bản ghi
      setInputValue(String(validSize));
      if (onItemsPerPageChange && validSize !== itemsPerPage) {
        onItemsPerPageChange(validSize);
        onPageChange(1); // Reset về trang 1
      }
    } else {
      setInputValue(String(itemsPerPage || 10));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 py-3 px-1 border-t border-slate-100 bg-white/95 shrink-0 ${className}`}>
      {/* Bên trái: Ô nhập số bản ghi trên mỗi trang */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className="font-medium text-slate-600">Hiển thị</span>
        
        {/* Ô nhập số lượng bản ghi tuỳ ý */}
        <div className="inline-flex items-center">
          <input
            type="number"
            min={1}
            max={200}
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlurOrSubmit}
            onKeyDown={handleKeyDown}
            title="Nhập số bản ghi trên mỗi trang (nhấn Enter để áp dụng)"
            className="w-14 h-8 px-2 text-center text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:border-slate-300 focus:bg-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all shadow-inner"
          />
        </div>

        <span className="text-slate-500">bản ghi / trang</span>
      </div>

      {/* Bên phải: Nút Trước / Trang X / Y / Sau */}
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          icon={ChevronLeft}
          className="rounded-xl px-2.5 h-8.5 text-xs font-semibold"
          title="Trang trước"
        >
          Trước
        </Button>
        <span className="text-xs font-bold text-slate-700 px-3 whitespace-nowrap bg-slate-50 border border-slate-100 py-1.5 rounded-lg">
          Trang {currentPage} / {safeTotalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= safeTotalPages}
          icon={ChevronRight}
          iconPosition="right"
          className="rounded-xl px-2.5 h-8.5 text-xs font-semibold"
          title="Trang sau"
        >
          Sau
        </Button>
      </div>
    </div>
  );
};

