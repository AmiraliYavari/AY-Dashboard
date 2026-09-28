export function formatToman(value: number | string | undefined | null): string {
  return new Intl.NumberFormat('fa-IR').format(Math.round(Number(value) || 0)) + ' تومان';
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('fa-IR').format(new Date(value));
}
