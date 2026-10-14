// TypeScript Interfaces for Smart Home IoT System (BaiThucHanh3)

export type SensorStatus = 'NORMAL' | 'WARNING' | 'CRITICAL';
export type DeviceType = 'LED' | 'FAN' | 'PUMP' | string;

export interface UserProfile {
  id?: string;
  username: string;
  fullName: string;
  email: string;
  avatar: string;
  birthday: string;
  phone: string;
  github: string;
  drive: string;
  apiDoc?: string;
  figma?: string;
  mssv?: string;
  lopHanhChinh?: string;
  khoa?: string;
  giangVienHuongDan?: string;
  muiGio?: string;
  gioiTinh?: string;
  diaChi?: string;
}

export interface Device {
  id: string;
  device_code: string; // led1, led2, led3
  device_name: string;
  device_type: DeviceType;
  gpio_pin: number;
  mqtt_topic_cmd?: string;
  mqtt_topic_state?: string;
  location?: string;
  current_state: boolean;
}

export interface SensorReading {
  temperature: number;
  humidity: number;
  light: number;
  status: SensorStatus;
  timestamp: string;
}

export interface RawSensorLog {
  id: number;
  ten_cam_bien: string;
  loai_cam_bien: string;
  don_vi: string;
  gia_tri: number;
  timestamp: string;
}

export interface MergedHistoryItem {
  id: number | string;
  ten_thiet_bi: string;
  ma_thiet_bi?: string;
  hanh_dong: 'on' | 'off' | string;
  trang_thai: 'on' | 'off' | 'loading' | 'failed' | string;
  thoi_gian_gui: string;
  thoi_gian_phan_hoi: string;
  status?: string;
}
