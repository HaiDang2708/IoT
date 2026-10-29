const db = require('../config/mysql');
const { client: mqttClient, coreTopics } = require('../config/mqtt');

let cachedThreshold = 300.0;
let alertDeviceId = 4; // Mặc định, tự động nạp từ CSDL khi khởi động
let isAlertActive = false;
let currentAlertLogId = null;

// Hàm phát ngưỡng cài đặt hiện tại lên topic Device_setting với cờ retain: true
function publishCurrentThreshold() {
  if (mqttClient && mqttClient.connected) {
    const payload = JSON.stringify({ threshold_lux: cachedThreshold });
    mqttClient.publish(coreTopics.DEVICE_SETTING, payload, { retain: true });
    console.log(`[AlertService] Đã đồng bộ ngưỡng ánh sáng (${cachedThreshold} lx) lên topic ${coreTopics.DEVICE_SETTING} (retain: true)`);
  }
}

// Khởi tạo nạp ngưỡng từ bảng sensors và ID LED cảnh báo từ bảng devices
async function initAlertSettings() {
  try {
    // 1. Tự động lấy ID thực tế của LED cảnh báo từ bảng devices
    const [devRows] = await db.query("SELECT id FROM devices WHERE ma_thiet_bi = 'led_alert' LIMIT 1");
    if (devRows && devRows.length > 0) {
      alertDeviceId = devRows[0].id;
      console.log(`[AlertService] Đã xác định ID thiết bị cảnh báo: ${alertDeviceId}`);
    }

    const [rows] = await db.query("SELECT nguong_canh_bao FROM sensors WHERE loai_cam_bien = 'light' LIMIT 1");
    if (rows && rows.length > 0 && rows[0].nguong_canh_bao !== null) {
      cachedThreshold = parseFloat(rows[0].nguong_canh_bao);
      console.log(`[AlertService] Đã nạp ngưỡng cảnh báo từ CSDL: ${cachedThreshold} lx`);
    }
    publishCurrentThreshold();
  } catch (err) {
    console.error('[AlertService] Error loading alert settings from DB:', err.message);
  }
}

async function getThreshold() {
  return cachedThreshold;
}

async function setThreshold(newThreshold) {
  const val = parseFloat(newThreshold);
  if (isNaN(val) || val < 0) throw new Error('Ngưỡng ánh sáng không hợp lệ');

  cachedThreshold = val;
  await db.query("UPDATE sensors SET nguong_canh_bao = ? WHERE loai_cam_bien = 'light'", [val]);

  publishCurrentThreshold();

  return cachedThreshold;
}

function getAlertStatus() {
  return {
    isAlertActive,
    threshold: cachedThreshold
  };
}

// Xử lý khi nhận số đo ánh sáng từ MQTT
async function checkLightAlert(currentLux) {
  if (currentLux === null || currentLux === undefined || isNaN(currentLux)) return;

  const shouldAlert = currentLux > cachedThreshold;

  if (shouldAlert) {
    if (!isAlertActive) {
      isAlertActive = true;
      try {
        const [res] = await db.query(
          "INSERT INTO device_logs (device_id, user_id, trang_thai_moi, ket_qua, thoi_gian, thoi_gian_phan_hoi) VALUES (?, NULL, 1, 'ALERT', NOW(), NOW())",
          [alertDeviceId]
        );
        console.log(` [AlertService] Phát hiện cảnh báo (Ánh sáng: ${currentLux} lx > ${cachedThreshold} lx), Log ID: ${res.insertId}`);
      } catch (err) {
        console.error('[AlertService] Failed to insert alert device log:', err.message);
      }
    }
  } else {
    if (isAlertActive) {
      // Ánh sáng đã hạ xuống <= X: kết thúc đợt cảnh báo, sẵn sàng cho đợt tiếp theo
      isAlertActive = false;
      console.log(`[AlertService] Kết thúc cảnh báo (Ánh sáng: ${currentLux} lx <= ${cachedThreshold} lx)`);
    }
  }
}

// Thống kê số lượt cảnh báo theo ngày  hoặc tháng  từ device_logs
async function getAlertStats(period = 'day') {
  try {
    // Lấy năm và tháng làm mốc dựa trên bản ghi gần nhất hoặc thời gian thực hiện tại
    const [latestRow] = await db.query(
      "SELECT thoi_gian FROM device_logs WHERE device_id = ? AND ket_qua = 'ALERT' ORDER BY thoi_gian DESC LIMIT 1",
      [alertDeviceId]
    );
    const refDate = latestRow && latestRow.length > 0 && latestRow[0].thoi_gian 
      ? new Date(latestRow[0].thoi_gian) 
      : new Date();

    const targetYear = refDate.getFullYear();
    const targetMonth = refDate.getMonth(); // 0-indexed (9 = tháng 10)

    if (period === 'month') {
      // 1. Thống kê theo 12 tháng trong năm (Tháng 1 -> Tháng 12)
      const [rows] = await db.query(`
        SELECT MONTH(thoi_gian) as m, COUNT(*) as count 
        FROM device_logs 
        WHERE device_id = ? AND ket_qua = 'ALERT' AND YEAR(thoi_gian) = ?
        GROUP BY m
      `, [alertDeviceId, targetYear]);

      const countMap = {};
      (rows || []).forEach(r => {
        countMap[r.m] = r.count;
      });

      const result = [];
      for (let m = 1; m <= 12; m++) {
        result.push({
          time_label: `Tháng ${m}`,
          count: countMap[m] || 0
        });
      }
      return result;
    } else {
      // 2. Thống kê theo tất cả các ngày trong tháng (ví dụ từ ngày 01 đến ngày 30/31)
      const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

      const [rows] = await db.query(`
        SELECT DAY(thoi_gian) as d, COUNT(*) as count 
        FROM device_logs 
        WHERE device_id = ? AND ket_qua = 'ALERT' AND YEAR(thoi_gian) = ? AND MONTH(thoi_gian) = ?
        GROUP BY d
      `, [alertDeviceId, targetYear, targetMonth + 1]);

      const countMap = {};
      (rows || []).forEach(r => {
        countMap[r.d] = r.count;
      });

      const result = [];
      const formattedMonth = (targetMonth + 1) < 10 ? `0${targetMonth + 1}` : `${targetMonth + 1}`;
      for (let d = 1; d <= daysInMonth; d++) {
        const formattedDay = d < 10 ? `0${d}` : `${d}`;
        result.push({
          time_label: `${formattedDay}/${formattedMonth}`,
          count: countMap[d] || 0
        });
      }
      return result;
    }
  } catch (err) {
    console.error('[AlertService] getAlertStats error:', err.message);
    return [];
  }
}

module.exports = {
  getThreshold,
  setThreshold,
  getAlertStatus,
  checkLightAlert,
  getAlertStats,
  initAlertSettings,
  publishCurrentThreshold
};
