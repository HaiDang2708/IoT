import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '../components/Common/Card';
import { Table } from '../components/Common/Table';
import type { Column } from '../components/Common/Table';
import { Pagination } from '../components/Common/Pagination';
import { Search, Filter, ChevronDown, AlertCircle, X, RotateCcw } from 'lucide-react';
import { apiService } from '../services/api/apiService';
import type { RawSensorLog } from '../types';
import { formatDateTime } from '../utils/date';

type SearchCriteria = 'all' | 'temperature' | 'humidity' | 'light' | 'time';

// Hằng số Regex tĩnh ngoài component
const LETTER_REGEX = /[a-zA-Z\u00C0-\u024F\u1E00-\u1EFF]/;
const TIME_REGEX = /^((\d{4}([-/]\d{1,2}([-/]\d{1,2})?)?)|(\d{1,2}(:\d{1,2}(:\d{1,2})?)?)|(\d{4}[-/]\d{1,2}[-/]\d{1,2}\s+\d{1,2}(:\d{1,2}(:\d{1,2})?)?))$/;
const NUMBER_REGEX = /^-?\d+(\.\d+)?$/;

const validateInput = (criteria: SearchCriteria, value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (criteria === 'time') {
    if (LETTER_REGEX.test(trimmed)) {
      return 'Thời gian không được chứa chữ cái (VD: 2026-10-09 hoặc 14:30:00)';
    }
    if (!TIME_REGEX.test(trimmed)) {
      return 'Định dạng thời gian không hợp lệ. Vui lòng nhập ngày (YYYY-MM-DD) hoặc giờ (HH:mm:ss)';
    }
    return null;
  }

  if (criteria === 'temperature' || criteria === 'humidity' || criteria === 'light') {
    if (!NUMBER_REGEX.test(trimmed)) {
      return 'Giá trị cảm biến phải là số hợp lệ (VD: 25 hoặc 30.5)';
    }
    return null;
  }

  return null;
};

// Tra cứu placeholder dạng object lookup gọn gàng
const PLACEHOLDERS: Record<SearchCriteria, string> = {
  time: 'Nhập thời gian...',
  temperature: 'Nhập giá trị nhiệt độ...',
  humidity: 'Nhập giá trị độ ẩm...',
  light: 'Nhập giá trị ánh sáng...',
  all: 'Nhập từ khóa tìm kiếm...',
};

const CRITERIA_OPTIONS: { value: SearchCriteria; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'temperature', label: 'Nhiệt độ' },
  { value: 'humidity', label: 'Độ ẩm' },
  { value: 'light', label: 'Ánh sáng' },
  { value: 'time', label: 'Thời gian' },
];

const getSensorName = (row: RawSensorLog) => {
  if (row.loai_cam_bien === 'temperature' || row.ten_cam_bien?.includes('Nhiệt')) return 'Cảm biến nhiệt độ';
  if (row.loai_cam_bien === 'humidity' || row.ten_cam_bien?.includes('Độ')) return 'Cảm biến độ ẩm';
  if (row.loai_cam_bien === 'light' || row.ten_cam_bien?.includes('Ánh')) return 'Cảm biến ánh sáng';
  return row.ten_cam_bien;
};

// Cấu hình cột cố định ngoài component
const TABLE_COLUMNS: Column<RawSensorLog>[] = [
  {
    key: 'id',
    header: 'ID',
    render: (row) => <span className="font-bold text-slate-700">{row.id}</span>,
  },
  {
    key: 'ten_cam_bien',
    header: 'Tên cảm biến',
    render: (row) => <span className="font-bold text-slate-700">{getSensorName(row)}</span>,
  },
  {
    key: 'gia_tri',
    header: 'Giá trị',
    render: (row) => (
      <span className="font-bold text-sky-600 bg-sky-50 border border-sky-100 px-2.5 py-1 rounded-lg">
        {row.gia_tri} {row.don_vi}
      </span>
    ),
  },
  {
    key: 'timestamp',
    header: 'Thời gian',
    render: (row) => <span className="font-bold text-slate-700">{formatDateTime(row.timestamp)}</span>,
  },
];

export const SensorPage: React.FC = () => {
  const [logs, setLogs] = useState<RawSensorLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [criteria, setCriteria] = useState<SearchCriteria>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const [activeQuery, setActiveQuery] = useState<{ criteria: SearchCriteria; value: string }>({
    criteria: 'all',
    value: '',
  });

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(() => {
    const saved = localStorage.getItem('dang_iot_sensor_page_size');
    return saved ? parseInt(saved, 10) : 10;
  });

  const handleItemsPerPageChange = (newSize: number) => {
    setItemsPerPage(newSize);
    localStorage.setItem('dang_iot_sensor_page_size', String(newSize));
    setCurrentPage(1);
  };

  const fetchLogs = async (crit?: SearchCriteria, val?: string) => {
    setIsLoading(true);
    const limit = 500;
    const dbLogs = await apiService.getRawSensorLogs(
      limit,
      undefined,
      undefined,
      undefined,
      crit && crit !== 'all' ? crit : undefined,
      val?.trim() || undefined
    );
    setLogs(dbLogs);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLogs(activeQuery.criteria, activeQuery.value);
  }, [activeQuery]);

  const handleCriteriaChange = (newCriteria: SearchCriteria) => {
    setCriteria(newCriteria);
    setValidationError(validateInput(newCriteria, searchTerm));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    setValidationError(validateInput(criteria, val));
  };

  const handleExecuteSearch = () => {
    const err = validateInput(criteria, searchTerm);
    if (err) {
      setValidationError(err);
      return;
    }
    setActiveQuery({
      criteria,
      value: searchTerm.trim(),
    });
    setCurrentPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleExecuteSearch();
    }
  };

  const handleResetSearch = () => {
    setSearchTerm('');
    setValidationError(null);
    setActiveQuery({ criteria: 'all', value: '' });
    setCurrentPage(1);
  };

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return logs.slice(start, start + itemsPerPage);
  }, [logs, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(logs.length / itemsPerPage) || 1;
  const isSearchActive = activeQuery.value.trim().length > 0;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Card 
        title="Lịch sử cảm biến" 
        description="Danh sách chi tiết dữ liệu"
        headerActions={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* 1. Thanh tìm kiếm */}
            <div className="relative flex-1 sm:w-72 lg:w-80">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                placeholder={PLACEHOLDERS[criteria]}
                className={`w-full h-10 pl-9 pr-8 bg-white border rounded-xl text-sm transition-all duration-150 shadow-sm focus:outline-none ${
                  validationError
                    ? 'border-rose-400 text-rose-900 focus:ring-2 focus:ring-rose-200 focus:border-rose-500'
                    : 'border-slate-200 text-slate-800 focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-500 hover:border-slate-300'
                }`}
              />
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setValidationError(null);
                  }}
                  className="absolute right-2.5 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {validationError && (
                <div className="absolute left-0 -bottom-5 text-[11px] font-semibold text-rose-500 flex items-center gap-1 animate-in fade-in duration-150 whitespace-nowrap z-20">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}
            </div>

            {/* 2. Droplist chọn tiêu chí tìm kiếm */}
            <div className="relative">
              <select
                value={criteria}
                onChange={(e) => handleCriteriaChange(e.target.value as SearchCriteria)}
                className="appearance-none h-10 pl-9 pr-9 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-500 cursor-pointer shadow-sm transition-all"
              >
                {CRITERIA_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <Filter className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {/* 3. Nút Tìm kiếm */}
            <button
              type="button"
              onClick={handleExecuteSearch}
              disabled={!!validationError}
              className={`h-10 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all duration-150 ${
                validationError
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white shadow-emerald-500/20 hover:shadow-emerald-500/30'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Tìm kiếm</span>
            </button>

            {/* 4. Nút Đặt lại */}
            {isSearchActive && (
              <button
                type="button"
                onClick={handleResetSearch}
                className="h-10 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-colors duration-150"
                title="Xóa tìm kiếm và đặt lại"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Đặt lại</span>
              </button>
            )}
          </div>
        }
      >
        <div className="flex-1 flex flex-col justify-between">
          <Table<RawSensorLog>
            columns={TABLE_COLUMNS}
            data={paginatedLogs}
            isLoading={isLoading}
            emptyText={isSearchActive ? 'Không tìm thấy kết quả phù hợp với từ khóa' : 'Không có dữ liệu cảm biến'}
          />

          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs font-semibold text-slate-500">
              Tổng số <span className="font-bold text-slate-800">{logs.length}</span> bản ghi
              {isSearchActive && (
                <span className="ml-1 text-emerald-600">(đã áp dụng bộ lọc)</span>
              )}
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              itemsPerPage={itemsPerPage}
              onItemsPerPageChange={handleItemsPerPageChange}
              pageSizeOptions={[10, 20, 50, 100]}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};
