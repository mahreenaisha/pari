import type { Strings } from '@/i18n/strings';

/** Amounts read the same in every language, as in UPI apps and Pari's own lines: "₹12,450". */
const money = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/** Zero in each Indian script the app's languages use. */
const INDIC_ZEROS = [0x0966, 0x09e6, 0x0a66, 0x0ae6, 0x0b66, 0x0be6, 0x0c66, 0x0ce6, 0x0d66];
const INDIC_DIGIT =
  /[\u0966-\u096f\u09e6-\u09ef\u0a66-\u0a6f\u0ae6-\u0aef\u0b66-\u0b6f\u0be6-\u0bef\u0c66-\u0c6f\u0ce6-\u0cef\u0d66-\u0d6f]/g;

/**
 * Dates follow the merchant's language but keep 0–9, which Bengali and Marathi don't by default.
 * Hermes on iOS ignores `numberingSystem`, so the digits are converted after formatting.
 */
function westernDigits(text: string) {
  return text.replace(INDIC_DIGIT, (digit) => {
    const code = digit.charCodeAt(0);
    return String(code - INDIC_ZEROS.find((zero) => code >= zero && code <= zero + 9)!);
  });
}

type DateFormats = { time: Intl.DateTimeFormat; weekdayDate: Intl.DateTimeFormat; monthYear: Intl.DateTimeFormat };
const dateFormats = new Map<string, DateFormats>();

/** Some engines, Chrome among them, lack Odia or have Punjabi without month names ("M10"); English reads better then. */
function hasMonthNames(locale: string) {
  if (Intl.DateTimeFormat.supportedLocalesOf(locale).length === 0) return false;
  return !/M\d/.test(new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2026, 9, 1)));
}

function datesIn(locale: string) {
  let formats = dateFormats.get(locale);
  if (!formats) {
    const tag = hasMonthNames(locale) ? locale : 'en-IN';
    formats = {
      time: new Intl.DateTimeFormat(tag, { hour: 'numeric', minute: '2-digit' }),
      weekdayDate: new Intl.DateTimeFormat(tag, { weekday: 'short', day: 'numeric', month: 'short' }),
      monthYear: new Intl.DateTimeFormat(tag, { month: 'long', year: 'numeric' }),
    };
    dateFormats.set(locale, formats);
  }
  return formats;
}

/** Formats an amount given in paise, e.g. 1245000 → "₹12,450". */
export function formatMoney(paise: number) {
  return money.format(paise / 100);
}

/** "9876543210" → "98765 43210", the way Indian mobile numbers are usually read out. */
export function formatPhone(digits: string) {
  return digits.length === 10 ? `${digits.slice(0, 5)} ${digits.slice(5)}` : digits;
}

export function formatTime(iso: string, locale: string) {
  return westernDigits(datesIn(locale).time.format(new Date(iso))).toLowerCase();
}

export function formatMonth(locale: string, date = new Date()) {
  return westernDigits(datesIn(locale).monthYear.format(date));
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** "Today", "Yesterday", or a short date such as "Mon, 27 Oct", in the merchant's language. */
export function formatDayLabel(iso: string, strings: Strings, now = new Date()) {
  const days = Math.round((startOfDay(now) - startOfDay(new Date(iso))) / 86_400_000);
  if (days === 0) return strings.ledger.today;
  if (days === 1) return strings.ledger.yesterday;
  return westernDigits(datesIn(strings.locale).weekdayDate.format(new Date(iso)));
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}
