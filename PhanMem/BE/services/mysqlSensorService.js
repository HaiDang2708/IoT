const db = require('../config/mysql');
const { buildSmartTimeCondition } = require('../utils/dateHelper');

const lastSensorReading = {
  temp: null,
  hum: null,
  lux: null,
  isUpdated: false
};

// Cấu hình bộ đệm định danh Cảm biến từ bảng `sensors`
const sensorMap = {
  temperature: 1,
  humidity: 2,
  light: 3
};

async function loadSensorMap() {
  try {
    const [rows] = await db.query('SELECT id, loai_cam_bien FROM sensors');
    if (rows && rows.length > 0) {
      rows.forEach(r => {
        sensorMap[r.loai_cam_bien] = r.id;
      });
    }
  } catch (err) {
    console.error('[MySQL Error] Không thể nạp sensor map từ CSDL:', err.message);
  }
}

// Khởi tạo bộ đệm cảm biến ban đầu bằng cách lấy bản ghi gần đây nhất trong MySQL từ bảng sensor_logs & sensors
async function initializeSensorCache() {
  try {
    await loadSensorMap();
    const [rows] = await db.query(`
      SELECT s.loai_cam_bien, sl.gia_tri 
      FROM sensor_logs sl
      JOIN sensors s ON sl.sensor_id = s.id
      ORDER BY sl.thoi_gian DESC LIMIT 10
    `);
    if (rows && rows.length > 0) {
      rows.forEach(r => {
        if (r.loai_cam_bien === 'temperature' && lastSensorReading.temp === null) lastSensorReading.temp = parseFloat(r.gia_tri);
        if (r.loai_cam_bien === 'humidity' && lastSensorReading.hum === null) lastSensorReading.hum = parseFloat(r.gia_tri);
        if (r.loai_cam_bien === 'light' && lastSensorReading.lux === null) lastSensorReading.lux = parseFloat(r.gia_tri);
      });
    }
  } catch (err) {
    console.error('[MySQL Error] Khong the khoi tao cache tu MySQL:', err.message);
  }
}


// Ghi nhận giá trị cảm biến chuẩn hóa vào bảng sensor_logs theo từng sensor_id
async function insertSensorReading() {
  if (lastSensorReading.isUpdated) {
    const temp = lastSensorReading.temp;
    const hum = lastSensorReading.hum;
    const lux = lastSensorReading.lux;

    if (temp === null || hum === null || lux === null) {
      return;
    }

    try {
      const now = new Date();
      const tempSensorId = sensorMap['temperature'] || 1;
      const humSensorId = sensorMap['humidity'] || 2;
      const lightSensorId = sensorMap['light'] || 3;

      await db.query(
        'INSERT INTO sensor_logs (sensor_id, gia_tri, thoi_gian) VALUES (?, ?, ?), (?, ?, ?), (?, ?, ?)',
        [
          tempSensorId, temp, now,
          humSensorId, hum, now,
          lightSensorId, lux, now
        ]
      );
      lastSensorReading.isUpdated = false;
    } catch (err) {
      console.error('[MySQL-DB Error] Khong the chen log cam bien vao MySQL:', err.message);
    }
  }
}


// API: Lấy danh sách log cảm biến cho Frontend (Sử dụng SQL PIVOT đảm bảo 100% tương thích API cũ)
async function getSensorLogs(limit = 72) {
  try {
    const tempId = sensorMap['temperature'] || 1;
    const humId = sensorMap['humidity'] || 2;
    const lightId = sensorMap['light'] || 3;

    const sql = `
      SELECT 
        ROUND(MAX(CASE WHEN sl.sensor_id = ${tempId} THEN sl.gia_tri END), 1) as temperature,
        ROUND(MAX(CASE WHEN sl.sensor_id = ${humId} THEN sl.gia_tri END), 1) as humidity,
        ROUND(MAX(CASE WHEN sl.sensor_id = ${lightId} THEN sl.gia_tri END), 1) as light,
        DATE_FORMAT(sl.thoi_gian, '%Y-%m-%dT%H:%i:%s') as timestamp
      FROM sensor_logs sl
      GROUP BY sl.thoi_gian
      ORDER BY sl.thoi_gian DESC
      LIMIT ?
    `;

    const [rows] = await db.query(sql, [parseInt(limit)]);
    return rows.map(r => ({
      temperature: r.temperature !== null ? parseFloat(r.temperature) : 0,
      humidity: r.humidity !== null ? parseFloat(r.humidity) : 0,
      light: r.light !== null ? parseFloat(r.light) : 0,
      timestamp: r.timestamp
    }));
  } catch (err) {
    console.error('[MySQL-Service Error] getSensorLogs failed:', err.message);
    return [];
  }
}

// API: Khởi động chu kỳ ghi log cảm biến định kỳ
let logIntervalTimer = null;

function startLoggingInterval(seconds) {
  if (logIntervalTimer) {
    clearInterval(logIntervalTimer);
  }

  console.log(`[System] Khoi dong chu ky ghi log cam bien: ${seconds} giay/lan.`);
  logIntervalTimer = setInterval(async () => {
    await insertSensorReading();
  }, seconds * 1000);
}

// API: Lấy dữ liệu cảm biến dạng bảng thô 4 cột (ID MySQL, Tên cảm biến, Giá trị, Thời gian)
async function getRawSensorLogs(limit = 100, searchCriteria = null, searchValue = null) {
  try {
    let conditions = [];
    let params = [];

    // Tìm kiếm theo tiêu chí và từ khóa
    if (searchValue !== null && searchValue !== undefined && String(searchValue).trim() !== '') {
      const trimmedVal = String(searchValue).trim();
      if (searchCriteria === 'time') {
        // Tìm kiếm theo chuỗi thời gian phân cấp (Giờ:Phút:Giây -> Giờ:Phút -> Giờ, v.v.)
        const timeCond = buildSmartTimeCondition(trimmedVal, 'sl.thoi_gian');
        if (timeCond.clause) {
          conditions.push(timeCond.clause);
          params.push(...timeCond.params);
        }
      } else if (searchCriteria === 'temperature' || searchCriteria === 'humidity' || searchCriteria === 'light') {
        // Lọc đúng loại cảm biến và tìm kiếm chính xác theo giá trị số được nhập
        const numVal = parseFloat(trimmedVal);
        conditions.push(`s.loai_cam_bien = ? AND sl.gia_tri = ?`);
        params.push(searchCriteria, isNaN(numVal) ? trimmedVal : numVal);
      } else if (searchCriteria === 'all' || !searchCriteria) {
        // Tìm kiếm tổng quát
        const timeCond = buildSmartTimeCondition(trimmedVal, 'sl.thoi_gian');
        const timeClause = timeCond.clause || "DATE_FORMAT(sl.thoi_gian, '%Y-%m-%d %H:%i:%s') LIKE ?";
        const timeParams = timeCond.clause ? timeCond.params : [`%${trimmedVal}%`];

        conditions.push(`(
          s.ten_cam_bien LIKE ? OR 
          s.loai_cam_bien LIKE ? OR 
          CAST(sl.gia_tri AS CHAR) LIKE ? OR 
          ${timeClause}
        )`);
        const likeVal = `%${trimmedVal}%`;
        params.push(likeVal, likeVal, likeVal, ...timeParams);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(parseInt(limit));

    const sql = `
      SELECT 
        sl.id,
        s.ten_cam_bien,
        s.loai_cam_bien,
        s.don_vi,
        sl.gia_tri,
        DATE_FORMAT(sl.thoi_gian, '%Y-%m-%dT%H:%i:%s') as timestamp
      FROM sensor_logs sl
      JOIN sensors s ON sl.sensor_id = s.id
      ${whereClause}
      ORDER BY sl.id DESC
      LIMIT ?
    `;

    const [rows] = await db.query(sql, params);
    return rows.map(r => ({
      id: r.id,
      ten_cam_bien: r.ten_cam_bien,
      loai_cam_bien: r.loai_cam_bien,
      don_vi: r.don_vi,
      gia_tri: parseFloat(r.gia_tri),
      timestamp: r.timestamp
    }));
  } catch (err) {
    console.error('[MySQL-Service Error] getRawSensorLogs failed:', err.message);
    return [];
  }
}

module.exports = {
  lastSensorReading,
  initializeSensorCache,
  insertSensorReading,
  getSensorLogs,
  getRawSensorLogs,
  startLoggingInterval
};
