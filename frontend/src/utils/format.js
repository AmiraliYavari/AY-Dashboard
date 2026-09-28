export function formatToman(value) {
  return new Intl.NumberFormat('fa-IR').format(Math.round(value || 0)) + ' تومان';
}

export function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('fa-IR').format(new Date(value));
}
