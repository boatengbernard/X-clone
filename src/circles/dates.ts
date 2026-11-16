/** A calendar day in the reader's own timezone, as YYYY-MM-DD. */
export type DateStr = string;

const pad = (n: number) => String(n).padStart(2, '0');

export const localDate = (d = new Date()): DateStr => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const parse = (s: DateStr) => new Date(`${s}T00:00:00Z`);

export function addDays(s: DateStr, n: number): DateStr {
  const d = parse(s);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Whole days from a to b (positive when b is later). */
export const daysBetween = (a: DateStr, b: DateStr) => Math.round((parse(b).getTime() - parse(a).getTime()) / 86_400_000);

/** The Monday of the week that contains s. */
export function weekStart(s: DateStr): DateStr {
  const dow = (parse(s).getUTCDay() + 6) % 7;
  return addDays(s, -dow);
}

export const weekdayLetter = (s: DateStr) => 'SMTWTFS'[parse(s).getUTCDay()];

export const isDateStr = (s: unknown): s is DateStr => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(parse(s).getTime());
