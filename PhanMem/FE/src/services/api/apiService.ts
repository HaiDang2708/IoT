import type { SensorReading, Device, UserProfile, MergedHistoryItem, RawSensorLog, AlertStatItem } from '../../types';

const API_BASE_URL = 
  import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' ? `${window.location.origin}/api` : 'http://localhost:5000/api');

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('dang_iot_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleUnauthorized = (status: number) => {
  if (status === 401 || status === 403) {
    localStorage.removeItem('dang_iot_token');
    localStorage.removeItem('dang_iot_session');
    // Chỉ chuyển hướng nếu đang không ở trang login
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }
};

export const apiService = {
  // 1. CẢM BIẾN (GET /api/sensors)
  async getRawSensorLogs(
    limit = 150, 
    searchCriteria?: string, 
    searchValue?: string
  ): Promise<RawSensorLog[]> {
    try {
      const url = new URL(`${API_BASE_URL}/sensors`);
      url.searchParams.append('type', 'raw_logs');
      url.searchParams.append('limit', String(limit));
      if (searchCriteria) url.searchParams.append('searchCriteria', searchCriteria);
      if (searchValue) url.searchParams.append('searchValue', searchValue);

      const res = await fetch(url.toString(), {
        headers: getAuthHeaders(),
      });
      handleUnauthorized(res.status);
      if (!res.ok) throw new Error('API error');
      return await res.json();
    } catch (err) {
      console.error('[API Service] getRawSensorLogs error:', err);
      return [];
    }
  },

  async getSensorLogs(limit = 72, reverseOrder = true): Promise<SensorReading[]> {
    try {
      const url = new URL(`${API_BASE_URL}/sensors`);
      url.searchParams.append('type', 'logs');
      url.searchParams.append('limit', String(limit));

      const res = await fetch(url.toString(), {
        headers: getAuthHeaders(),
      });
      handleUnauthorized(res.status);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();

      const mapped = data.map((row: any) => ({
        temperature: Number(row.temperature),
        humidity: Number(row.humidity),
        light: Number(row.light),
        timestamp: row.timestamp,
      }));

      return reverseOrder ? mapped.reverse() : mapped;
    } catch (err) {
      console.error('[API Service] getSensorLogs error:', err);
      return [];
    }
  },

  // 2. THIẾT BỊ (GET /api/devices và PATCH /api/devices/:id)
  async getDevices(): Promise<{ devices: Device[]; isEsp32Online: boolean }> {
    try {
      const res = await fetch(`${API_BASE_URL}/devices`, {
        headers: getAuthHeaders(),
      });
      handleUnauthorized(res.status);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      return { devices: data.devices || [], isEsp32Online: !!data.isEsp32Online };
    } catch (err) {
      console.error('[API Service] getDevices error:', err);
      return { devices: [], isEsp32Online: false };
    }
  },

  async updateDeviceState(
    deviceId: string, 
    isON: boolean, 
    deviceCode?: string, 
    userId?: number
  ): Promise<{ success: boolean; isON?: boolean; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/devices/${deviceId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isON, deviceCode, userId }),
      });
      handleUnauthorized(res.status);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        return { success: false, error: data.error || 'Thiết bị không phản hồi' };
      }
      return { success: true, isON: data.isON !== undefined ? data.isON : isON };
    } catch (err: any) {
      console.error('[API Service] updateDeviceState error:', err);
      return { success: false, error: err.message || 'Lỗi kết nối máy chủ' };
    }
  },

  // 3. LỊCH SỬ HOẠT ĐỘNG (GET /api/system?type=history)
  async getMergedHistory(
    searchTime?: string, 
    deviceFilter?: string, 
    actionFilter?: string, 
    statusFilter?: string
  ): Promise<MergedHistoryItem[]> {
    try {
      const url = new URL(`${API_BASE_URL}/system`);
      url.searchParams.append('type', 'history');
      if (searchTime) url.searchParams.append('searchTime', searchTime);
      if (deviceFilter) url.searchParams.append('deviceFilter', deviceFilter);
      if (actionFilter) url.searchParams.append('actionFilter', actionFilter);
      if (statusFilter) url.searchParams.append('statusFilter', statusFilter);

      const res = await fetch(url.toString(), {
        headers: getAuthHeaders(),
      });
      handleUnauthorized(res.status);
      if (!res.ok) throw new Error('API error');
      return await res.json();
    } catch (err) {
      console.error('[API Service] getMergedHistory error:', err);
      return [];
    }
  },

  // 4. USER PROFILE & AUTH (POST /api/auth/login, GET /api/user, PUT /api/user)
  async getUserProfile(username: string): Promise<Partial<UserProfile> | null> {
    try {
      const url = new URL(`${API_BASE_URL}/user`);
      url.searchParams.append('username', username);

      const res = await fetch(url.toString(), {
        headers: getAuthHeaders(),
      });
      handleUnauthorized(res.status);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      return data.profile;
    } catch (err) {
      console.error('[API Service] getUserProfile error:', err);
      return null;
    }
  },

  async verifyUserLogin(username: string, password: string): Promise<any | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.status === 401 || res.status === 400) return null;
      if (!res.ok) {
        throw new Error(`Máy chủ phản hồi lỗi (${res.status})`);
      }
      const data = await res.json();
      return data;
    } catch (err: any) {
      console.error('[API Service] verifyUserLogin error:', err);
      if (err.message && !err.message.includes('fetch')) {
        throw err;
      }
      throw new Error('Không thể kết nối đến máy chủ Backend!');
    }
  },

  // 5. ALERT API (Cảnh báo ánh sáng > X)
  async getAlertStatus(): Promise<{ isAlertActive: boolean; threshold: number }> {
    try {
      const res = await fetch(`${API_BASE_URL}/alert/status`, {
        headers: getAuthHeaders(),
      });
      handleUnauthorized(res.status);
      if (!res.ok) throw new Error('API error');
      return await res.json();
    } catch (err) {
      console.error('[API Service] getAlertStatus error:', err);
      return { isAlertActive: false, threshold: 300 };
    }
  },

  async setAlertThreshold(threshold: number): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/alert/threshold`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ threshold }),
      });
      handleUnauthorized(res.status);
      return res.ok;
    } catch (err) {
      console.error('[API Service] setAlertThreshold error:', err);
      return false;
    }
  },


  async getAlertStats(period: 'day' | 'month' = 'day'): Promise<AlertStatItem[]> {
    try {
      const url = new URL(`${API_BASE_URL}/alert/stats`);
      url.searchParams.append('period', period);

      const res = await fetch(url.toString(), {
        headers: getAuthHeaders(),
      });
      handleUnauthorized(res.status);
      if (!res.ok) throw new Error('API error');
      return await res.json();
    } catch (err) {
      console.error('[API Service] getAlertStats error:', err);
      return [];
    }
  }
};
