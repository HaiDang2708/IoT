export const formatDateTime = (t: string | Date | undefined | null): string => {
  if (!t) return '';
  if (typeof t === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(t)) {
    return t;
  }
  const d = new Date(t);
  if (isNaN(d.getTime())) return String(t);

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const mins = String(d.getMinutes()).padStart(2, '0');
  const secs = String(d.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${mins}:${secs}`;
};

export const LETTER_REGEX = /[a-zA-Z\u00C0-\u024F\u1E00-\u1EFF]/;
export const TIME_REGEX = /^(\d{4}([-/]\d{1,2}([-/]\d{1,2}(\s+\d{1,2}(:\d{1,2}(:\d{1,2})?)?)?)?)?|\d{1,2}(:\d{1,2}(:\d{1,2})?)?|\d{1,2}[-/]\d{1,2}([-/]\d{4}(\s+\d{1,2}(:\d{1,2}(:\d{1,2})?)?)?)?)$/;

export const validateTimeInput = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (LETTER_REGEX.test(trimmed)) {
    return 'Thời gian không được chứa chữ cái (VD: 01:19:18, 01:19, 01 hoặc 2026-10-15)';
  }
  if (!TIME_REGEX.test(trimmed)) {
    return 'Định dạng thời gian không hợp lệ (VD: 01:19:18, 01:19, 01 hoặc 2026-10-15)';
  }
  return null;
};
