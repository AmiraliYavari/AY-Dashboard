/** Parses a positive integer route/query param. Returns null when invalid. */
export function toId(value: unknown): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

/** Parses a strictly positive finite number (e.g. an amount). Returns null when invalid. */
export function toPositiveNumber(value: unknown): number | null {
  const n = typeof value === 'string' && value.trim() === '' ? NaN : Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Trims a string; empty / non-string values become null. */
export function cleanText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const t = value.trim();
  return t === '' ? null : t;
}

/** Escapes LIKE/ILIKE wildcards so user input is matched literally. */
export function likePattern(value: string): string {
  return `%${value.replace(/[\\%_]/g, '\\$&')}%`;
}

/** Valid YYYY-MM-DD string? */
export function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
}
