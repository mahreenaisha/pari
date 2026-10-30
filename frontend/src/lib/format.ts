import type { MoneyDirection } from '@/types/ledger';

const LOCALE = 'en-IN';

const money = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});
const time = new Intl.DateTimeFormat(LOCALE, { hour: 'numeric', minute: '2-digit' });
const weekdayDate = new Intl.DateTimeFormat(LOCALE, { weekday: 'short', day: 'numeric', month: 'short' });
const monthYear = new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric' });

/** Formats an amount given in paise, e.g. 1245000 → "₹12,450". */
export function formatMoney(paise: number) {
  return money.format(paise / 100);
}

export function formatSignedMoney(paise: number, direction: MoneyDirection) {
  return `${direction === 'in' ? '+' : '−'}${formatMoney(paise)}`;
}

export function formatTime(iso: string) {
  return time.format(new Date(iso)).toLowerCase();
}

export function formatMonth(date = new Date()) {
  return monthYear.format(date);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** "Today", "Yesterday", or a short date such as "Mon, 27 Oct". */
export function formatDayLabel(iso: string, now = new Date()) {
  const days = Math.round((startOfDay(now) - startOfDay(new Date(iso))) / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return weekdayDate.format(new Date(iso));
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}
