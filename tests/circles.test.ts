import { describe, expect, it } from 'vitest';
import { addDays, weekStart } from '../src/circles/dates.ts';
import { chooseGuide, findOpenCircle, pickName } from '../src/circles/matching.ts';
import { dayStates, finishSummary, graceLeft, needsCheckIn, nextDay, quietDays, rhythm, weekView } from '../src/circles/progress.ts';
import { mentionsCrisis, suggestsCircles } from '../src/circles/safety.ts';
import type { Circle, Membership, User } from '../src/circles/types.ts';

// 2026-11-16 is a Monday.
const MON = '2026-11-16';
const member = (over: Partial<Membership> = {}): Membership => ({
  id: 'm', userId: 'u', circleId: 'c', planId: 'john-21', joinedOn: MON, rhythm: 'morning', reminderTime: '07:30', nudge: 'two-days', reads: [], active: true, ...over,
});

describe('dates', () => {
  it('finds the Monday of a week', () => {
    expect(weekStart('2026-11-22')).toBe(MON);
    expect(weekStart(MON)).toBe(MON);
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });
});

describe('progress', () => {
  it('picks up at the first unread day, never resetting', () => {
    expect(nextDay([{ day: 1, date: MON }, { day: 2, date: MON }], 21)).toBe(3);
    expect(nextDay([{ day: 2, date: MON }], 21)).toBe(1);
    expect(nextDay(Array.from({ length: 3 }, (_, i) => ({ day: i + 1, date: MON })), 3)).toBeNull();
  });

  it('covers two missed days a week with grace, then marks the rest missed', () => {
    const m = member({ reads: [{ day: 1, date: MON }] });
    const s = dayStates(m, '2026-11-21'); // Saturday
    expect([...s.values()]).toEqual(['read', 'grace', 'grace', 'missed', 'missed', 'today']);
    expect(graceLeft(m, '2026-11-21')).toBe(0);
  });

  it('gives fresh grace days each Monday', () => {
    const m = member({ joinedOn: '2026-11-20', reads: [{ day: 1, date: '2026-11-20' }] });
    // Sat + Sun use last week's grace; Mon is next week's first grace day.
    const s = dayStates(m, '2026-11-24');
    expect(s.get('2026-11-23')).toBe('grace');
    expect(graceLeft(m, '2026-11-24')).toBe(1);
  });

  it('does not count the joining day as missed', () => {
    expect(dayStates(member(), addDays(MON, 1)).get(MON)).toBe('before');
  });

  it('builds a Monday-to-Sunday week strip', () => {
    const w = weekView(member({ reads: [{ day: 1, date: MON }] }), '2026-11-18');
    expect(w.map((d) => d.state)).toEqual(['read', 'grace', 'today', 'future', 'future', 'future', 'future']);
    expect(w.map((d) => d.letter).join('')).toBe('MTWTFSS');
  });

  it('counts rhythm through grace days', () => {
    const m = member({ reads: [{ day: 1, date: MON }, { day: 2, date: '2026-11-18' }] });
    expect(rhythm(m, '2026-11-18')).toBe(3);
  });

  it('asks the guide to check in after two quiet days, only if the member opted in', () => {
    const m = member({ reads: [{ day: 1, date: MON }] });
    expect(quietDays(m, '2026-11-18')).toBe(1);
    expect(needsCheckIn(m, '2026-11-18')).toBe(false);
    expect(needsCheckIn(m, '2026-11-19')).toBe(true);
    expect(needsCheckIn({ ...m, nudge: 'ask' }, '2026-11-19')).toBe(false);
    expect(needsCheckIn({ ...m, finishedOn: '2026-11-17' }, '2026-11-19')).toBe(false);
  });

  it('summarises a finished plan', () => {
    const m = member({ reads: [{ day: 1, date: MON }, { day: 2, date: '2026-11-18' }, { day: 3, date: '2026-11-18' }], finishedOn: '2026-11-18' });
    expect(finishSummary(m)).toEqual({ days: 3, readDays: 2, graceDays: 1 });
  });
});

describe('matching', () => {
  const circle = (id: string, over: Partial<Circle> = {}): Circle => ({ id, name: id, planId: 'john-21', createdOn: MON, guideId: 'a', memberIds: ['a'], next: {}, ...over });

  it('fills the fullest open circle on the same plan', () => {
    const cs = [circle('small'), circle('big', { memberIds: ['a', 'b', 'c'] }), circle('other', { planId: 'romans-16', memberIds: ['a', 'b', 'c', 'd'] })];
    expect(findOpenCircle(cs, 'john-21', MON)?.id).toBe('big');
  });

  it('skips full circles and ones older than a week', () => {
    const cs = [circle('full', { memberIds: 'abcdefgh'.split('') }), circle('old', { createdOn: addDays(MON, -8) })];
    expect(findOpenCircle(cs, 'john-21', MON)).toBeUndefined();
  });

  it('names circles without clashing', () => {
    expect(pickName([circle('x', { name: 'Morning Light' })], 'john-21')).toBe('Still Waters');
    expect(pickName([], 'john-21', 'Mustard Seed')).toBe('Mustard Seed');
  });

  it('prefers a member who offered to guide', () => {
    const users = new Map<string, User>([['a', { canGuide: false } as User], ['b', { canGuide: true } as User]]);
    expect(chooseGuide(['a', 'b'], users)).toBe('b');
    expect(chooseGuide(['a'], users)).toBe('a');
  });
});

describe('safety', () => {
  it('spots self-harm language', () => {
    expect(mentionsCrisis('Some days I want to die')).toBe(true);
    expect(mentionsCrisis('I keep thinking about suicide')).toBe(true);
    expect(mentionsCrisis('Dying to self daily, as Paul says')).toBe(false);
  });

  it('suggests circles for posts about struggling with Scripture', () => {
    expect(suggestsCircles('I keep quitting my Bible reading plan')).toBe(true);
    expect(suggestsCircles('Great game last night')).toBe(false);
  });
});
