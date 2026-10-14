const express = require('express');
const router = express.Router();
const mysqlSensorService = require('../services/mysqlSensorService');
const mysqlDeviceService = require('../services/mysqlDeviceService');
const mysqlUserService = require('../services/mysqlUserService');
const { getIsEsp32Online, waitForDeviceAck } = require('../handlers/mqttHandler');

// =========================================================================
// 1. AUTH API: Xác thực đăng nhập
// POST /api/auth/login
// =========================================================================
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
// 2. USER API: Quản lý Hồ sơ & Mật khẩu
// GET /api/user?username=... (Lấy profile)
// PUT /api/user (Cập nhật Profile hoặc Đổi mật khẩu)
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

router.put('/user', async (req, res) => {
  const { username, profile, oldPassword, newPassword } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Vui lòng cung cấp username' });
  }

  // 1. Đổi mật khẩu nếu request gửi kèm mật khẩu cũ & mới
  if (oldPassword && newPassword) {
    const success = await mysqlUserService.updateUserPassword(username, oldPassword, newPassword);
    if (!success) {
      return res.status(400).json({ error: 'Đổi mật khẩu thất bại (Có thể do sai mật khẩu cũ)' });
    }
    return res.json({ success: true, message: 'Đổi mật khẩu thành công' });
  }

  // 2. Cập nhật Profile
  if (profile) {
    const success = await mysqlUserService.updateUserProfile(username, profile);
    if (!success) {
      return res.status(500).json({ error: 'Cập nhật hồ sơ thất bại' });
    }
    return res.json({ success: true, message: 'Cập nhật hồ sơ thành công' });
  }

  return res.status(400).json({ error: 'Thiếu dữ liệu cập nhật (profile hoặc password)' });
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
  const { isON, current_state, ten_thiet_bi, device_name, vi_tri, location, deviceCode, userId } = req.body;
  const { client: mqttClient, coreTopics } = require('../config/mqtt');

  let codeToUse = deviceCode || (deviceId === '1' ? 'led1' : deviceId === '2' ? 'led2' : deviceId === '3' ? 'led3' : '');
  let updatedState = isON !== undefined ? !!isON : current_state !== undefined ? !!current_state : null;

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
      mqttClient.publish(coreTopics.DEVICE_CONTROL, payload, { retain: true });
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

  // 2. Cập nhật Tên thiết bị
  if (ten_thiet_bi !== undefined || device_name !== undefined) {
    await mysqlDeviceService.updateDevicePartial(deviceId, { ten_thiet_bi, device_name });
  }

  res.json({ success: true });
});

// =========================================================================
// 4. SENSOR API: Quan trắc Cảm biến & Biểu đồ Analytics
// GET /api/sensors?type=logs | chart | raw_logs
// =========================================================================
router.get('/sensors', async (req, res) => {
  const { type, limit, daysRange, dateString, startTime, endTime } = req.query;


  if (type === 'raw_logs') {
    const { searchCriteria, searchValue } = req.query;
    const rawLogs = await mysqlSensorService.getRawSensorLogs(
      limit || 150, 
      dateString, 
      startTime, 
      endTime,
      searchCriteria,
      searchValue
    );
    return res.json(rawLogs);
  }

  const logs = await mysqlSensorService.getSensorLogs(limit || 72, daysRange, dateString, startTime, endTime);
  res.json(logs);
});

// =========================================================================
// 5. SYSTEM API: Cảnh báo Navbar & Lịch sử
// GET /api/system?type=history | warnings
// =========================================================================
router.get('/system', async (req, res) => {
  const { type, dateString, startTime, endTime, searchTime, deviceFilter, actionFilter, statusFilter, device, action, status, time } = req.query;

  if (type === 'history') {
    const sTime = searchTime || time || null;
    const dev = deviceFilter || device || null;
    const act = actionFilter || action || null;
    const st = statusFilter || status || null;
    const history = await mysqlDeviceService.getMergedHistory(dateString, startTime, endTime, sTime, dev, act, st);
    return res.json(history);
  }


  res.json({ success: true });
});

module.exports = router;
