import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { Device, SensorReading, UserProfile } from '../types';
import { apiService } from '../services/api/apiService';

const EMPTY_USER: UserProfile = {
  username: '',
  fullName: '',
  email: '',
  avatar: '',
  birthday: '',
  phone: '',
  github: '',
  drive: '',
  apiDoc: '',
  figma: '',
  mssv: '',
  lopHanhChinh: '',
  khoa: '',
  giangVienHuongDan: '',
  muiGio: '',
  gioiTinh: '',
  diaChi: ''
};

interface AppContextType {
  devices: Device[];
  sensorLogs: SensorReading[];
  currentSensor: SensorReading | null;
  userProfile: UserProfile;
  isAuthenticated: boolean;
  isEsp32Online: boolean;
  
  // Setters & Actions
  loadingDeviceIds: Record<string, boolean>;
  toggleDeviceState: (deviceId: string, currentState: boolean) => Promise<void>;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;

  // Global Alert state
  isAlertActive: boolean;
  alertThreshold: number;
  setAlertThresholdValue: (val: number) => Promise<boolean>;

  // Global Toast state
  toastMessage: string | null;
  setToastMessage: (msg: string | null) => void;
  toastType: 'success' | 'error' | 'warning' | 'info';
  setToastType: (type: 'success' | 'error' | 'warning' | 'info') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loadingDeviceIds, setLoadingDeviceIds] = useState<Record<string, boolean>>({});
  const loadingDeviceIdsRef = useRef<Record<string, boolean>>({});
  loadingDeviceIdsRef.current = loadingDeviceIds;

  // Global Toast notification states
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('success');

  const [sensorLogs, setSensorLogs] = useState<SensorReading[]>([]);
  const [currentSensor, setCurrentSensor] = useState<SensorReading | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const cached = localStorage.getItem('dang_iot_user_profile');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        return { ...EMPTY_USER, ...parsed };
      } catch {
        return EMPTY_USER;
      }
    }
    return EMPTY_USER;
  });
  const [isEsp32Online, setIsEsp32Online] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('dang_iot_session') === 'true';
  });

  const [isAlertActive, setIsAlertActive] = useState<boolean>(false);
  const [alertThreshold, setAlertThreshold] = useState<number>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('alertThreshold') : null;
    return saved !== null && !isNaN(Number(saved)) && Number(saved) > 0 ? Number(saved) : 300;
  });

  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (sensorLogs.length > 0) {
      setCurrentSensor(sensorLogs[sensorLogs.length - 1]);
    }
  }, [sensorLogs]);

  const setAlertThresholdValue = async (val: number): Promise<boolean> => {
    const success = await apiService.setAlertThreshold(val);
    if (success) {
      setAlertThreshold(val);
      if (typeof window !== 'undefined') {
        localStorage.setItem('alertThreshold', String(val));
      }
      setToastType('success');
      setToastMessage(`Đã cài đặt ngưỡng cảnh báo ánh sáng: ${val} Lux`);
    } else {
      setToastType('error');
      setToastMessage('Lỗi cập nhật ngưỡng cảnh báo');
    }
    return success;
  };

  // 1. Tải dữ liệu ban đầu từ API Local khi ứng dụng khởi chạy
  useEffect(() => {
    const loadInitialData = async () => {
      const deviceRes = await apiService.getDevices();
      if (deviceRes.devices && deviceRes.devices.length > 0) {
        setDevices(deviceRes.devices);
      }
      setIsEsp32Online(deviceRes.isEsp32Online);

      const dbLogs = await apiService.getSensorLogs(25);
      if (dbLogs.length > 0) {
        setSensorLogs(dbLogs);
      }

      // Nạp trạng thái cảnh báo và ngưỡng
      const alertStatus = await apiService.getAlertStatus();
      setIsAlertActive(alertStatus.isAlertActive);
      if (alertStatus.threshold !== undefined && alertStatus.threshold !== null) {
        setAlertThreshold(alertStatus.threshold);
        if (typeof window !== 'undefined') {
          localStorage.setItem('alertThreshold', String(alertStatus.threshold));
        }
      }
      
      setTimeout(() => {
        isInitializedRef.current = true;
      }, 300);
    };
    loadInitialData();
  }, []);

  // 2. Định kỳ 3 giây đồng bộ danh sách thiết bị, cảm biến & ESP32 Online & Cảnh báo
  useEffect(() => {
    const interval = setInterval(async () => {
      if (typeof document !== 'undefined' && document.hidden) return;

      if (isInitializedRef.current) {
        const deviceRes = await apiService.getDevices();
        if (deviceRes.devices && deviceRes.devices.length > 0) {
          setDevices(prev => {
            return deviceRes.devices.map(remoteDev => {
              if (loadingDeviceIdsRef.current[remoteDev.id]) {
                const currentLocal = prev.find(p => p.id === remoteDev.id);
                return currentLocal || remoteDev;
              }
              return remoteDev;
            });
          });
        }
        setIsEsp32Online(deviceRes.isEsp32Online);

        // sensorLogs định kỳ khi người dùng đang ở Dashboard để vẽ biểu đồ và thẻ cảm biến
        const isDashboard = typeof window !== 'undefined' && 
          (!window.location.hash || window.location.hash === '#/' || window.location.hash.startsWith('#/dashboard'));

        if (isDashboard) {
          const dbLogs = await apiService.getSensorLogs(25);
          if (dbLogs && dbLogs.length > 0) {
            setSensorLogs(dbLogs);
          }
        }

        // Cập nhật trạng thái nháy Box cảnh báo thời gian thực
        const alertStatus = await apiService.getAlertStatus();
        setIsAlertActive(alertStatus.isAlertActive);
        if (alertStatus.threshold !== undefined && alertStatus.threshold !== null) {
          setAlertThreshold(alertStatus.threshold);
          if (typeof window !== 'undefined') {
            localStorage.setItem('alertThreshold', String(alertStatus.threshold));
          }
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const toggleDeviceState = async (deviceId: string, currentState: boolean) => {
    const targetDevice = devices.find(d => d.id === deviceId);
    if (!targetDevice) return;
    if (loadingDeviceIds[deviceId]) return;

    const targetState = !currentState;
    setLoadingDeviceIds(prev => ({ ...prev, [deviceId]: true }));

    try {
      const res = await apiService.updateDeviceState(
        deviceId, 
        targetState, 
        targetDevice.device_code, 
        Number(userProfile.id) || 1
      );

      if (res.success) {
        setDevices(prev =>
          prev.map(d => (d.id === deviceId ? { ...d, current_state: res.isON ?? targetState } : d))
        );
      } else {
        setToastType('error');
        setToastMessage(res.error || 'Thiết bị ESP32 không phản hồi hoặc mất kết nối!');
      }
    } catch (err: any) {
      console.error('[Toggle Device Error]', err);
      setToastType('error');
      setToastMessage(err.message || 'Lỗi khi gửi lệnh điều khiển thiết bị');
    } finally {
      setLoadingDeviceIds(prev => ({ ...prev, [deviceId]: false }));
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      const fetchUserProfile = async () => {
        const username = localStorage.getItem('dang_iot_username') || 'ADMIN';
        if (username) {
          const profile = await apiService.getUserProfile(username);
          if (profile) {
            const updatedProfile: UserProfile = {
              ...EMPTY_USER,
              ...profile,
              id: String(profile.id || '')
            };
            setUserProfile(updatedProfile);
            localStorage.setItem('dang_iot_user_profile', JSON.stringify(updatedProfile));
          }
        }
      };
      fetchUserProfile();
    }
  }, [isAuthenticated]);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const loginRes = await apiService.verifyUserLogin(username, password);

      if (!loginRes || !loginRes.user) {
        console.warn('[Login] User not found, incorrect password, or DB error');
        return false;
      }

      const userData = loginRes.user;
      if (loginRes.token) {
        localStorage.setItem('dang_iot_token', loginRes.token);
      }

      setIsAuthenticated(true);
      localStorage.setItem('dang_iot_session', 'true');
      localStorage.setItem('dang_iot_username', username);

      const profile: UserProfile = {
        id: String(userData.id || ''),
        username: userData.ten_dang_nhap || username,
        fullName: userData.ho_ten || username,
        email: userData.email || '',
        birthday: userData.ngay_sinh || '',
        phone: userData.so_dien_thoai || '',
        github: userData.github || '',
        drive: userData.drive || '',
        apiDoc: userData.apiDoc || '',
        figma: userData.figma || '',
        avatar: userData.avatar || '',
        mssv: userData.mssv || '',
        lopHanhChinh: userData.lopHanhChinh || '',
        khoa: userData.khoa || '',
        giangVienHuongDan: userData.giangVienHuongDan || '',
        muiGio: userData.muiGio || '',
        gioiTinh: userData.gioiTinh || '',
        diaChi: userData.diaChi || '',
      };
      setUserProfile(profile);
      localStorage.setItem('dang_iot_user_profile', JSON.stringify(profile));
      return true;
    } catch (err) {
      console.error('[Login] Exception:', err);
      throw err;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('dang_iot_token');
    localStorage.removeItem('dang_iot_session');
    localStorage.removeItem('dang_iot_username');
    localStorage.removeItem('dang_iot_user_profile');
  };

  return (
    <AppContext.Provider
      value={{
        devices,
        sensorLogs,
        currentSensor,
        userProfile,
        isAuthenticated,
        isEsp32Online,
        isAlertActive,
        alertThreshold,
        setAlertThresholdValue,
        loadingDeviceIds,
        toggleDeviceState,
        login,
        logout,
        toastMessage,
        setToastMessage,
        toastType,
        setToastType,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
