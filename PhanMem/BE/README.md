# Dang IoT - Backend REST API & MQTT-to-MySQL Bridge

Ứng dụng Backend Node.js đóng vai trò **REST API Server** phục vụ cho Frontend, đồng thời chạy dịch vụ ngầm **MQTT-to-MySQL Bridge** để subscribe dữ liệu cảm biến và đồng bộ trạng thái thiết bị ESP32 tự động lưu trữ vào cơ sở dữ liệu MySQL 24/7.

---

## 🛠️ Cài đặt & Chạy ứng dụng

### 1. Cài đặt các thư viện cần thiết:
Mở terminal trong thư mục `BE/` và chạy lệnh sau để tải các dependencies (`express`, `mysql2`, `mqtt`, `bcryptjs`...):
```bash
npm install
```

### 2. Thiết lập cấu hình:
Đảm bảo tệp tin `.env` trong thư mục `BE/` đã được cấu hình đúng thông tin kết nối cơ sở dữ liệu MySQL và Broker MQTT:
*   `MYSQL_HOST` (Mặc định: `localhost`)
*   `MYSQL_USER`
*   `MYSQL_PASSWORD`
*   `MYSQL_DATABASE` (Mặc định: `dang_iot`)
*   `MQTT_BROKER_URL` (Mặc định là WebSocket broker public của HiveMQ `ws://broker.hivemq.com:8000/mqtt`)

### 3. Chạy dịch vụ:
*   **Chạy chế độ chính thức (Production):**
    ```bash
    npm start
    ```
*   **Chạy chế độ lập trình (Development - Tự động tải lại khi đổi code):**
    ```bash
    npm run dev
    ```

---

## ⚙️ Cơ chế hoạt động của Backend
1.  **Đồng bộ đo đạc định kỳ (Periodic Telemetry Logging):** Lắng nghe dữ liệu nhiệt độ, độ ẩm, ánh sáng được ESP32 gửi lên Broker. Định kỳ sau mỗi khoảng thời gian cấu hình (`logging_interval` đọc từ bảng `system_config`), Backend sẽ tự động lấy giá trị mới nhất trong Cache để chèn một bản ghi vào bảng `sensor_logs` của MySQL.
2.  **Đồng bộ trạng thái thiết bị (Physical Device State Sync):** Khi ESP32 thay đổi trạng thái đèn (Bật/Tắt do nút bấm cơ vật lý hoặc do bo mạch tự động kích hoạt), ESP32 gửi tin trạng thái về các topic state. Backend nhận được sẽ tự động cập nhật cột `trang_thai_hien_tai` trong bảng `devices` và tạo một bản ghi log trong bảng `device_logs` để đồng bộ.
3.  **Cảnh báo thời gian thực (Real-time Alerts):** Khi các chỉ số cảm biến vượt ngưỡng an toàn cài đặt (Nhiệt độ, Độ ẩm, Ánh sáng), Frontend hiển thị cảnh báo thị giác lập tức trên Dashboard.
4.  **Cung cấp REST API:** Phục vụ các yêu cầu HTTP GET/POST/PUT từ Frontend như đăng nhập, đổi mật khẩu, lấy lịch sử hoạt động gộp, thống kê thời gian chạy thiết bị và cập nhật các ngưỡng điều khiển động.
