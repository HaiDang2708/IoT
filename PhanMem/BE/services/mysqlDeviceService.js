const db = require('../config/mysql');
const { buildSmartTimeCondition } = require('../utils/dateHelper');

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
async function getMergedHistory(searchTime = null, deviceFilter = null, actionFilter = null, statusFilter = null) {
  const list = [];
  try {
    let conditions = [];
    let params = [];

    // 1. Tìm kiếm theo chuỗi thời gian người dùng nhập vào ô tìm kiếm (phân cấp thông minh)
    if (searchTime && String(searchTime).trim() !== '') {
      const trimmedTime = searchTime.trim();
      const sendCond = buildSmartTimeCondition(trimmedTime, 'dl.thoi_gian');
      const respCond = buildSmartTimeCondition(trimmedTime, 'dl.thoi_gian_phan_hoi');
      if (sendCond.clause && respCond.clause) {
        conditions.push(`(${sendCond.clause} OR ${respCond.clause})`);
        params.push(...sendCond.params, ...respCond.params);
      }
    }

    // 3. Lọc theo thiết bị (khớp chính xác tên hoặc mã thiết bị)
    if (deviceFilter && deviceFilter !== 'ALL' && deviceFilter !== 'Tất cả thiết bị') {
      conditions.push(`(d.ten_thiet_bi = ? OR d.ma_thiet_bi = ?)`);
      params.push(deviceFilter, deviceFilter);
    }

    // 4. Lọc theo hành động (ON / OFF)
    if (actionFilter && actionFilter !== 'ALL' && actionFilter !== 'Tất cả hành động') {
      const actVal = (actionFilter.toUpperCase() === 'ON' || actionFilter === '1');
      conditions.push(`dl.trang_thai_moi = ?`);
      params.push(actVal);
    }

    // 5. Lọc theo trạng thái (ON, OFF, LOADING, FAILED)
    if (statusFilter && statusFilter !== 'ALL' && statusFilter !== 'Tất cả trạng thái') {
      const stUpper = statusFilter.toUpperCase();
      if (stUpper === 'LOADING') {
        conditions.push(`(dl.ket_qua = 'LOADING' OR dl.ket_qua = 'PENDING')`);
      } else if (stUpper === 'ON') {
        conditions.push(`(dl.ket_qua = 'SUCCESS' AND dl.trang_thai_moi = 1)`);
      } else if (stUpper === 'OFF') {
        conditions.push(`(dl.ket_qua = 'SUCCESS' AND dl.trang_thai_moi = 0)`);
      } else if (stUpper === 'FAILED') {
        conditions.push(`dl.ket_qua = 'FAILED'`);
      }
    }

    const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(1000); // Lấy tối đa 1000 bản ghi mới nhất

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
      const actionReq = isON ? 'ON' : 'OFF';
      const isPending = (row.ket_qua === 'LOADING' || row.ket_qua === 'PENDING');
      const isFailed = (row.ket_qua === 'FAILED');
      
      let statusResult = isPending ? 'LOADING' : isFailed ? 'FAILED' : actionReq;

      list.push({
        id: row.id,
        ten_thiet_bi: row.ten_thiet_bi || 'Thiết bị',
        ma_thiet_bi: row.ma_thiet_bi,
        hanh_dong: actionReq, // 'ON' hoặc 'OFF'
        trang_thai: statusResult, // 'ON', 'OFF', 'LOADING', hoặc 'FAILED'
        thoi_gian_gui: row.thoi_gian_gui || '',
        thoi_gian_phan_hoi: isPending ? 'Đang chờ...' : (row.thoi_gian_phan_hoi || (isFailed ? 'Thất bại' : row.thoi_gian_gui)),
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
  insertDeviceLog,
  updateDeviceLogStatus,
  resolvePendingDeviceLogs,
  getMergedHistory,
  handleEsp32Offline
};
