import type { SensorReading, Device, UserProfile, MergedHistoryItem, RawSensorLog } from '../../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiService = {
  // 1. CẢM BIẾN (GET /api/sensors)
  async getRawSensorLogs(
    limit = 150, 
    dateString?: string, 
    startTime?: string, 
    endTime?: string,
    searchCriteria?: string,
    searchValue?: string
  ): Promise<RawSensorLog[]> {
    try {
      const url = new URL(`${API_BASE_URL}/sensors`);
      url.searchParams.append('type', 'raw_logs');
      url.searchParams.append('limit', String(limit));
      if (dateString) url.searchParams.append('dateString', dateString);
      if (startTime) url.searchParams.append('startTime', startTime);
      if (endTime) url.searchParams.append('endTime', endTime);
      if (searchCriteria) url.searchParams.append('searchCriteria', searchCriteria);
      if (searchValue) url.searchParams.append('searchValue', searchValue);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('API error');
      return await res.json();
    } catch (err) {
      console.error('[API Service] getRawSensorLogs error:', err);
      return [];
    }
  },

  async getSensorLogs(limit = 72, daysRange?: number, dateString?: string, reverseOrder = true, startTime?: string, endTime?: string): Promise<SensorReading[]> {
    try {
      const url = new URL(`${API_BASE_URL}/sensors`);
      url.searchParams.append('type', 'logs');
      url.searchParams.append('limit', String(limit));
      if (daysRange) url.searchParams.append('daysRange', String(daysRange));
      if (dateString) url.searchParams.append('dateString', dateString);
      if (startTime) url.searchParams.append('startTime', startTime);
      if (endTime) url.searchParams.append('endTime', endTime);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('API error');
      const data = await res.json();

      const mapped = data.map((row: any) => ({
        temperature: Number(row.temperature),
        humidity: Number(row.humidity),
        light: Number(row.light),
        status: 'NORMAL' as const,
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
      const res = await fetch(`${API_BASE_URL}/devices`);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      if (Array.isArray(data)) {
        return { devices: data, isEsp32Online: false };
      }
      return { devices: data.devices || [], isEsp32Online: !!data.isEsp32Online };
    } catch (err) {
      console.error('[API Service] getDevices error:', err);
      return { devices: [], isEsp32Online: false };
    }
  },

  async updateDeviceState(
    deviceId: string, 
    isON: boolean, 
    oldState?: boolean, 
    deviceCode?: string, 
    userId?: number
  ): Promise<{ success: boolean; isON?: boolean; error?: string }> {
    try {
      const res = await fetch(`${API_BASE_URL}/devices/${deviceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isON, oldState, deviceCode, userId }),
      });
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
    dateString?: string, 
    startTime?: string, 
    endTime?: string,
    searchTime?: string,
    deviceFilter?: string,
    actionFilter?: string,
    statusFilter?: string
  ): Promise<MergedHistoryItem[]> {
    try {
      const url = new URL(`${API_BASE_URL}/system`);
      url.searchParams.append('type', 'history');
      if (dateString) url.searchParams.append('dateString', dateString);
      if (startTime) url.searchParams.append('startTime', startTime);
      if (endTime) url.searchParams.append('endTime', endTime);
      if (searchTime) url.searchParams.append('searchTime', searchTime);
      if (deviceFilter) url.searchParams.append('deviceFilter', deviceFilter);
      if (actionFilter) url.searchParams.append('actionFilter', actionFilter);
      if (statusFilter) url.searchParams.append('statusFilter', statusFilter);

      const res = await fetch(url.toString());
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

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      return data.profile;
    } catch (err) {
      console.error('[API Service] getUserProfile error:', err);
      return null;
    }
  },

  async updateUserProfile(profile: Partial<UserProfile>): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE_URL}/user`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      return res.ok;
    } catch (err) {
      console.error('[API Service] updateUserProfile error:', err);
      return false;
    }
  },

  async verifyUserLogin(username: string, password: string): Promise<any | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.user;
    } catch (err) {
      console.error('[API Service] verifyUserLogin error:', err);
      return null;
    }
  }
};
