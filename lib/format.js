// Russian-language formatting helpers. Pure functions — safe to unit test in Node.

/**
 * Picks the correct Russian plural form.
 * plural(1, ['действие', 'действия', 'действий']) -> 'действие'
 */
export function plural(n, forms) {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (last > 1 && last < 5) return forms[1];
  if (last === 1) return forms[0];
  return forms[2];
}

export function pluralize(n, forms) {
  return `${formatNumber(n)} ${plural(n, forms)}`;
}

const numberFormatters = new Map();

export function formatNumber(value, maximumFractionDigits = 0) {
  if (!Number.isFinite(value)) return '—';
  let fmt = numberFormatters.get(maximumFractionDigits);
  if (!fmt) {
    fmt = new Intl.NumberFormat('ru-RU', { maximumFractionDigits });
    numberFormatters.set(maximumFractionDigits, fmt);
  }
  return fmt.format(value);
}

const dateFmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });
const dateTimeFmt = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDate(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return dateFmt.format(d);
}

export function formatDateTime(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return dateTimeFmt.format(d);
}

/** Local calendar day key, e.g. "2026-10-14" (not UTC, so streaks follow the user's day). */
export function dayKey(value) {
  const d = value instanceof Date ? value : new Date(value);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Human-readable "how long ago" in Russian. */
export function timeAgo(value, now = Date.now()) {
  const t = value instanceof Date ? value.getTime() : new Date(value).getTime();
  if (Number.isNaN(t)) return '—';
  const diffMin = Math.round((now - t) / 60000);
  if (diffMin < 1) return 'только что';
  if (diffMin < 60) return `${pluralize(diffMin, ['минуту', 'минуты', 'минут'])} назад`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${pluralize(diffH, ['час', 'часа', 'часов'])} назад`;
  const diffD = Math.round(diffH / 24);
  return `${pluralize(diffD, ['день', 'дня', 'дней'])} назад`;
}

/** Days between today and a YYYY-MM-DD deadline (negative = overdue). */
export function daysUntil(deadline, now = new Date()) {
  if (!deadline) return null;
  const [y, m, d] = deadline.split('-').map(Number);
  if (!y || !m || !d) return null;
  const target = new Date(y, m - 1, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target - today) / 86400000);
}

export function deadlineLabel(deadline, now = new Date()) {
  const days = daysUntil(deadline, now);
  if (days === null) return null;
  if (days < 0) return { text: `просрочено на ${pluralize(-days, ['день', 'дня', 'дней'])}`, tone: 'danger' };
  if (days === 0) return { text: 'сегодня', tone: 'warn' };
  if (days === 1) return { text: 'завтра', tone: 'warn' };
  return { text: `через ${pluralize(days, ['день', 'дня', 'дней'])}`, tone: 'neutral' };
}
