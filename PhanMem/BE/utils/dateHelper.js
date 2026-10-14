/**
 * Helper xây dựng điều kiện WHERE lọc thời gian dùng chung cho các câu SQL MySQL
 * @param {string|null} dateString Ngày định dạng YYYY-MM-DD
 * @param {string|null} startTime Giờ bắt đầu HH:mm hoặc HH:mm:ss
 * @param {string|null} endTime Giờ kết thúc HH:mm hoặc HH:mm:ss
 * @param {string} colName Tên cột thời gian trong SQL (ví dụ: 'sl.thoi_gian')
 * @returns {{ whereClause: string, params: Array }}
 */
function buildTimeRangeCondition(dateString, startTime, endTime, colName = 'sl.thoi_gian') {
  let whereClause = '';
  const params = [];

  if (dateString) {
    let st = startTime || '00:00:00';
    let et = endTime || '23:59:59';
    if (st.split(':').length === 2) st += ':00';
    if (et.split(':').length === 2) et += ':59';
    whereClause = ` WHERE ${colName} >= ? AND ${colName} <= ?`;
    params.push(`${dateString} ${st}`, `${dateString} ${et}`);
  } else if (startTime && endTime && (startTime !== '00:00:00' || endTime !== '23:59:59')) {
    let st = startTime || '00:00:00';
    let et = endTime || '23:59:59';
    if (st.split(':').length === 2) st += ':00';
    if (et.split(':').length === 2) et += ':59';
    whereClause = ` WHERE TIME(${colName}) >= ? AND TIME(${colName}) <= ?`;
    params.push(st, et);
  }

  return { whereClause, params };
}

module.exports = {
  buildTimeRangeCondition
};
