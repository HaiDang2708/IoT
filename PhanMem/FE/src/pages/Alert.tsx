import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '../components/Common/Card';
import { useApp } from '../contexts/AppContext';
import { apiService } from '../services/api/apiService';
import type { AlertStatItem } from '../types';
import { Sliders } from 'lucide-react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export const AlertPage: React.FC = () => {
  const { alertThreshold, setAlertThresholdValue, currentSensor } = useApp();

  const [inputThreshold, setInputThreshold] = useState<string>(String(alertThreshold));
  const [isSaving, setIsSaving] = useState(false);
  const [statsPeriod, setStatsPeriod] = useState<'day' | 'month'>('day');
  const [statsData, setStatsData] = useState<AlertStatItem[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Đồng bộ inputThreshold khi context nạp xong
  useEffect(() => {
    setInputThreshold(String(alertThreshold));
  }, [alertThreshold]);

  // Tải dữ liệu thống kê
  const loadAlertData = async (showLoading = false) => {
    if (showLoading) setIsLoadingStats(true);
    try {
      const stats = await apiService.getAlertStats(statsPeriod);
      setStatsData(stats);
    } catch (err) {
      console.error('Lỗi tải dữ liệu cảnh báo:', err);
    } finally {
      if (showLoading) setIsLoadingStats(false);
    }
  };

  // Chỉ hiện loading khi mới vào trang hoặc người dùng chủ động đổi tab Ngày / Tháng
  useEffect(() => {
    loadAlertData(true);
  }, [statsPeriod]);

  // Cập nhật ngầm số liệu mỗi 10s mà KHÔNG làm chớp hay vẽ lại biểu đồ
  useEffect(() => {
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      loadAlertData(false);
    }, 10000);
    return () => clearInterval(timer);
  }, [statsPeriod]);

  const handleSaveThreshold = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(inputThreshold);
    if (isNaN(val) || val <= 0) return;
    setIsSaving(true);
    await setAlertThresholdValue(val);
    setIsSaving(false);
  };

  const currentLux = currentSensor ? currentSensor.light : 0;

  // Dữ liệu biểu đồ ChartJS
  const chartConfig = useMemo(() => {
    const labels = statsData.map(item => item.time_label);
    const counts = statsData.map(item => item.count);

    return {
      labels: labels.length > 0 ? labels : ['Chưa có dữ liệu'],
      datasets: [
        {
          label: statsPeriod === 'day' ? 'Số lượt cảnh báo theo ngày' : 'Số lượt cảnh báo theo tháng',
          data: counts.length > 0 ? counts : [0],
          backgroundColor: 'rgba(239, 68, 68, 0.75)', // Màu đỏ cảnh báo
          borderColor: 'rgb(220, 38, 38)',
          borderWidth: 1.5,
          borderRadius: 6,
          maxBarThickness: statsPeriod === 'month' ? 44 : 20, // Kích thước cột cân đối cho 12 tháng hoặc 31 ngày
          hoverBackgroundColor: 'rgba(220, 38, 38, 0.9)',
        },
      ],
    };
  }, [statsData, statsPeriod]);

  return (
    <div className="flex flex-col h-full space-y-3 overflow-hidden">
      {/* Ô CÀI ĐẶT NGƯỠNG X */}
      <Card
        title="Cài Đặt"
        description="Thiết lập ngưỡng ánh sáng để kích hoạt đèn LED"
        className="shrink-0"
        headerActions={
          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold">
              <span className="text-slate-500">Ánh sáng đo được: </span>
              <span className="font-extrabold text-amber-600">{currentLux} Lux</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold">
              <span className="text-slate-500">Ngưỡng X: </span>
              <span className="font-extrabold text-sky-600">{alertThreshold} Lux</span>
            </div>
          </div>
        }
      >
        <form onSubmit={handleSaveThreshold} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-8">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ngưỡng ánh sáng giới hạn
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={inputThreshold}
                  onChange={(e) => setInputThreshold(e.target.value)}
                  placeholder="Nhập ngưỡng X (VD: 300)..."
                  className="w-full h-10 pl-9 pr-14 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400/20 focus:border-sky-500 transition-all"
                  required
                />
                <Sliders className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                  Lux
                </span>
              </div>
            </div>

            <div className="md:col-span-4 flex items-center gap-2">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full h-10 px-5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? 'Đang lưu...' : 'Lưu cài đặt'}
              </button>
            </div>
          </div>
        </form>
      </Card>

      {/* Hàng 2: BIỂU ĐỒ THỐNG KÊ SỐ LƯỢT CẢNH BÁO THEO NGÀY / THÁNG (TOÀN CHIỀU RỘNG) */}
      <Card
        title="Thống Kê Số Lượt Cảnh Báo"
        description="Tổng hợp số lần cường độ ánh sáng vượt ngưỡng X theo thời gian"
        className="flex-1 min-h-0 flex flex-col overflow-hidden"
        contentClassName="flex-1 min-h-0 p-4 overflow-hidden flex flex-col"
        headerActions={
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setStatsPeriod('day')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                statsPeriod === 'day'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Theo Ngày
            </button>
            <button
              type="button"
              onClick={() => setStatsPeriod('month')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                statsPeriod === 'month'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Theo Tháng
            </button>
          </div>
        }
      >
        <div className="w-full h-full min-h-0 relative">
          {isLoadingStats ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              Đang nạp dữ liệu thống kê...
            </div>
          ) : (
            <Bar
              data={chartConfig}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                animation: false, // Tắt hiệu ứng mọc lại từ đáy lên, cột luôn ổn định
                plugins: {
                  legend: {
                    display: true,
                    position: 'top',
                    labels: { font: { family: 'Inter', size: 11, weight: 'bold' } },
                  },
                },
                scales: {
                  x: {
                    grid: { display: false },
                    ticks: {
                      font: { family: 'Inter', size: 9, weight: 'bold' },
                      maxRotation: 45,
                      minRotation: 0,
                      autoSkip: false,
                      color: '#64748b',
                    },
                  },
                  y: {
                    beginAtZero: true,
                    grace: '20%', // Đệm 20% khoảng trống trên đỉnh để cột không đè vào Legend
                    ticks: {
                      maxTicksLimit: 7, // Giới hạn số vạch chia để số tròn đẹp mắt
                      precision: 0,
                      color: '#64748b',
                    },
                  },
                },
              }}
            />
          )}
        </div>
      </Card>
    </div>
  );
};
