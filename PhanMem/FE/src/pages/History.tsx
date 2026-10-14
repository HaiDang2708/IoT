import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Card } from '../components/Common/Card';
import { Table } from '../components/Common/Table';
import type { Column } from '../components/Common/Table';
import { Pagination } from '../components/Common/Pagination';
import { Calendar, Cpu, Zap, Activity, Search, ChevronDown, AlertCircle, X, RotateCcw, Loader2 } from 'lucide-react';
import { apiService } from '../services/api/apiService';
import type { MergedHistoryItem } from '../types';
import { useApp } from '../contexts/AppContext';

interface HistoryFilters {
  time: string;
  device: string;
  action: string;
  status: string;
}

const DEFAULT_FILTERS: HistoryFilters = {
  time: '',
  device: 'ALL',
  action: 'ALL',
  status: 'ALL',
};

// Regex cố định ngoài component
const LETTER_REGEX = /[a-zA-Z\u00C0-\u024F\u1E00-\u1EFF]/;
const TIME_REGEX = /^((\d{4}([-/]\d{1,2}([-/]\d{1,2})?)?)|(\d{1,2}(:\d{1,2}(:\d{1,2})?)?)|(\d{4}[-/]\d{1,2}[-/]\d{1,2}\s+\d{1,2}(:\d{1,2}(:\d{1,2})?)?))$/;

const validateTimeInput = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (LETTER_REGEX.test(trimmed)) {
    return 'Chỉ chấp nhận số và ký hiệu ngày giờ (VD: 2026-10-09 hoặc 14:30:00)';
  }

  if (!TIME_REGEX.test(trimmed)) {
    return 'Định dạng thời gian không hợp lệ. Vui lòng nhập ngày (YYYY-MM-DD) hoặc giờ (HH:mm:ss)';
  }

  return null;
};

// Cấu hình bảng cố định (Giữ nguyên 100% giao diện Bài 3)
const TABLE_COLUMNS: Column<MergedHistoryItem>[] = [
  {
    key: 'id',
    header: 'ID',
    className: 'w-24',
    render: (row) => <span className="font-bold text-slate-700 text-xs">{row.id}</span>,
  },
  {
    key: 'ten_thiet_bi',
    header: 'Tên thiết bị',
    render: (row) => <span className="font-bold text-slate-700 text-xs">{row.ten_thiet_bi}</span>,
  },
  {
    key: 'hanh_dong',
    header: 'Hành động',
    className: 'w-32',
    render: (row) => {
      const isON = String(row.hanh_dong).toLowerCase() === 'on';
      return (
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-xs ${
            isON ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          {row.hanh_dong}
        </span>
      );
    },
  },
  {
    key: 'trang_thai',
    header: 'Trạng thái',
    className: 'w-36',
    render: (row) => {
      const st = String(row.trang_thai).toLowerCase();
      if (st === 'loading') {
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 animate-pulse shadow-xs">
            <Loader2 className="w-3 h-3 animate-spin text-amber-600 shrink-0" />
            loading
          </span>
        );
      }
      if (st === 'on') {
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
            on
          </span>
        );
      }
      if (st === 'off') {
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200 shadow-xs">
            off
          </span>
        );
      }
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 shadow-xs">
          failed
        </span>
      );
    },
  },
  {
    key: 'thoi_gian_gui',
    header: 'Thời gian gửi',
    render: (row) => (
      <span className="font-bold text-slate-600 text-xs tracking-tight">
        {row.thoi_gian_gui || '---'}
      </span>
    ),
  },
  {
    key: 'thoi_gian_phan_hoi',
    header: 'Thời gian phản hồi',
    render: (row) => {
      const isPending =
        row.trang_thai === 'loading' ||
        row.status === 'PENDING' ||
        row.status === 'LOADING' ||
        !row.thoi_gian_phan_hoi;

      return (
        <span
          className={`font-bold text-xs tracking-tight ${
            isPending ? 'text-amber-500 italic' : 'text-slate-600'
          }`}
        >
          {isPending ? 'Đang chờ ESP32...' : row.thoi_gian_phan_hoi}
        </span>
      );
    },
  },
  {
    key: 'status',
    header: 'Kết quả',
    className: 'w-32',
    render: (row) => {
      const st = (row.status || '').toUpperCase();
      if (st === 'SUCCESS') {
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-emerald-100/70 text-emerald-800">
            SUCCESS
          </span>
        );
      }
      if (st === 'LOADING' || st === 'PENDING') {
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 animate-pulse">
            <Loader2 className="w-2.5 h-2.5 animate-spin" />
            PENDING
          </span>
        );
      }
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800">
          FAILED
        </span>
      );
    },
  },
];

export const HistoryPage: React.FC = () => {
  const { devices } = useApp();
  const [historyLogs, setHistoryLogs] = useState<MergedHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Bộ lọc
  const [timeInput, setTimeInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState('ALL');
  const [selectedAction, setSelectedAction] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  const [appliedFilters, setAppliedFilters] = useState<HistoryFilters>(DEFAULT_FILTERS);

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(() => {
    const saved = localStorage.getItem('dang_iot_history_page_size');
    return saved ? parseInt(saved, 10) : 10;
  });

  const handleItemsPerPageChange = (newSize: number) => {
    setItemsPerPage(newSize);
    localStorage.setItem('dang_iot_history_page_size', String(newSize));
    setCurrentPage(1);
  };

  const deviceOptions = useMemo(() => {
    const list = ['Quạt', 'Máy hút ẩm', 'Đèn ngoài trời', 'Đèn'];
    devices.forEach((d) => {
      if (d.device_name && !list.includes(d.device_name)) list.push(d.device_name);
    });
    return Array.from(new Set(list));
  }, [devices]);

  const fetchHistory = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const data = await apiService.getMergedHistory(
        undefined,
        undefined,
        undefined,
        appliedFilters.time || undefined,
        appliedFilters.device !== 'ALL' ? appliedFilters.device : undefined,
        appliedFilters.action !== 'ALL' ? appliedFilters.action : undefined,
        appliedFilters.status !== 'ALL' ? appliedFilters.status : undefined
      );
      setHistoryLogs(data || []);
    } catch (err) {
      console.error('Lỗi khi tải lịch sử hoạt động:', err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Tự động làm mới 1.5s/lần khi có mục đang chờ phản hồi từ ESP32
  useEffect(() => {
    const hasPending = historyLogs.some(
      (item) => item.trang_thai === 'loading' || item.status === 'PENDING' || item.status === 'LOADING'
    );
    if (!hasPending) return;

    const interval = setInterval(() => {
      fetchHistory(false);
    }, 1500);

    return () => clearInterval(interval);
  }, [historyLogs, fetchHistory]);

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTimeInput(val);
    setValidationError(validateTimeInput(val));
  };

  const handleApplyFilters = () => {
    const err = validateTimeInput(timeInput);
    if (err) {
      setValidationError(err);
      return;
    }
    setAppliedFilters({
      time: timeInput.trim(),
      device: selectedDevice,
      action: selectedAction,
      status: selectedStatus,
    });
    setCurrentPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApplyFilters();
    }
  };

  const handleResetFilters = () => {
    setTimeInput('');
    setValidationError(null);
    setSelectedDevice('ALL');
    setSelectedAction('ALL');
    setSelectedStatus('ALL');
    setAppliedFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
  };

  const isFilterActive =
    appliedFilters.time !== '' ||
    appliedFilters.device !== 'ALL' ||
    appliedFilters.action !== 'ALL' ||
    appliedFilters.status !== 'ALL';

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return historyLogs.slice(start, start + itemsPerPage);
  }, [historyLogs, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(historyLogs.length / itemsPerPage) || 1;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Card
        title="Lịch sử hoạt động"
        description="Nhật ký thao tác điều khiển thiết bị"
        headerActions={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* 1. Lọc theo thời gian */}
            <div className="relative flex-1 sm:w-64 lg:w-72">
              <input
                type="text"
                value={timeInput}
                onChange={handleTimeChange}
                onKeyDown={handleKeyDown}
                placeholder="Nhập thời gian..."
                className={`w-full h-10 pl-9 pr-8 bg-white border rounded-xl text-sm transition-all duration-150 shadow-sm focus:outline-none ${
                  validationError
                    ? 'border-rose-400 text-rose-900 focus:ring-2 focus:ring-rose-200 focus:border-rose-500'
                    : 'border-slate-200 text-slate-800 focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-500 hover:border-slate-300'
                }`}
              />
              <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              {timeInput && (
                <button
                  type="button"
                  onClick={() => {
                    setTimeInput('');
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

            {/* 2. Lọc Thiết bị */}
            <div className="relative">
              <select
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="appearance-none h-10 pl-9 pr-8 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-500 cursor-pointer shadow-sm transition-all"
              >
                <option value="ALL">Tất cả thiết bị</option>
                {deviceOptions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <Cpu className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {/* 3. Lọc Hành động */}
            <div className="relative">
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="appearance-none h-10 pl-9 pr-8 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-500 cursor-pointer shadow-sm transition-all"
              >
                <option value="ALL">Tất cả hành động</option>
                <option value="on">Bật (ON)</option>
                <option value="off">Tắt (OFF)</option>
              </select>
              <Zap className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {/* 4. Lọc Trạng thái */}
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="appearance-none h-10 pl-9 pr-8 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 focus:border-emerald-500 cursor-pointer shadow-sm transition-all"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="on">Bật thành công (ON)</option>
                <option value="off">Tắt thành công (OFF)</option>
                <option value="loading">Đang chờ (LOADING)</option>
              </select>
              <Activity className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              <ChevronDown className="absolute right-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {/* 5. Nút Lọc */}
            <button
              type="button"
              onClick={handleApplyFilters}
              disabled={!!validationError}
              className={`h-10 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all duration-150 ${
                validationError
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white shadow-emerald-500/20 hover:shadow-emerald-500/30'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Lọc</span>
            </button>

            {/* 6. Nút Đặt lại */}
            {isFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="h-10 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition-colors duration-150"
                title="Xóa bộ lọc và đặt lại"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Đặt lại</span>
              </button>
            )}
          </div>
        }
      >
        <div className="flex-1 flex flex-col justify-between">
          <Table<MergedHistoryItem>
            columns={TABLE_COLUMNS}
            data={paginatedLogs}
            isLoading={isLoading}
            emptyText={
              isFilterActive
                ? 'Không tìm thấy kết quả phù hợp với bộ lọc'
                : 'Không có dữ liệu lịch sử thao tác thiết bị'
            }
          />

          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs font-semibold text-slate-500">
              Tổng số <span className="font-bold text-slate-800">{historyLogs.length}</span> bản ghi
              {isFilterActive && (
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
