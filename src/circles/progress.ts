import { addDays, daysBetween, weekdayLetter, weekStart, type DateStr } from './dates.ts';
import type { Membership, ReadingLog } from './types.ts';

/** Missed days in a Monday–Sunday week that are covered without breaking your rhythm. */
export const GRACE_PER_WEEK = 2;
/** After this many quiet days, the circle guide is asked to reach out. */
export const QUIET_DAYS = 2;

export type DayState = 'read' | 'grace' | 'missed' | 'today' | 'future' | 'before';

/** The first day of the plan not yet read, or null when the plan is finished. */
export function nextDay(reads: ReadingLog[], totalDays: number): number | null {
  const done = new Set(reads.map((r) => r.day));
  for (let d = 1; d <= totalDays; d++) if (!done.has(d)) return d;
  return null;
}

export const readOn = (reads: ReadingLog[], date: DateStr) => reads.some((r) => r.date === date);

/**
 * How each calendar day since joining went. Your joining day only counts if you read.
 * A day with no reading uses a grace day while the week has one left, otherwise it is
 * "missed". Neither one resets progress: readers always pick up at their next day.
 */
export function dayStates(m: Pick<Membership, 'joinedOn' | 'reads' | 'finishedOn'>, today: DateStr): Map<DateStr, DayState> {
  const states = new Map<DateStr, DayState>();
  const end = m.finishedOn && m.finishedOn < today ? m.finishedOn : today;
  const graceUsed = new Map<DateStr, number>();
  for (let d = m.joinedOn; d <= end; d = addDays(d, 1)) {
    if (readOn(m.reads, d)) states.set(d, 'read');
    else if (d === today) states.set(d, 'today');
    else if (d === m.joinedOn) states.set(d, 'before');
    else {
      const wk = weekStart(d);
      const used = graceUsed.get(wk) ?? 0;
      if (used < GRACE_PER_WEEK) {
        graceUsed.set(wk, used + 1);
        states.set(d, 'grace');
      } else states.set(d, 'missed');
    }
  }
  return states;
}

export interface WeekDay {
  date: DateStr;
  letter: string;
  state: DayState;
}

/** Monday to Sunday of the current week, for the week strip. */
export function weekView(m: Pick<Membership, 'joinedOn' | 'reads' | 'finishedOn'>, today: DateStr): WeekDay[] {
  const states = dayStates(m, today);
  const mon = weekStart(today);
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(mon, i);
    const state: DayState = date > today ? 'future' : states.get(date) ?? 'before';
    return { date, letter: weekdayLetter(date), state };
  });
}

export function graceLeft(m: Pick<Membership, 'joinedOn' | 'reads' | 'finishedOn'>, today: DateStr): number {
  const mon = weekStart(today);
  let used = 0;
  for (const [d, s] of dayStates(m, today)) if (d >= mon && s === 'grace') used++;
  return Math.max(0, GRACE_PER_WEEK - used);
}

/** Consecutive days before today with no reading, back to the day after joining. */
export function quietDays(m: Pick<Membership, 'joinedOn' | 'reads'>, today: DateStr): number {
  let n = 0;
  for (let d = addDays(today, -1); d > m.joinedOn && !readOn(m.reads, d); d = addDays(d, -1)) n++;
  return n;
}

export const lastReadDate = (reads: ReadingLog[]) => reads.reduce<DateStr | null>((a, r) => (a && a > r.date ? a : r.date), null);

/** The member's guide should reach out: they asked to be noticed and have gone quiet. */
export function needsCheckIn(m: Membership, today: DateStr): boolean {
  if (!m.active || m.finishedOn || m.nudge !== 'two-days' || readOn(m.reads, today)) return false;
  return quietDays(m, today) >= QUIET_DAYS;
}

/** Days in a row that were read or covered by grace, ending today (if read) or yesterday. */
export function rhythm(m: Pick<Membership, 'joinedOn' | 'reads' | 'finishedOn'>, today: DateStr): number {
  const states = dayStates(m, today);
  let n = 0;
  let d = states.get(today) === 'read' ? today : addDays(today, -1);
  while (states.get(d) === 'read' || states.get(d) === 'grace') {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

export interface FinishSummary {
  days: number;
  readDays: number;
  graceDays: number;
}

export function finishSummary(m: Membership): FinishSummary {
  const end = m.finishedOn ?? m.joinedOn;
  const states = dayStates(m, end);
  let graceDays = 0;
  for (const s of states.values()) if (s === 'grace') graceDays++;
  return { days: daysBetween(m.joinedOn, end) + 1, readDays: new Set(m.reads.map((r) => r.date)).size, graceDays };
}
