import { daysBetween, type DateStr } from './dates.ts';
import type { Circle, User } from './types.ts';

export const CIRCLE_SIZE = 8;
/** A circle keeps taking new members for its first week, so everyone stays close in the plan. */
export const JOIN_WINDOW_DAYS = 7;

export const CIRCLE_NAMES = [
  'Morning Light', 'Still Waters', 'Mustard Seed', 'Living Water', 'Green Pastures', 'Daily Bread',
  'New Mercies', 'Cornerstone', 'Lamp Unto My Feet', 'Olive Branch', 'Quiet Streams', 'Firm Foundation',
];

/** The fullest open circle on this plan that started within the last week. */
export function findOpenCircle(circles: Circle[], planId: string, today: DateStr): Circle | undefined {
  return circles
    .filter((c) => c.planId === planId && c.memberIds.length < CIRCLE_SIZE && daysBetween(c.createdOn, today) <= JOIN_WINDOW_DAYS && daysBetween(c.createdOn, today) >= 0)
    .sort((a, b) => b.memberIds.length - a.memberIds.length)[0];
}

/** A name not used by another circle on the same plan, falling back to a numbered one. */
export function pickName(circles: Circle[], planId: string, preferred?: string): string {
  const taken = new Set(circles.filter((c) => c.planId === planId).map((c) => c.name));
  if (preferred && !taken.has(preferred)) return preferred;
  const free = CIRCLE_NAMES.find((n) => !taken.has(n));
  if (free) return free;
  let i = 2;
  while (taken.has(`${CIRCLE_NAMES[0]} ${i}`)) i++;
  return `${CIRCLE_NAMES[0]} ${i}`;
}

/** Prefer someone who has finished a plan and offered to guide; otherwise the longest-standing member. */
export function chooseGuide(memberIds: string[], users: Map<string, User>): string | undefined {
  return memberIds.find((id) => users.get(id)?.canGuide) ?? memberIds[0];
}
