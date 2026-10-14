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
