
/**
 * Helper phân tích cú pháp chuỗi thời gian phân cấp (Hierarchical Time Query)
 * Hỗ trợ linh hoạt:
 * - Giờ:Phút:Giây (HH:mm:ss) -> Giờ:Phút (HH:mm) -> Giờ (HH)
 * - Năm-Tháng-Ngày Giờ:Phút:Giây -> ... -> Năm
 * - Định dạng Việt Nam: DD/MM/YYYY ...
 * @param {string|null} searchTime Chuỗi người dùng nhập
 * @param {string} colName Tên cột trong SQL (ví dụ: 'sl.thoi_gian', 'dl.thoi_gian')
 * @returns {{ clause: string, params: Array }}
 */
function buildSmartTimeCondition(searchTime, colName = 'sl.thoi_gian') {
  if (!searchTime || typeof searchTime !== 'string') return { clause: '', params: [] };
  const raw = searchTime.trim();
  if (!raw) return { clause: '', params: [] };

  const pad2 = (n) => String(n).padStart(2, '0');

  // 1. Full datetime có giây: YYYY-MM-DD HH:mm:ss hoặc DD/MM/YYYY HH:mm:ss
  let m = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})$/);
  if (m) {
    const val = `${m[1]}-${pad2(m[2])}-${pad2(m[3])} ${pad2(m[4])}:${pad2(m[5])}:${pad2(m[6])}`;
    return { clause: `DATE_FORMAT(${colName}, '%Y-%m-%d %H:%i:%s') = ?`, params: [val] };
  }
  m = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})$/);
  if (m) {
    const val = `${m[3]}-${pad2(m[2])}-${pad2(m[1])} ${pad2(m[4])}:${pad2(m[5])}:${pad2(m[6])}`;
    return { clause: `DATE_FORMAT(${colName}, '%Y-%m-%d %H:%i:%s') = ?`, params: [val] };
  }

  // 2. Datetime có phút: YYYY-MM-DD HH:mm hoặc DD/MM/YYYY HH:mm
  m = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})\s+(\d{1,2}):(\d{1,2})$/);
  if (m) {
    const val = `${m[1]}-${pad2(m[2])}-${pad2(m[3])} ${pad2(m[4])}:${pad2(m[5])}`;
    return { clause: `DATE_FORMAT(${colName}, '%Y-%m-%d %H:%i') = ?`, params: [val] };
  }
  m = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})\s+(\d{1,2}):(\d{1,2})$/);
  if (m) {
    const val = `${m[3]}-${pad2(m[2])}-${pad2(m[1])} ${pad2(m[4])}:${pad2(m[5])}`;
    return { clause: `DATE_FORMAT(${colName}, '%Y-%m-%d %H:%i') = ?`, params: [val] };
  }

  // 3. Datetime có giờ: YYYY-MM-DD HH hoặc DD/MM/YYYY HH
  m = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})\s+(\d{1,2})$/);
  if (m) {
    const val = `${m[1]}-${pad2(m[2])}-${pad2(m[3])} ${pad2(m[4])}`;
    return { clause: `DATE_FORMAT(${colName}, '%Y-%m-%d %H') = ?`, params: [val] };
  }
  m = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})\s+(\d{1,2})$/);
  if (m) {
    const val = `${m[3]}-${pad2(m[2])}-${pad2(m[1])} ${pad2(m[4])}`;
    return { clause: `DATE_FORMAT(${colName}, '%Y-%m-%d %H') = ?`, params: [val] };
  }

  // 4. Chỉ Ngày-Tháng-Năm: YYYY-MM-DD hoặc DD/MM/YYYY hoặc DD-MM-YYYY
  m = raw.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (m) {
    const val = `${m[1]}-${pad2(m[2])}-${pad2(m[3])}`;
    return { clause: `DATE(${colName}) = ?`, params: [val] };
  }
  m = raw.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (m) {
    const val = `${m[3]}-${pad2(m[2])}-${pad2(m[1])}`;
    return { clause: `DATE(${colName}) = ?`, params: [val] };
  }

  // 5. Năm-Tháng: YYYY-MM hoặc MM/YYYY
  m = raw.match(/^(\d{4})[-/](\d{1,2})$/);
  if (m) {
    const val = `${m[1]}-${pad2(m[2])}`;
    return { clause: `DATE_FORMAT(${colName}, '%Y-%m') = ?`, params: [val] };
  }
  m = raw.match(/^(\d{1,2})[-/](\d{4})$/);
  if (m) {
    const val = `${m[2]}-${pad2(m[1])}`;
    return { clause: `DATE_FORMAT(${colName}, '%Y-%m') = ?`, params: [val] };
  }

  // 6. Giờ:Phút:Giây (HH:mm:ss)
  m = raw.match(/^(\d{1,2}):(\d{1,2}):(\d{1,2})$/);
  if (m) {
    const val = `${pad2(m[1])}:${pad2(m[2])}:${pad2(m[3])}`;
    return { clause: `DATE_FORMAT(${colName}, '%H:%i:%s') = ?`, params: [val] };
  }

  // 7. Giờ:Phút (HH:mm)
  m = raw.match(/^(\d{1,2}):(\d{1,2})$/);
  if (m) {
    const val = `${pad2(m[1])}:${pad2(m[2])}`;
    return { clause: `DATE_FORMAT(${colName}, '%H:%i') = ?`, params: [val] };
  }

  // 8. Năm 4 chữ số: YYYY
  m = raw.match(/^(\d{4})$/);
  if (m) {
    return { clause: `YEAR(${colName}) = ?`, params: [parseInt(m[1], 10)] };
  }

  // 9. Chỉ 1 hoặc 2 chữ số: Giờ (HH từ 00 đến 23)
  m = raw.match(/^(\d{1,2})$/);
  if (m) {
    const num = parseInt(m[1], 10);
    if (num >= 0 && num <= 23) {
      return { clause: `DATE_FORMAT(${colName}, '%H') = ?`, params: [pad2(num)] };
    }
  }

  // 10. Fallback tìm chuỗi an toàn
  return { clause: `DATE_FORMAT(${colName}, '%Y-%m-%d %H:%i:%s') LIKE ?`, params: [`%${raw}%`] };
}

module.exports = {
  buildSmartTimeCondition
};
