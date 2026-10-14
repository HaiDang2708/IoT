# 🏡 SMART HOME IoT MONITORING & CONTROL SYSTEM — BÀI THỰC HÀNH 3
*(Mạch ESP32-S3 / Lolin S3 Mini — Node.js Backend — React Web Dashboard — MySQL Database)*

<div align="center">

[![ESP32 Hardware](https://img.shields.io/badge/ESP32--S3-Hardware-2F74B5?style=for-the-badge&logo=espressif&logoColor=white)](https://www.espressif.com/)
[![Node.js Backend](https://img.shields.io/badge/Node.js-Backend-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React Frontend](https://img.shields.io/badge/React-Frontend-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![MySQL Database](https://img.shields.io/badge/MySQL-Database-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![MQTT Protocol](https://img.shields.io/badge/MQTT-EMQX_Broker-00B2A9?style=for-the-badge&logo=mqtt&logoColor=white)](https://www.emqx.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-Styling-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

</div>

---

## 👨‍🎓 Thông Tin Sinh Viên & Đề Tài

* **Họ và tên:** Đặng Trần Hải Đăng
* **Mã số sinh viên (MSSV):** B23DCAT036
* **Lớp hành chính:** D23CQAT01-B
* **Khoa đào tạo:** An Toàn Thông Tin (ATTT)
* **Giảng viên hướng dẫn:** TS. Nguyễn Quốc Uy
* **Cơ sở đào tạo:** Học viện Công nghệ Bưu chính Viễn thông (PTIT Hà Nội)
* **Học phần:** Thực hành Internet of Things (IoT)

---

## 📖 Giới Thiệu Dự Án

Hệ thống **Smart Home IoT Monitoring & Control System** là giải pháp giám sát môi trường và điều khiển thiết bị thông minh toàn diện, tích hợp chặt chẽ giữa 3 tầng công nghệ:
1. **Tầng Phần Cứng (Hardware Layer):** Vi điều khiển **ESP32-S3 (Lolin S3 Mini)** giao tiếp với cảm biến nhiệt độ - độ ẩm `DHT11`, cảm biến cường độ ánh sáng số `BH1750` qua chuẩn I2C, và điều khiển 3 cơ cấu chấp hành (Quạt, Máy hút ẩm, Đèn ngoài trời).
2. **Tầng Dịch Vụ Máy Chủ (Backend Layer):** Máy chủ **Node.js / Express** đóng vai trò cầu nối thông minh giữa giao thức **MQTT** (`broker.emqx.io:1883`) và cơ sở dữ liệu quan hệ **MySQL** (`dang_iot`), đồng thời cung cấp hệ thống REST API chuẩn hóa cho ứng dụng phía người dùng.
3. **Tầng Giao Diện Người Dùng (Frontend Layer):** Ứng dụng Web **React 19 + TypeScript + Vite + Tailwind CSS** với giao diện hiện đại, trực quan, hỗ trợ vẽ biểu đồ đường đa trục theo chuỗi thời gian thực, bảng nhật ký phân trang động và tìm kiếm dữ liệu nâng cao.

---

## 📁 Cấu Trúc Thư Mục Dự Án

Dự án được tổ chức tách biệt, rõ ràng theo chuẩn module hóa:

```text
BaiThucHanh3/
├── PhanCung/                                # MÃ NGUỒN PHẦN CỨNG ESP32 (PLATFORMIO)
│   ├── platformio.ini                       # Cấu hình board Lolin S3 Mini và các thư viện
│   └── src/
│       ├── main.cpp                         # Mã nguồn C++ xử lý đọc cảm biến, WiFi, MQTT
│       └── secrets.h                        # Khai báo thông số mạng và xác thực MQTT
│
└── PhanMem/                                 # MÃ NGUỒN PHẦN MỀM HỆ THỐNG
    ├── BE/                                  # BACKEND REST API & MQTT-TO-MYSQL BRIDGE
    │   ├── config/
    │   │   ├── mqtt.js                      # Cấu hình kết nối MQTT Broker và định nghĩa Topics
    │   │   └── mysql.js                     # Quản lý MySQL Connection Pool (mysql2/promise)
    │   ├── handlers/
    │   │   └── mqttHandler.js               # Xử lý nhận tin MQTT, Heartbeat và ACK thiết bị
    │   ├── routes/
    │   │   └── api.js                       # Định nghĩa các REST API Endpoints
    │   ├── services/
    │   │   ├── mysqlDeviceService.js        # Nghiệp vụ thiết bị và nhật ký điều khiển
    │   │   ├── mysqlSensorService.js        # Nghiệp vụ cảm biến và bộ đệm số liệu
    │   │   └── mysqlUserService.js          # Nghiệp vụ hồ sơ sinh viên và xác thực Login
    │   ├── utils/
    │   │   └── dateHelper.js                # Xử lý bộ lọc khoảng thời gian SQL
    │   ├── .env                             # Biến môi trường (DB Host, Port, MQTT Broker)
    │   ├── .env.example                     # Bản mẫu biến môi trường
    │   ├── index.js                         # Điểm khởi chạy chính máy chủ Express (Port 5000)
    │   └── package.json                     # Danh sách phụ thuộc Backend
    │
    └── FE/                                  # FRONTEND WEB DASHBOARD (REACT + TS + VITE)
        ├── public/                          # Tài nguyên tĩnh (ảnh đại diện anhthe.png, truong.png)
        ├── src/
        │   ├── components/                  # Thành phần giao diện dùng chung
        │   │   └── Common/                  # Button, Card, Table, Pagination, Toast, Loading
        │   ├── contexts/
        │   │   └── AppContext.tsx           # Context quản lý State toàn cục & đồng bộ dữ liệu
        │   ├── layouts/
        │   │   ├── MainLayout.tsx           # Bố cục khung sườn giao diện chính
        │   │   ├── Navbar.tsx               # Thanh điều hướng trên, cờ ESP32 Online & đồng hồ
        │   │   └── Sidebar.tsx              # Menu chuyển trang và nút Đăng xuất
        │   ├── pages/
        │   │   ├── Dashboard.tsx            # Trang chủ: Thẻ đo, công tắc thiết bị, biểu đồ Chart.js
        │   │   ├── Sensor.tsx               # Trang nhật ký cảm biến, tìm kiếm Regex & phân trang
        │   │   ├── History.tsx              # Trang lịch sử bật/tắt thiết bị & bộ lọc 4 tiêu chí
        │   │   ├── Profile.tsx              # Trang hồ sơ sinh viên PTIT & liên kết dự án
        │   │   └── Login.tsx                # Trang xác thực đăng nhập bảo mật
        │   ├── services/api/
        │   │   └── apiService.ts            # Tầng giao tiếp HTTP REST API tới Backend
        │   ├── types/
        │   │   └── index.ts                 # Định nghĩa TypeScript Interfaces toàn hệ thống
        │   ├── utils/
        │   │   └── date.ts                  # Tiện ích định dạng ngày giờ chuẩn YYYY-MM-DD HH:mm:ss
        │   ├── App.tsx                      # Cấu hình Routes và Router Guard
        │   ├── main.tsx                     # Điểm gắn kết React DOM
        │   └── index.css                    # Cấu hình Tailwind CSS, animation và glow effects
        ├── index.html                       # HTML gốc của ứng dụng Web
        ├── package.json                     # Danh mục dependencies Frontend
        ├── tsconfig.json                    # Cấu hình TypeScript compiler
        └── vite.config.ts                   # Cấu hình đóng gói Vite
```

---

## 🏛️ Kiến Trúc Hệ Thống (System Architecture)

```mermaid
flowchart TD
    subgraph HARDWARE["Phần Cứng (ESP32-S3 Lolin S3 Mini)"]
        DHT["Cảm biến DHT11<br/>(GPIO 8)"] --> ESP["ESP32 Vi Điều Khiển"]
        BH["Cảm biến BH1750 (I2C)<br/>(SDA: 10, SCL: 9)"] --> ESP
        ESP --> LED1["LED 1: Quạt (GPIO 11)"]
        ESP --> LED2["LED 2: Máy hút ẩm (GPIO 12)"]
        ESP --> LED3["LED 3: Đèn ngoài trời (GPIO 7)"]
    end

    subgraph BROKER["MQTT Broker (broker.emqx.io:1883)"]
        T_SENSOR["Topic: Sensor"]
        T_CMD["Topic: Device_control"]
        T_ACK["Topic: Device_respond"]
    end

    subgraph BACKEND["Backend Server (Node.js / Express :5000)"]
        MQTT_CLIENT["MQTT Client & Heartbeat Monitor"]
        REST_API["REST API Router (/api/*)"]
        SERVICES["Sensor / Device / User Services"]
    end

    subgraph DATABASE["Cơ Sở Dữ Liệu (MySQL :3306)"]
        DB[("Database: dang_iot<br/>• devices<br/>• sensors<br/>• sensor_logs<br/>• device_logs<br/>• users")]
    end

    subgraph FRONTEND["Frontend Web Dashboard (React + TS :5173)"]
        UI_DASH["Dashboard: Cards + Biểu đồ Chart.js"]
        UI_SENS["Sensor: Bảng đo + Tìm kiếm Regex"]
        UI_HIST["History: Lịch sử thao tác + Auto-poll"]
        UI_PROF["Profile & Login: Xác thực người dùng"]
    end

    ESP -- "Publish dữ liệu 3s/lần" --> T_SENSOR
    T_SENSOR --> MQTT_CLIENT
    MQTT_CLIENT -- "Nhận phản hồi ACK" <-- T_ACK
    ESP -- "Publish trạng thái mới" --> T_ACK
    MQTT_CLIENT -- "Gửi lệnh điều khiển" --> T_CMD
    T_CMD --> ESP

    MQTT_CLIENT --> SERVICES
    REST_API --> SERVICES
    SERVICES <--> DB

    FRONTEND <-->|"HTTP GET / PATCH / POST / PUT"| REST_API
```

---

## 🔌 Đặc Tả Phần Cứng (Hardware Specification)

### 1. Sơ đồ nối chân vi điều khiển ESP32 (Lolin S3 Mini)

| Thành phần | Module / Linh kiện | Chân ESP32 | Giao thức / Chức năng |
| :--- | :--- | :---: | :--- |
| **Cảm biến nhiệt độ - độ ẩm** | DHT11 | **GPIO 8** | 1-Wire Digital Signal |
| **Cảm biến cường độ ánh sáng** | BH1750 | **SDA: GPIO 10<br/>SCL: GPIO 9** | Giao tiếp số I2C (Chuẩn độ phân giải cao `CONTINUOUS_HIGH_RES_MODE`) |
| **Cơ cấu chấp hành 1 (Quạt)** | LED 1 (Xanh dương / Rơ-le) | **GPIO 11** | Ngõ ra số (OUTPUT), HIGH = BẬT, LOW = TẮT |
| **Cơ cấu chấp hành 2 (Máy hút ẩm)** | LED 2 (Vàng / Rơ-le) | **GPIO 12** | Ngõ ra số (OUTPUT), HIGH = BẬT, LOW = TẮT |
| **Cơ cấu chấp hành 3 (Đèn ngoài trời)** | LED 3 (Đỏ / Rơ-le) | **GPIO 7** | Ngõ ra số (OUTPUT), HIGH = BẬT, LOW = TẮT |

---

## 📡 Đặc Tả Giao Thức MQTT & Topics

Hệ thống sử dụng MQTT Broker công cộng **`broker.emqx.io`** trên cổng **`1883`** (TCP) với **3 Topic cốt lõi**:

### 1. `Sensor` (Dữ liệu đo đạc cảm biến)
* **Hướng truyền:** `ESP32` $\rightarrow$ `MQTT Broker` $\rightarrow$ `Backend`
* **Chu kỳ phát:** Định kỳ mỗi **3000 ms (3 giây)**.
* **Cấu trúc gói tin JSON:**
  ```json
  {
    "temperature": 28.5,
    "humidity": 65.0,
    "light": 480.0
  }
  ```
* **Chức năng:** Truyền số đo môi trường tức thời vào bộ đệm và lưu trữ vào bảng `sensor_logs`. Gói tin này đồng thời đóng vai trò **Heartbeat**; nếu Backend không nhận được gói tin trong quá **8 giây**, hệ thống tự động xác định trạng thái phần cứng chuyển sang `ESP32 Offline`.

### 2. `Device_control` (Lệnh điều khiển thiết bị)
* **Hướng truyền:** `Backend / Web Dashboard` $\rightarrow$ `MQTT Broker` $\rightarrow$ `ESP32`
* **Cấu trúc gói tin JSON:**
  ```json
  {
    "LED1": "ON"
  }
  ```
  *(Có thể truyền điều khiển riêng lẻ từng thiết bị hoặc đồng thời nhiều thiết bị, ví dụ: `{"LED1":"ON", "LED2":"OFF"}`).*

### 3. `Device_respond` (Xác nhận trạng thái vật lý thực tế)
* **Hướng truyền:** `ESP32` $\rightarrow$ `MQTT Broker` $\rightarrow$ `Backend`
* **Cờ cấu hình:** `retain = true` (Giúp các client mới kết nối ngay lập tức nắm bắt được trạng thái mạch).
* **Cấu trúc gói tin JSON:**
  ```json
  {
    "LED1": "ON",
    "LED2": "OFF",
    "LED3": "OFF"
  }
  ```
* **Chức năng:** Sau khi ESP32 thực thi lệnh gạt chân GPIO tương ứng, nó lập tức gửi gói tin xác nhận này. Backend bắt được tin sẽ ghi nhận thời điểm hoàn thành vào cột `thoi_gian_phan_hoi` trong bảng `device_logs`, xác nhận kết quả `SUCCESS`.

### 4. Lệnh kiểm thử nhanh bằng Mosquitto CLI

* **Lắng nghe dữ liệu cảm biến:**
  ```bash
  mosquitto_sub -h broker.emqx.io -p 1883 -t "Sensor" -v
  ```
* **Lắng nghe phản hồi trạng thái thiết bị:**
  ```bash
  mosquitto_sub -h broker.emqx.io -p 1883 -t "Device_respond" -v
  ```
* **Bắn lệnh bật Quạt (LED1):**
  ```bash
  mosquitto_pub -h broker.emqx.io -p 1883 -t "Device_control" -m "{\"LED1\":\"ON\"}"
  ```
* **Bắn lệnh tắt Quạt (LED1):**
  ```bash
  mosquitto_pub -h broker.emqx.io -p 1883 -t "Device_control" -m "{\"LED1\":\"OFF\"}"
  ```

---

## 🗄️ Thiết Kế Cơ Sở Dữ Liệu Chuẩn Hóa MySQL (`dang_iot`)

Hệ thống triển khai trên CSDL MySQL chuẩn hóa 3NF, lưu trữ tại `localhost:3306`:

### 1. Bảng `devices` (Danh mục thiết bị đầu ra)
| Cột | Kiểu dữ liệu | Ràng buộc | Diễn giải |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `AUTO_INCREMENT PRIMARY KEY` | Khóa chính |
| `ma_thiet_bi` | `VARCHAR(50)` | `UNIQUE NOT NULL` | Mã định danh (`led1`, `led2`, `led3`) |
| `ten_thiet_bi` | `VARCHAR(100)`| `NOT NULL` | Tên hiển thị (`QUẠT`, `MÁY HÚT ẨM`, `ĐÈN SÂN`) |
| `chan_gpio` | `INT` | `NOT NULL` | Số chân GPIO vật lý nối trên ESP32 |
| `trang_thai_hien_tai` | `BOOLEAN` | `DEFAULT FALSE` | Trạng thái hiện tại: `1` (ON) / `0` (OFF) |

### 2. Bảng `sensors` (Danh mục cảm biến)
| Cột | Kiểu dữ liệu | Ràng buộc | Diễn giải |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `AUTO_INCREMENT PRIMARY KEY` | Khóa chính |
| `device_id` | `INT` | `FOREIGN KEY` $\rightarrow$ `devices(id)` | Liên kết tới thiết bị chứa |
| `ma_cam_bien` | `VARCHAR(50)` | `UNIQUE NOT NULL` | `temp_sensor`, `hum_sensor`, `light_sensor` |
| `ten_cam_bien` | `VARCHAR(100)`| `NOT NULL` | Tên cảm biến hiển thị |
| `loai_cam_bien` | `VARCHAR(50)` | `NOT NULL` | Phân loại: `temperature`, `humidity`, `light` |
| `don_vi` | `VARCHAR(20)` | `NOT NULL` | Đơn vị đo lường: `°C`, `%`, `lux` |

### 3. Bảng `sensor_logs` (Nhật ký quan trắc môi trường)
| Cột | Kiểu dữ liệu | Ràng buộc | Diễn giải |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `AUTO_INCREMENT PRIMARY KEY` | Khóa chính |
| `sensor_id` | `INT` | `FOREIGN KEY` $\rightarrow$ `sensors(id)` | Cảm biến sinh số liệu |
| `gia_tri` | `DECIMAL(6,1)`| `NOT NULL` | Giá trị đo được từ cảm biến |
| `thoi_gian` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP` | Thời điểm ghi nhận vào CSDL |

### 4. Bảng `device_logs` (Lịch sử thao tác điều khiển thiết bị)
| Cột | Kiểu dữ liệu | Ràng buộc | Diễn giải |
| :--- | :--- | :--- | :--- |
| `id` | `INT` | `AUTO_INCREMENT PRIMARY KEY` | Khóa chính |
| `device_id` | `INT` | `FOREIGN KEY` $\rightarrow$ `devices(id)` | Thiết bị được điều khiển |
| `user_id` | `INT` | `FOREIGN KEY` $\rightarrow$ `users(id)` | Người thực hiện lệnh |
| `trang_thai_moi`| `BOOLEAN` | `NOT NULL` | Trạng thái yêu cầu: `1` (Bật) / `0` (Tắt) |
| `ket_qua` | `VARCHAR(20)` | `DEFAULT 'SUCCESS'` | Trạng thái: `SUCCESS`, `LOADING`, `FAILED` |
| `thoi_gian` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP` | Thời điểm phát lệnh |
| `thoi_gian_phan_hoi` | `DATETIME` | `NULL` | Thời điểm nhận được ACK từ ESP32 |

### 5. Bảng `users` (Tài khoản & Hồ sơ sinh viên)
Lưu trữ hồ sơ tác giả và tài khoản quản trị hệ thống (`ADMIN` / mật khẩu mã hóa bcrypt tương ứng `123456`).

---

## 🚀 Danh Mục REST API Backend (`http://localhost:5000/api`)

| Phương thức | Endpoint | Tham số Query / Body | Chức năng |
| :---: | :--- | :--- | :--- |
| `GET` | `/api/devices` | Không có | Lấy danh sách 3 thiết bị và cờ `isEsp32Online` |
| `PATCH` | `/api/devices/:id` | `body: { isON, oldState, deviceCode, userId }` | Gửi lệnh bật/tắt thiết bị qua MQTT, chờ phản hồi và trả về kết quả |
| `GET` | `/api/sensors` | `?type=logs&limit=25` | Lấy dữ liệu cảm biến ghép chuỗi (Pivot) vẽ biểu đồ Chart.js |
| `GET` | `/api/sensors` | `?type=raw_logs&limit=150&searchCriteria=...&searchValue=...` | Lấy bảng nhật ký cảm biến chi tiết có lọc và tìm kiếm |
| `GET` | `/api/system` | `?type=history&searchTime=...&deviceFilter=...` | Lấy lịch sử điều khiển thiết bị kèm 4 bộ lọc kết hợp |
| `GET` | `/api/user` | `?username=ADMIN` | Lấy hồ sơ cá nhân sinh viên |
| `PUT` | `/api/user` | `body: { ...thông tin sinh viên }` | Cập nhật hồ sơ sinh viên |
| `POST` | `/api/auth/login` | `body: { username, password }` | Xác thực đăng nhập vào hệ thống |

---

## 🎨 Điểm Nổi Bật Trên Giao Diện Web Dashboard

1. **Giữ nguyên 100% bản sắc thiết kế Bài 3:** Toàn bộ hệ thống Card bo góc tròn cao cấp, bảng màu Tailwind gradient, icon xoay trạng thái động và hiệu ứng phát sáng mượt mà được giữ nguyên vẹn.
2. **Thuật toán Ngắt Nét Biểu Đồ (Gap Detection):**
   * Nếu khoảng cách giữa 2 điểm dữ liệu liên tiếp $> 8$ giây (do ESP32 mất nguồn hoặc ngắt mạng WiFi), hệ thống tự động chèn điểm `null` vào chuỗi dữ liệu của Chart.js.
   * Biểu đồ sẽ ngắt quãng phản ánh đúng thực tế đứt kết nối, không vẽ đường thẳng nối giả tạo.
3. **Theo Dõi ESP32 Heartbeat:**
   * Badge trên Navbar tự động đổi trạng thái tức thời giữa `ESP32 Online` (xanh nhấp nháy) và `ESP32 Offline` (xám tĩnh) dựa trên tín hiệu phát sóng thực tế.
4. **Bộ Lọc & Tìm Kiếm Kiểm Tra Regex Nâng Cao:**
   * Ngăn chặn hoàn toàn việc nhập ký tự chữ cái khi đang tìm kiếm theo mốc thời gian hoặc giá trị cảm biến.
   * Hỗ trợ tìm kiếm theo nhiều định dạng ngày (`YYYY-MM-DD`), giờ (`HH:mm:ss`) hoặc cả hai.
5. **Cơ Chế Polling Thông Minh:**
   * Tự động làm mới dữ liệu cảm biến định kỳ mỗi 3 giây khi người dùng đang xem trang.
   * Tự động kích hoạt polling tốc độ cao 1.5 giây/lần khi phát hiện có lệnh đang ở trạng thái chờ phản hồi (`PENDING`/`LOADING`) để kịp thời cập nhật thời gian phản hồi từ mạch.

---

## 🛠️ Hướng Dẫn Cài Đặt & Khởi Chạy

### Yêu cầu tiên quyết
* **Node.js:** Phiên bản $\ge$ 18.0.0
* **MySQL Server:** Đang chạy tại `localhost:3306` (đã có cơ sở dữ liệu `dang_iot`)
* **VS Code & PlatformIO IDE:** (Nếu cần nạp mã nguồn xuống mạch ESP32)

---

### Bước 1: Khởi động Backend Máy Chủ

1. Mở cửa sổ Terminal, di chuyển vào thư mục Backend:
   ```powershell
   cd BaiThucHanh3\PhanMem\BE
   ```
2. Khởi chạy máy chủ:
   ```powershell
   npm start
   ```
3. Khi khởi động thành công, màn hình sẽ hiển thị:
   ```text
   ==================================================
   🚀 SMART HOME BACKEND SERVER READY
   🌐 REST API Server : http://localhost:5000/api
   🗄️ MySQL Database  : Connected (dang_iot)
   ☁️ MQTT Broker     : broker.emqx.io:1883
   ==================================================
   ```

---

### Bước 2: Khởi động Giao Diện Frontend Web

1. Mở một cửa sổ Terminal mới, di chuyển vào thư mục Frontend:
   ```powershell
   cd BaiThucHanh3\PhanMem\FE
   ```
2. Khởi chạy máy chủ phát triển Vite:
   ```powershell
   npm run dev
   ```
3. Mở trình duyệt web và truy cập địa chỉ:
   ```text
   http://localhost:5173
   ```
4. **Thông tin đăng nhập mặc định:**
   * **Tên đăng nhập:** `ADMIN`
   * **Mật khẩu:** `123456`

---

### Bước 3: Nạp Code Phần Cứng Cho ESP32 (Tùy chọn)

1. Mở thư mục `BaiThucHanh3\PhanCung` bằng **Visual Studio Code**.
2. Kiểm tra thông số WiFi trong tệp `src/main.cpp` (SSID: `HaiDang`).
3. Kết nối mạch **Lolin S3 Mini** với máy tính qua cổng Type-C.
4. Nhấn biểu tượng **PlatformIO: Upload** trên thanh trạng thái phía dưới để nạp chương trình.
5. Mở **Serial Monitor** với tốc độ Baud `115200` để theo dõi các bản tin log đọc cảm biến và nhận lệnh MQTT.

---

## 🏆 Đánh Giá Kết Quả Thực Nghiệm

* [x] **Xóa sạch mock data:** Tệp `mockData.ts` và toàn bộ dữ liệu giả lập đã được loại bỏ hoàn toàn khỏi mã nguồn.
* [x] **Biên dịch Frontend hoàn hảo:** `npm run build` chạy thành công không có bất kỳ cảnh báo hoặc lỗi TypeScript nào.
* [x] **Dữ liệu thật 100%:** Toàn bộ thẻ thông số, biểu đồ phân tích, bảng dữ liệu cảm biến (hơn 26.600 dòng) và lịch sử thao tác đều được truy vấn trực tiếp từ MySQL `dang_iot`.
* [x] **Điều khiển 2 chiều:** Bật/tắt công tắc trên Web phát lệnh qua REST API $\rightarrow$ MQTT $\rightarrow$ ESP32 gạt chân GPIO $\rightarrow$ Gửi phản hồi ACK $\rightarrow$ Ghi nhận thời gian đáp ứng thực tế.
* [x] **Cấu trúc thư mục chuẩn hóa:** Chia tách rành mạch thành `PhanCung`, `PhanMem/BE` và `PhanMem/FE`.
