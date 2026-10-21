const express = require('express');
const router = express.Router();
const mysqlSensorService = require('../services/mysqlSensorService');
const mysqlDeviceService = require('../services/mysqlDeviceService');
const mysqlUserService = require('../services/mysqlUserService');
const { getIsEsp32Online, waitForDeviceAck } = require('../handlers/mqttHandler');
const { client: mqttClient, coreTopics } = require('../config/mqtt');

// 1. AUTH API: Xác thực đăng nhập
// POST /api/auth/login
router.post('/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
  }

  const user = await mysqlUserService.verifyUserLogin(username, password);
  if (!user) {
    return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không chính xác' });
  }

  res.json({ user });
});

// =========================================================================
// 2. USER API: Lấy thông tin Hồ sơ người dùng
// GET /api/user?username=...
// =========================================================================
router.get('/user', async (req, res) => {
  const username = req.query.username || req.query.ten_dang_nhap;
  if (!username) {
    return res.status(400).json({ error: 'Thiếu thông số username' });
  }

  const profile = await mysqlUserService.getUserProfile(username);
  if (!profile) {
    return res.status(404).json({ error: 'Không tìm thấy người dùng' });
  }

  res.json({ profile });
});


// =========================================================================
// 3. DEVICE API: Quản lý & Điều khiển Thiết bị
// GET /api/devices (Lấy danh sách)
// PATCH /api/devices/:id (Cập nhật: Bật/Tắt, Tên/Vị trí)
// =========================================================================
router.get('/devices', async (req, res) => {
  const devices = await mysqlDeviceService.getDevices();
  const isEsp32Online = getIsEsp32Online();
  res.json({ devices, isEsp32Online });
});

router.patch('/devices/:id', async (req, res) => {
  const deviceId = req.params.id;
  const { isON, deviceCode, userId } = req.body;

  let codeToUse = deviceCode || (deviceId === '1' ? 'led1' : deviceId === '2' ? 'led2' : deviceId === '3' ? 'led3' : '');
  let updatedState = isON !== undefined ? !!isON : null;

  // 1. Cập nhật Bật/Tắt thủ công
  if (updatedState !== null) {
    const result = await mysqlDeviceService.updateDeviceState(deviceId, updatedState);
    if (!result.success) {
      return res.status(500).json({ success: false, error: 'Lỗi cập nhật cơ sở dữ liệu' });
    }
    if (result.deviceCode) codeToUse = result.deviceCode;

    const isOnline = getIsEsp32Online();
    const pendingLogId = await mysqlDeviceService.insertDeviceLog(
      deviceId, 
      result.oldState, 
      updatedState, 
      userId || null, 
      'LOADING'
    );

    // Phát tin MQTT device_control xuống phần cứng ESP32 từ Backend Server
    if (mqttClient && mqttClient.connected && codeToUse) {
      const ledKey = codeToUse.toUpperCase(); // 'led1' -> 'LED1'
      const cmdVal = updatedState ? 'ON' : 'OFF';
      const payload = JSON.stringify({ [ledKey]: cmdVal });
      // Lệnh điều khiển tức thời (Action/Command), tuyệt đối KHÔNG retain để tránh tự bật khi ESP32 kết nối lại mạng
      mqttClient.publish(coreTopics.DEVICE_CONTROL, payload, { retain: false });
    }

    if (!isOnline) {
      // Nếu ESP32 đang offline -> Đánh dấu FAILED và rollback database về trạng thái cũ
      await mysqlDeviceService.updateDeviceLogStatus(pendingLogId, 'FAILED');
      await mysqlDeviceService.updateDeviceState(deviceId, result.oldState);
      return res.status(503).json({
        success: false,
        error: 'ESP32 hiện đang Offline hoặc mất kết nối mạng. Không thể điều khiển!'
      });
    }

    // Chờ phản hồi ACK từ ESP32 qua topic Device_respond (tối đa 3 giây)
    const ackResult = await waitForDeviceAck(codeToUse, 3000);

    if (ackResult.received) {
      await mysqlDeviceService.updateDeviceLogStatus(pendingLogId, 'SUCCESS');
      return res.json({ success: true, isON: ackResult.isON });
    } else {
      // Timeout 3s không nhận được phản hồi từ ESP32
      await mysqlDeviceService.updateDeviceLogStatus(pendingLogId, 'FAILED');
      // Rollback database state về trạng thái cũ
      await mysqlDeviceService.updateDeviceState(deviceId, result.oldState);
      return res.status(504).json({
        success: false,
        error: 'Thiết bị ESP32 không phản hồi trong thời gian quy định (Timeout 3s)!'
      });
    }
  }

  res.json({ success: true });
});

// =========================================================================
// 4. SENSOR API: Quan trắc Cảm biến & Biểu đồ Analytics
// GET /api/sensors?type=logs | chart | raw_logs
// =========================================================================
router.get('/sensors', async (req, res) => {
  const { type, limit, searchCriteria, searchValue } = req.query;

  if (type === 'raw_logs') {
    const rawLogs = await mysqlSensorService.getRawSensorLogs(
      limit || 150, 
      searchCriteria,
      searchValue
    );
    return res.json(rawLogs);
  }

  const logs = await mysqlSensorService.getSensorLogs(limit || 72);
  res.json(logs);
});

// =========================================================================
// 5. SYSTEM API: Cảnh báo Navbar & Lịch sử
// GET /api/system?type=history | warnings
// =========================================================================
router.get('/system', async (req, res) => {
  const { type, searchTime, deviceFilter, actionFilter, statusFilter } = req.query;

  if (type === 'history') {
    const history = await mysqlDeviceService.getMergedHistory(searchTime, deviceFilter, actionFilter, statusFilter);
    return res.json(history);
  }

  return res.status(400).json({ error: 'Yêu cầu tham số type=history hợp lệ' });
});

module.exports = router;
