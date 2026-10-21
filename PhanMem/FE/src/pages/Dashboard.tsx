import React, { useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Thermometer,
  Droplets,
  Sun,
  Lightbulb,
  Fan,
  Power,
  Loader2,
} from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import type { ChartOptions, ChartData } from 'chart.js';
import { Card } from '../components/Common/Card';
import type { Device, SensorReading } from '../types';
import { useApp } from '../contexts/AppContext';

// Đăng ký module ChartJS một lần
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

const SENSOR_THEMES = {
  temp: {
    bgIcon: 'bg-blue-50 text-blue-500 dark:bg-blue-500/10 dark:text-blue-400',
    border: 'hover:border-blue-300/60',
    glow: 'sensor-glow-temp',
  },
  hum: {
    bgIcon: 'bg-emerald-50 text-emerald-500 dark:bg-emerald-550/10 dark:text-emerald-400',
    border: 'hover:border-emerald-300/60',
    glow: 'sensor-glow-hum',
  },
  light: {
    bgIcon: 'bg-amber-50 text-amber-500 dark:bg-amber-500/10 dark:text-amber-400',
    border: 'hover:border-amber-300/60',
    glow: 'sensor-glow-light',
  },
} as const;

// 1. COMPONENT THẺ CẢM BIẾN 
interface SensorCardProps {
  label: string;
  value: number | string;
  unit: string;
  icon: LucideIcon;
  colorTheme: keyof typeof SENSOR_THEMES;
}

const SensorCard: React.FC<SensorCardProps> = ({
  label,
  value,
  unit,
  icon: Icon,
  colorTheme,
}) => {
  const theme = SENSOR_THEMES[colorTheme];

  return (
    <Card
      className={`transition-all duration-200 ${theme.border}`}
      contentClassName="p-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{label}</p>
          <h3 className="text-2xl font-black text-slate-800 mt-0.5 tracking-tight">
            {value}
            <span className="text-sm font-bold text-slate-400 ml-0.5">{unit}</span>
          </h3>
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all shadow-inner ${theme.bgIcon} ${theme.glow}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
};

// 2. COMPONENT THẺ THIẾT BỊ
interface DeviceCardProps {
  device: Device;
  onStateToggle: (id: string, currentState: boolean) => void;
  isLoading?: boolean;
}

const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  onStateToggle,
  isLoading = false,
}) => {
  const isON = device.current_state;

  const config = useMemo(() => {
    const name = (device.device_name || '').toLowerCase();
    const code = (device.device_code || '').toLowerCase();

    // 1. Quạt
    if (name.includes('quạt') || name.includes('fan') || code === 'led1') {
      return {
        icon: (
          <Fan
            className={`h-5 w-5 transition-transform duration-300 ${isON ? 'text-cyan-500 animate-spin' : 'text-slate-400'}`}
            style={isON ? { animationDuration: '2s' } : undefined}
          />
        ),
        iconBg: isON ? 'bg-cyan-500/20 text-cyan-500 shadow-cyan-400/20' : 'bg-slate-100 text-slate-400',
        activeBorder: 'border-cyan-300 bg-cyan-50/20',
      };
    }

    // 2. Máy hút ẩm
    if (name.includes('hút ẩm') || name.includes('ẩm') || name.includes('hum') || code === 'led2') {
      return {
        icon: (
          <Droplets
            className={`h-5 w-5 transition-transform duration-300 ${isON ? 'text-blue-500 fill-blue-500/30 animate-pulse scale-110' : 'text-slate-400'}`}
          />
        ),
        iconBg: isON ? 'bg-blue-500/20 text-blue-500 shadow-blue-400/20' : 'bg-slate-100 text-slate-400',
        activeBorder: 'border-blue-300 bg-blue-50/20',
      };
    }

    // 3. Đèn 
    return {
      icon: (
        <Lightbulb
          className={`h-5 w-5 transition-transform duration-300 ${isON ? 'fill-amber-400 text-amber-500 scale-110' : 'text-slate-400'}`}
        />
      ),
      iconBg: isON ? 'bg-amber-400/20 text-amber-500 shadow-amber-400/20' : 'bg-slate-100 text-slate-400',
      activeBorder: 'border-amber-300 bg-amber-50/20',
    };
  }, [device.device_name, device.device_code, isON]);

  return (
    <Card
      className={`transition-all duration-300 hover:shadow-md ${isON ? config.activeBorder : ''}`}
      contentClassName="p-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all duration-300 shadow-sm ${config.iconBg}`}>
            {config.icon}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-slate-800 leading-tight truncate">
              {device.device_name}
            </h4>
            <div className="flex items-center gap-1.5 mt-1">
              {isLoading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin text-amber-500 shrink-0" />
                  <span className="text-[11px] font-semibold text-amber-600">Đang chờ ...</span>
                </>
              ) : (
                <>
                  <span
                    className={`inline-block h-2 w-2 rounded-full transition-all duration-300 ${
                      isON ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]' : 'bg-slate-300'
                    }`}
                  />
                  <span className={`text-[11px] font-semibold transition-colors duration-300 ${isON ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {isON ? 'Đang bật' : 'Đang tắt'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Nút gạt bật tắt */}
        <button
          type="button"
          role="switch"
          aria-checked={isON}
          disabled={isLoading}
          onClick={() => onStateToggle(device.id, isON)}
          className={`group relative inline-flex h-8 w-14 shrink-0 items-center rounded-full transition-all duration-300 focus:outline-none ${
            isLoading ? 'cursor-wait opacity-85' : 'cursor-pointer'
          } ${isON ? 'bg-sky-500 shadow-md shadow-sky-500/25' : 'bg-slate-200'}`}
          title={isLoading ? 'Đang chờ kết nối tới thiết bị...' : `Nhấn để ${isON ? 'Tắt' : 'Bật'} ${device.device_name}`}
        >
          <span
            className={`inline-flex h-6 w-6 transform items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-300 ${
              isON ? 'translate-x-7' : 'translate-x-1'
            }`}
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />
            ) : (
              <Power className={`h-3 w-3 transition-colors duration-300 ${isON ? 'text-sky-500' : 'text-slate-400'}`} />
            )}
          </span>
        </button>
      </div>
    </Card>
  );
};

// 3. CẤU HÌNH BIỂU ĐỒ
const CHART_OPTIONS: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
      labels: {
        boxWidth: 10,
        boxHeight: 10,
        usePointStyle: true,
        font: { family: 'Inter', size: 9, weight: 'bold' },
        color: '#64748b',
        padding: 15,
      },
    },
    tooltip: {
      backgroundColor: '#1e293b',
      titleFont: { family: 'Inter', size: 11, weight: 'bold' },
      bodyFont: { family: 'Inter', size: 10 },
      padding: 8,
      cornerRadius: 6,
      callbacks: {
        title: (items) => (items.length ? items[0].label || '' : ''),
        label: (context) => {
          const val = context.parsed.y;
          if (val === null || val === undefined || isNaN(val)) return '';
          const label = context.dataset.label || '';
          if (label.includes('Nhiệt độ')) return `${label}: ${val} °C`;
          if (label.includes('Độ ẩm')) return `${label}: ${val} %`;
          if (label.includes('Ánh sáng')) return `${label}: ${val} Lux`;
          return `${label}: ${val}`;
        },
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: {
        font: { family: 'Inter', size: 8, weight: 'bold' },
        color: '#94a3b8',
        maxRotation: 45,
        minRotation: 30,
        autoSkip: true,
      },
    },
    yTempHum: {
      type: 'linear',
      position: 'left',
      min: 0,
      max: 100,
      border: { display: false },
      grid: {
        color: 'rgba(148, 163, 184, 0.15)',
        lineWidth: 1,
        tickBorderDash: [4, 4],
        drawTicks: false,
      },
      ticks: {
        font: { family: 'Inter', size: 8, weight: 'bold' },
        color: '#64748b',
        maxTicksLimit: 6,
        padding: 6,
      },
      title: {
        display: true,
        text: 'Nhiệt độ (°C) / Độ ẩm (%)',
        color: '#64748b',
        font: { family: 'Inter', size: 9, weight: 'bold' },
      },
    },
    yLight: {
      type: 'linear',
      position: 'right',
      min: 0,
      suggestedMax: 1000,
      border: { display: false },
      grid: { drawOnChartArea: false, drawTicks: false },
      ticks: {
        font: { family: 'Inter', size: 8, weight: 'bold' },
        color: '#d97706',
        maxTicksLimit: 6,
        padding: 6,
      },
      title: {
        display: true,
        text: 'Ánh sáng (Lux)',
        color: '#d97706',
        font: { family: 'Inter', size: 9, weight: 'bold' },
      },
    },
  },
};

const TrendComparisonChart: React.FC<{
  labels: string[];
  temps: number[];
  hums: number[];
  lights: number[];
}> = ({ labels, temps, hums, lights }) => {
  const data: ChartData<'line'> = {
    labels,
    datasets: [
      {
        label: 'Ánh sáng (Lux)',
        data: lights,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.02)',
        borderWidth: 2,
        tension: 0.35,
        pointRadius: 2,
        pointHoverRadius: 4,
        yAxisID: 'yLight',
      },
      {
        label: 'Nhiệt độ (°C)',
        data: temps,
        borderColor: '#ef4444',
        backgroundColor: 'transparent',
        borderWidth: 2,
        tension: 0.35,
        pointRadius: 2,
        pointHoverRadius: 4,
        yAxisID: 'yTempHum',
      },
      {
        label: 'Độ ẩm (%)',
        data: hums,
        borderColor: '#3b82f6',
        backgroundColor: 'transparent',
        borderWidth: 2,
        tension: 0.35,
        pointRadius: 2,
        pointHoverRadius: 4,
        yAxisID: 'yTempHum',
      },
    ],
  };

  return (
    <div className="h-full w-full">
      <Line data={data} options={CHART_OPTIONS} />
    </div>
  );
};

// 4. TRANG CHÍNH DASHBOARD
export const DashboardPage: React.FC = () => {
  const {
    devices,
    sensorLogs,
    currentSensor,
    loadingDeviceIds,
    toggleDeviceState,
  } = useApp();

  const { labels, temps, hums, lights } = useMemo(() => {
    return {
      labels: sensorLogs.map(log =>
        new Date(log.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      ),
      temps: sensorLogs.map(log => log.temperature),
      hums: sensorLogs.map(log => log.humidity),
      lights: sensorLogs.map(log => log.light),
    };
  }, [sensorLogs]);

  // Cấu hình thẻ cảm biến lấy giá trị thật từ Backend
  const sensorCardsConfig = [
    {
      label: 'Nhiệt độ',
      value: currentSensor ? currentSensor.temperature : '--',
      unit: '°C',
      icon: Thermometer,
      colorTheme: 'temp' as const,
    },
    {
      label: 'Độ ẩm',
      value: currentSensor ? currentSensor.humidity : '--',
      unit: '%',
      icon: Droplets,
      colorTheme: 'hum' as const,
    },
    {
      label: 'Ánh sáng',
      value: currentSensor ? currentSensor.light : '--',
      unit: 'lx',
      icon: Sun,
      colorTheme: 'light' as const,
    },
  ];

  return (
    <div className="flex flex-col h-full space-y-3.5 overflow-hidden">
      {/* Lưới hiển thị các thẻ cảm biến */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
        {sensorCardsConfig.map((c) => (
          <SensorCard key={c.label} {...c} />
        ))}
      </div>

      {/* Lưới điều khiển thiết bị */}
      <div className="shrink-0">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">HỆ THỐNG THIẾT BỊ</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {devices.map((device) => (
            <DeviceCard
              key={device.id}
              device={device}
              isLoading={!!loadingDeviceIds[device.id]}
              onStateToggle={toggleDeviceState}
            />
          ))}
        </div>
      </div>

      {/* Biểu đồ phân tích */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between gap-3 mb-1.5 shrink-0">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            BIỂU ĐỒ PHÂN TÍCH
          </h3>
        </div>

        <div className="premium-card rounded-[20px] overflow-hidden border border-slate-100 bg-white p-4 shadow-sm flex-1 flex flex-col min-h-0 relative">
          <div className="flex-1 min-h-0 w-full relative">
            <TrendComparisonChart
              labels={labels}
              temps={temps}
              hums={hums}
              lights={lights}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
