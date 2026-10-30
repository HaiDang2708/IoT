CREATE DATABASE IF NOT EXISTS dang_iot CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dang_iot;

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

DROP TABLE IF EXISTS device_logs;
DROP TABLE IF EXISTS sensor_logs;
DROP TABLE IF EXISTS sensors;
DROP TABLE IF EXISTS devices;
DROP TABLE IF EXISTS users;

-- 1. Bảng lưu trữ tài khoản người dùng và thông tin cá nhân
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ten_dang_nhap VARCHAR(50) UNIQUE NOT NULL,
    mat_khau TEXT NOT NULL,
    ho_ten VARCHAR(100),
    email VARCHAR(100),
    ngay_sinh DATE,
    so_dien_thoai VARCHAR(20),
    github VARCHAR(100),
    drive VARCHAR(100),
    api_doc TEXT,
    figma TEXT,
    avatar TEXT,
    mssv VARCHAR(50),
    lop_hanh_chinh VARCHAR(50),
    khoa VARCHAR(100),
    giang_vien_huong_dan VARCHAR(100),
    mui_gio VARCHAR(50),
    gioi_tinh VARCHAR(10),
    dia_chi VARCHAR(255),
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng danh sách thiết bị điều khiển
CREATE TABLE devices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ma_thiet_bi VARCHAR(50) UNIQUE NOT NULL,
    ten_thiet_bi VARCHAR(100) NOT NULL,
    chan_gpio INT NOT NULL,
    trang_thai_hien_tai BOOLEAN DEFAULT FALSE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bảng danh mục cảm biến
CREATE TABLE sensors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id INT NULL,
    ma_cam_bien VARCHAR(50) UNIQUE NOT NULL,
    ten_cam_bien VARCHAR(100) NOT NULL,
    loai_cam_bien VARCHAR(50) NOT NULL,
    don_vi VARCHAR(20) NOT NULL,
    nguong_canh_bao DECIMAL(6,1) DEFAULT 300.0,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Bảng nhật ký dữ liệu cảm biến
CREATE TABLE sensor_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sensor_id INT NOT NULL,
    gia_tri DECIMAL(6,1) NOT NULL,
    thoi_gian DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sensor_id) REFERENCES sensors(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Bảng nhật ký thao tác điều khiển thiết bị
CREATE TABLE device_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id INT,
    user_id INT NULL,
    trang_thai_moi BOOLEAN NOT NULL,
    ket_qua VARCHAR(20) DEFAULT 'SUCCESS',
    thoi_gian DATETIME DEFAULT CURRENT_TIMESTAMP,
    thoi_gian_phan_hoi DATETIME NULL,
    FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Chỉ mục tăng tốc truy vấn
CREATE INDEX idx_sensor_logs_sensor_time ON sensor_logs (sensor_id, thoi_gian DESC);
CREATE INDEX idx_sensor_logs_thoi_gian ON sensor_logs (thoi_gian DESC);
CREATE INDEX idx_device_logs_thoi_gian ON device_logs (thoi_gian DESC);

-- Chèn dữ liệu mẫu ban đầu
-- Mật khẩu mặc định: 123456 mã hóa bcrypt
INSERT INTO users (id, ten_dang_nhap, mat_khau, ho_ten, email, ngay_sinh, so_dien_thoai, github, drive, api_doc, figma, avatar, mssv, lop_hanh_chinh, khoa, giang_vien_huong_dan, mui_gio, gioi_tinh, dia_chi) 
VALUES (
    1,
    'ADMIN', 
    '$2b$10$WFi0QkVLe22.hviUMnjFge7lQVk2w/s9pXdDiZ/7O/3rvlbv7LzB6', 
    'Đặng', 
    'student@ptit.edu.vn', 
    '2005-01-01', 
    '0987654321', 
    'https://github.com', 
    'https://drive.google.com',
    'https://documenter.getpostman.com',
    'https://www.figma.com',
    '/anhthe.png',
    'DN11',
    'BCN01',
    'CNTT',
    'TS. B',
    'Asia/Ho_Chi_Minh',
    'Nam',
    'Hà Nội, Việt Nam'
);

-- Khởi tạo danh sách thiết bị
INSERT INTO devices (id, ma_thiet_bi, ten_thiet_bi, chan_gpio, trang_thai_hien_tai) 
VALUES 
(1, 'led1', 'Quạt', 11, FALSE),
(2, 'led2', 'Máy hút ẩm', 12, FALSE),
(3, 'led3', 'Đèn sân', 7, FALSE),
(4, 'led_alert', 'LED cảnh báo', 6, FALSE);

-- Khởi tạo danh mục cảm biến
INSERT INTO sensors (id, device_id, ma_cam_bien, ten_cam_bien, loai_cam_bien, don_vi, nguong_canh_bao)
VALUES
(1, 1, 'temp_sensor', 'Cảm biến nhiệt độ', 'temperature', '°C', NULL),
(2, 1, 'hum_sensor', 'Cảm biến độ ẩm', 'humidity', '%', NULL),
(3, 1, 'light_sensor', 'Cảm biến ánh sáng', 'light', 'lux', 300.0);

-- Một số bản ghi quan trắc mẫu
INSERT INTO sensor_logs (sensor_id, gia_tri, thoi_gian) VALUES
(1, 28.5, NOW() - INTERVAL 10 SECOND),
(2, 65.0, NOW() - INTERVAL 10 SECOND),
(3, 480.0, NOW() - INTERVAL 10 SECOND),
(1, 28.6, NOW() - INTERVAL 5 SECOND),
(2, 64.8, NOW() - INTERVAL 5 SECOND),
(3, 485.0, NOW() - INTERVAL 5 SECOND),
(1, 28.5, NOW()),
(2, 65.2, NOW()),
(3, 490.0, NOW());

-- Một số bản ghi lịch sử điều khiển mẫu
INSERT INTO device_logs (device_id, user_id, trang_thai_moi, ket_qua, thoi_gian, thoi_gian_phan_hoi) VALUES
(1, 1, 0, 'SUCCESS', NOW() - INTERVAL 30 SECOND, NOW() - INTERVAL 29 SECOND),
(2, 1, 0, 'SUCCESS', NOW() - INTERVAL 20 SECOND, NOW() - INTERVAL 19 SECOND),
(3, 1, 0, 'SUCCESS', NOW() - INTERVAL 10 SECOND, NOW() - INTERVAL 9 SECOND);
