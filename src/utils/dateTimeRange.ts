// Reusable validation/normalization for date and time ranges (start ≤ end).
//
// Pure utility — no UI, no network. Safe to use offline and from any consumer
// (UI components, deep links, `.pilotlog` imports, restored state).
//
// Scope decision (PAR-5): time ranges assume no flights cross midnight, so a
// strict `start ≤ end` rule applies to all time fields, including blockOut/blockIn.
// If overnight support is ever needed, add an `allowOvernight` mode here and
// adjust duration math to account for the next day.
//
// Usage:
//   isValidDateRange('2026-01-01', '2026-01-05') // true
//   isValidTimeRange('14:00', '12:00')           // false
//   normalizeTimeRange('14:00', '12:00')         // { start: '12:00', end: '14:00' }
//   minutesOfDay('14:30')                        // 870

import { isValid, parse } from 'date-fns';

export interface DateRangeValue {
  from: string; // "yyyy-MM-dd" or ""
  to: string;   // "yyyy-MM-dd" or ""
}

export interface TimeRangeValue {
  start: string; // "HH:mm" or ""
  end: string;   // "HH:mm" or ""
}

/** Minutes elapsed since 00:00 for an "HH:mm" string. Returns NaN if malformed. */
export function minutesOfDay(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return NaN;
  return h * 60 + m;
}

/** Parse a "yyyy-MM-dd" string into a Date, or null if invalid. */
function parseDate(value: string): Date | null {
  const d = parse(value, 'yyyy-MM-dd', new Date());
  return isValid(d) ? d : null;
}

/**
 * `true` when the date range is acceptable: either value empty, or `from ≤ to`.
 * Malformed dates are treated as not-yet-complete and return `true` so the UI
 * doesn't flag partial input; downstream save logic should require both values.
 */
export function isValidDateRange(from: string, to: string): boolean {
  if (!from || !to) return true;
  const a = parseDate(from);
  const b = parseDate(to);
  if (!a || !b) return true;
  return a.getTime() <= b.getTime();
}

/**
 * `true` when the time range is acceptable: either value empty, or `start ≤ end`
 * (equal is allowed). No midnight-crossing tolerance (see scope note above).
 */
export function isValidTimeRange(start: string, end: string): boolean {
  if (!start || !end) return true;
  const a = minutesOfDay(start);
  const b = minutesOfDay(end);
  if (Number.isNaN(a) || Number.isNaN(b)) return true;
  return a <= b;
}

/** Return the range with `from ≤ to`, swapping if inverted. Empty values pass through. */
export function normalizeDateRange(from: string, to: string): DateRangeValue {
  if (isValidDateRange(from, to)) return { from, to };
  return { from: to, to: from };
}

/** Return the range with `start ≤ end`, swapping if inverted. Empty values pass through. */
export function normalizeTimeRange(start: string, end: string): TimeRangeValue {
  if (isValidTimeRange(start, end)) return { start, end };
  return { start: end, end: start };
}
