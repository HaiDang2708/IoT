const db = require('../config/mysql');
const { coreTopics } = require('../config/mqtt');
const { buildTimeRangeCondition } = require('../utils/dateHelper');

// Đồng bộ trạng thái vật lý thực tế của thiết bị (LED) từ ESP32 gửi lên vào MySQL
async function syncDevicePhysicalState(code, isON) {
  try {
    const [devices] = await db.query('SELECT id, trang_thai_hien_tai FROM devices WHERE ma_thiet_bi = ?', [code]);
    if (devices.length === 0) return;
    const device = devices[0];

    const currentDbState = !!device.trang_thai_hien_tai;
    if (currentDbState !== isON) {
      await db.query('UPDATE devices SET trang_thai_hien_tai = ? WHERE ma_thiet_bi = ?', [isON, code]);
      await db.query(
        'INSERT INTO device_logs (device_id, user_id, trang_thai_moi, thoi_gian) VALUES (?, NULL, ?, NOW())',
        [device.id, isON]
      );
    }
  } catch (err) {
    console.error(`[MySQL-Error] Loi dong bo trang thai thiet bi ${code}:`, err.message);
  }
}

// API: Lấy danh sách thiết bị cho Frontend
async function getDevices() {
  try {
    const [rows] = await db.query('SELECT * FROM devices ORDER BY id ASC');
    return rows.map(row => ({
      id: String(row.id),
      device_code: row.ma_thiet_bi,
      device_name: row.ten_thiet_bi,
      device_type: 'LED',
      gpio_pin: row.chan_gpio,
      location: '',
      mqtt_topic_cmd: coreTopics.DEVICE_CONTROL || 'Device_control',
      mqtt_topic_state: coreTopics.DEVICE_RESPOND || 'Device_respond',
      current_state: !!row.trang_thai_hien_tai,
    }));
  } catch (err) {
    console.error('[MySQL-Service Error] getDevices failed:', err.message);
    return [];
  }
}

// API: Cập nhật trạng thái ON/OFF của thiết bị
async function updateDeviceState(deviceId, isON) {
  try {
    const [current] = await db.query('SELECT ma_thiet_bi, trang_thai_hien_tai FROM devices WHERE id = ?', [deviceId]);
    if (!current || current.length === 0) return { success: false, oldState: false, deviceCode: '' };
    
    const actualOldState = !!current[0].trang_thai_hien_tai;
    const [rows] = await db.query('UPDATE devices SET trang_thai_hien_tai = ? WHERE id = ?', [isON, deviceId]);
    
    return { success: rows.affectedRows > 0, oldState: actualOldState, deviceCode: current[0].ma_thiet_bi };
  } catch (err) {
    console.error('[MySQL-Service Error] updateDeviceState failed:', err.message);
    return { success: false, oldState: false, deviceCode: '' };
  }
}

// API: Cập nhật linh hoạt thuộc tính thiết bị (PATCH)
async function updateDevicePartial(deviceId, patchData) {
  try {
    const fields = [];
    const values = [];

    if (patchData.isON !== undefined || patchData.current_state !== undefined) {
      const isON = patchData.isON !== undefined ? !!patchData.isON : !!patchData.current_state;
      fields.push('trang_thai_hien_tai = ?');
      values.push(isON);
    }
    if (patchData.ten_thiet_bi !== undefined || patchData.device_name !== undefined) {
      const name = patchData.ten_thiet_bi !== undefined ? patchData.ten_thiet_bi : patchData.device_name;
      fields.push('ten_thiet_bi = ?');
      values.push(name);
    }

    if (fields.length === 0) return { success: true };

    values.push(deviceId);
    const sql = `UPDATE devices SET ${fields.join(', ')} WHERE id = ?`;
    const [result] = await db.query(sql, values);

    return { success: result.affectedRows > 0 };
  } catch (err) {
    console.error('[MySQL-Service Error] updateDevicePartial failed:', err.message);
    return { success: false, error: err.message };
  }
}

// API: Ghi log điều khiển thiết bị (Lưu vết user_id thực hiện)
async function insertDeviceLog(deviceId, oldState, newState, userId = null, ketQua = 'LOADING') {
  try {
    const isDone = (ketQua === 'SUCCESS');
    const [res] = await db.query(
      'INSERT INTO device_logs (device_id, user_id, trang_thai_moi, ket_qua, thoi_gian, thoi_gian_phan_hoi) VALUES (?, ?, ?, ?, NOW(), ?)',
      [deviceId, userId || null, newState, ketQua, isDone ? new Date() : null]
    );
    return res.insertId || null;
  } catch (err) {
    console.error('[MySQL-Service Error] insertDeviceLog failed:', err.message);
    return null;
  }
}

// API: Cập nhật trạng thái kết quả của dòng log điều khiển (Chỉ cập nhật nếu dòng log vẫn đang ở PENDING/LOADING)
async function updateDeviceLogStatus(logId, ketQua) {
  if (!logId) return false;
  try {
    await db.query(
      "UPDATE device_logs SET ket_qua = ?, thoi_gian_phan_hoi = NOW() WHERE id = ? AND (ket_qua = 'PENDING' OR ket_qua = 'LOADING')",
      [ketQua, logId]
    );
    return true;
  } catch (err) {
    console.error('[MySQL-Service Error] updateDeviceLogStatus failed:', err.message);
    return false;
  }
}

// API: Tự động giải quyết tất cả log PENDING/LOADING của thiết bị thành SUCCESS khi nhận được ACK từ phần cứng
async function resolvePendingDeviceLogs(deviceCode, ketQua = 'SUCCESS') {
  try {
    const [dev] = await db.query('SELECT id FROM devices WHERE ma_thiet_bi = ?', [deviceCode]);
    if (dev && dev.length > 0) {
      const deviceId = dev[0].id;
      await db.query(
        "UPDATE device_logs SET ket_qua = ?, thoi_gian_phan_hoi = NOW() WHERE device_id = ? AND (ket_qua = 'PENDING' OR ket_qua = 'LOADING')",
        [ketQua, deviceId]
      );
    }
  } catch (err) {
    console.error('[MySQL-Service Error] resolvePendingDeviceLogs failed:', err.message);
  }
}

// API: Lấy danh sách lịch sử hoạt động (Action History) chuẩn hóa theo yêu cầu
async function getMergedHistory(dateString = null, startTime = null, endTime = null, searchTime = null, deviceFilter = null, actionFilter = null, statusFilter = null) {
  const list = [];
  try {
    let conditions = [];
    let params = [];

    // 1. Lọc theo thời gian từ query params nếu có
    if (dateString || startTime || endTime) {
      const timeCond = buildTimeRangeCondition(dateString, startTime, endTime, 'dl.thoi_gian');
      if (timeCond.whereClause) {
        const rawClause = timeCond.whereClause.replace(/^\s*WHERE\s+/i, '');
        if (rawClause) {
          conditions.push(`(${rawClause})`);
          params.push(...timeCond.params);
        }
      }
    }

    // 2. Tìm kiếm theo chuỗi thời gian người dùng nhập vào ô tìm kiếm
    if (searchTime && String(searchTime).trim() !== '') {
      conditions.push(`(DATE_FORMAT(dl.thoi_gian, '%Y-%m-%d %H:%i:%s') LIKE ? OR DATE_FORMAT(dl.thoi_gian_phan_hoi, '%Y-%m-%d %H:%i:%s') LIKE ?)`);
      params.push(`%${searchTime.trim()}%`, `%${searchTime.trim()}%`);
    }

    // 3. Lọc theo thiết bị
    if (deviceFilter && deviceFilter !== 'ALL' && deviceFilter !== 'Tất cả thiết bị') {
      conditions.push(`(d.ten_thiet_bi LIKE ? OR d.ma_thiet_bi = ?)`);
      params.push(`%${deviceFilter}%`, deviceFilter);
    }

    // 4. Lọc theo hành động (on / off)
    if (actionFilter && actionFilter !== 'ALL' && actionFilter !== 'Tất cả hành động') {
      const actVal = (actionFilter.toLowerCase() === 'on' || actionFilter === '1');
      conditions.push(`dl.trang_thai_moi = ?`);
      params.push(actVal);
    }

    // 5. Lọc theo trạng thái (on, off, loading)
    if (statusFilter && statusFilter !== 'ALL' && statusFilter !== 'Tất cả trạng thái') {
      const stLower = statusFilter.toLowerCase();
      if (stLower === 'loading') {
        conditions.push(`(dl.ket_qua = 'LOADING' OR dl.ket_qua = 'PENDING')`);
      } else if (stLower === 'on') {
        conditions.push(`(dl.ket_qua = 'SUCCESS' AND dl.trang_thai_moi = 1)`);
      } else if (stLower === 'off') {
        conditions.push(`(dl.ket_qua = 'SUCCESS' AND dl.trang_thai_moi = 0)`);
      } else if (stLower === 'failed') {
        conditions.push(`dl.ket_qua = 'FAILED'`);
      }
    }

    const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(200); // Lấy tối đa 200 bản ghi mới nhất

    const devSql = `
      SELECT 
        dl.id,
        DATE_FORMAT(dl.thoi_gian, '%Y-%m-%d %H:%i:%s') as thoi_gian_gui,
        DATE_FORMAT(dl.thoi_gian_phan_hoi, '%Y-%m-%d %H:%i:%s') as thoi_gian_phan_hoi,
        dl.trang_thai_moi,
        COALESCE(dl.ket_qua, 'SUCCESS') as ket_qua,
        d.ten_thiet_bi,
        d.ma_thiet_bi,
        u.ten_dang_nhap,
        u.ho_ten
      FROM device_logs dl
      JOIN devices d ON dl.device_id = d.id
      LEFT JOIN users u ON dl.user_id = u.id
      ${whereSql}
      ORDER BY dl.id DESC
      LIMIT ?
    `;

    const [devLogs] = await db.query(devSql, params);
    
    devLogs.forEach(row => {
      const isON = !!row.trang_thai_moi;
      const actionReq = isON ? 'on' : 'off';
      const isPending = (row.ket_qua === 'LOADING' || row.ket_qua === 'PENDING');
      const isFailed = (row.ket_qua === 'FAILED');
      
      let statusResult = isPending ? 'loading' : isFailed ? 'failed' : actionReq;

      list.push({
        id: row.id,
        ten_thiet_bi: row.ten_thiet_bi || 'Thiết bị',
        ma_thiet_bi: row.ma_thiet_bi,
        hanh_dong: actionReq, // 'on' hoặc 'off'
        trang_thai: statusResult, // 'on', 'off', hoặc 'loading'
        thoi_gian_gui: row.thoi_gian_gui || '',
        thoi_gian_phan_hoi: isPending ? 'Đang chờ...' : (row.thoi_gian_phan_hoi || (isFailed ? 'Thất bại' : row.thoi_gian_gui)),
        // Bổ trợ:
        source: row.ho_ten || row.ten_dang_nhap || 'USER',
        time: row.thoi_gian_gui,
        status: row.ket_qua
      });
    });

  } catch (err) {
    console.error('[MySQL-Service Error] getMergedHistory failed:', err.message);
  }
  return list;
}

let isEsp32OfflineLogged = false;

async function handleEsp32Offline() {
  try {
    if (!isEsp32OfflineLogged) {
      console.log('🔴 [ESP32 Status] Trạng thái phần cứng: OFFLINE');
      isEsp32OfflineLogged = true;
    }
  } catch (err) {
    console.error('[MySQL-Error] Lỗi handleEsp32Offline:', err.message);
  }
}

module.exports = {
  syncDevicePhysicalState,
  getDevices,
  updateDeviceState,
  updateDevicePartial,
  insertDeviceLog,
  updateDeviceLogStatus,
  resolvePendingDeviceLogs,
  getMergedHistory,
  handleEsp32Offline
};
