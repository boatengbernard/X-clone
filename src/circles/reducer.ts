import type { AppState, User } from '../types.ts';
import type { DateStr } from './dates.ts';
import { chooseGuide, findOpenCircle, pickName } from './matching.ts';
import { planById } from './plans.ts';
import { nextDay } from './progress.ts';
import { mentionsCrisis } from './safety.ts';
import type { Circle, CirclePrefs, CircleView, Membership, MessageKind } from './types.ts';

export const MAX_MESSAGE = 600;

export type CircleAction =
  | { type: 'circleJoin'; planId: string; prefs: CirclePrefs; today: DateStr }
  | { type: 'circleSettings'; prefs: CirclePrefs }
  | { type: 'circleRead'; day: number; today: DateStr; share: string }
  | { type: 'circleMessage'; kind: MessageKind; text: string }
  | { type: 'circlePray' | 'circleReport'; messageId: string }
  | { type: 'circleLeave' }
  | { type: 'circleNext'; planId: string; today: DateStr }
  | { type: 'becomeGuide' };

const CIRCLE_ACTIONS = new Set<string>(['circleJoin', 'circleSettings', 'circleRead', 'circleMessage', 'circlePray', 'circleReport', 'circleLeave', 'circleNext', 'becomeGuide']);
export const isCircleAction = (a: { type: string }): a is CircleAction => CIRCLE_ACTIONS.has(a.type);

const uid = (prefix: string) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export const activeMembership = (state: Pick<AppState, 'memberships'>, userId: string) =>
  state.memberships.find((m) => m.userId === userId && m.active) ?? null;

/** The signed-in member's circle, its active members and its newest messages. */
export function circleViewFor(state: AppState, userId: string): CircleView | null {
  const m = activeMembership(state, userId);
  const circle = m && state.circles.find((c) => c.id === m.circleId);
  if (!circle) return null;
  return {
    circle,
    members: circle.memberIds.flatMap((id) => {
      const user = state.users[id];
      const membership = state.memberships.find((x) => x.userId === id && x.circleId === circle.id && x.active);
      return user && membership ? [{ user, membership }] : [];
    }),
    messages: state.circleMessages
      .filter((x) => x.circleId === circle.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 200),
  };
}

/**
 * Applies a Reading Circles action for the signed-in member. Works on copies of the
 * circle data so the store stays immutable. Invalid actions leave state unchanged.
 */
export function circleReducer(state: AppState, action: CircleAction, meId: string): AppState {
  const circles: Circle[] = structuredClone(state.circles);
  const memberships: Membership[] = structuredClone(state.memberships);
  const circleMessages = structuredClone(state.circleMessages);
  const users: Record<string, User> = { ...state.users, [meId]: { ...state.users[meId] } };
  const me = users[meId];
  const userMap = new Map(Object.entries(users));
  const done = (): AppState => ({ ...state, users, circles, memberships, circleMessages });

  const mine = () => memberships.find((m) => m.userId === meId && m.active);

  function join(circle: Circle, prefs: CirclePrefs, today: DateStr) {
    memberships.push({ id: uid('m'), userId: meId, circleId: circle.id, planId: circle.planId, joinedOn: today, reads: [], active: true, ...prefs });
    circle.memberIds.push(meId);
    if (me.canGuide && !users[circle.guideId]?.canGuide) circle.guideId = meId;
  }

  function leave() {
    const m = mine();
    if (!m) return;
    m.active = false;
    const circle = circles.find((c) => c.id === m.circleId);
    if (!circle) return;
    circle.memberIds = circle.memberIds.filter((id) => id !== meId);
    if (circle.guideId === meId) circle.guideId = chooseGuide(circle.memberIds, userMap) ?? '';
  }

  if (action.type === 'becomeGuide') {
    if (!me.finishedPlans?.length) return state;
    me.canGuide = true;
    return done();
  }

  if (action.type === 'circleJoin') {
    const plan = planById(action.planId);
    if (!plan || mine()) return state;
    let circle = findOpenCircle(circles, plan.id, action.today);
    if (!circle) {
      circle = { id: uid('c'), name: pickName(circles, plan.id), planId: plan.id, createdOn: action.today, guideId: meId, memberIds: [], next: {} };
      circles.push(circle);
    }
    join(circle, action.prefs, action.today);
    return done();
  }

  const m = mine();
  const circle = m && circles.find((c) => c.id === m.circleId);
  if (!m || !circle) return state;

  switch (action.type) {
    case 'circleSettings':
      Object.assign(m, action.prefs);
      return done();

    case 'circleRead': {
      const plan = planById(m.planId);
      if (!plan || !Number.isInteger(action.day) || action.day < 1 || action.day > plan.days.length) return state;
      if (!m.reads.some((r) => r.day === action.day)) m.reads.push({ day: action.day, date: action.today });
      const share = action.share.trim().slice(0, MAX_MESSAGE);
      if (share) {
        circleMessages.push({
          id: uid('cm'), circleId: circle.id, userId: meId, kind: 'share', day: action.day, text: share,
          createdAt: new Date().toISOString(), prayers: [], flagged: mentionsCrisis(share), reports: [],
        });
      }
      if (!m.finishedOn && nextDay(m.reads, plan.days.length) === null) {
        m.finishedOn = action.today;
        me.finishedPlans = [...new Set([...(me.finishedPlans ?? []), plan.id])];
      }
      return done();
    }

    case 'circleMessage': {
      const text = action.text.trim().slice(0, MAX_MESSAGE);
      if (!text) return state;
      circleMessages.push({
        id: uid('cm'), circleId: circle.id, userId: meId, kind: action.kind, text,
        createdAt: new Date().toISOString(), prayers: [], flagged: mentionsCrisis(text), reports: [],
      });
      return done();
    }

    case 'circlePray':
    case 'circleReport': {
      const msg = circleMessages.find((x) => x.id === action.messageId && x.circleId === circle.id);
      if (!msg) return state;
      if (action.type === 'circleReport') {
        if (!msg.reports.includes(meId)) msg.reports.push(meId);
      } else msg.prayers = msg.prayers.includes(meId) ? msg.prayers.filter((id) => id !== meId) : [...msg.prayers, meId];
      return done();
    }

    case 'circleLeave':
      leave();
      return done();

    case 'circleNext': {
      const plan = planById(action.planId);
      if (!plan || !m.finishedOn) return state;
      const prefs: CirclePrefs = { rhythm: m.rhythm, reminderTime: m.reminderTime, nudge: m.nudge };
      let next = circle.next[plan.id] ? circles.find((c) => c.id === circle.next[plan.id]) : undefined;
      if (!next) {
        next = { id: uid('c'), name: pickName(circles, plan.id, circle.name), planId: plan.id, createdOn: action.today, guideId: meId, memberIds: [], next: {} };
        circles.push(next);
        circle.next[plan.id] = next.id;
      }
      leave();
      join(next, prefs, action.today);
      return done();
    }
  }
}
