import type { AppState, User } from '../types.ts';
import type { DateStr } from './dates.ts';
import { chooseGuide, findOpenCircle, pickName } from './matching.ts';
import { planById } from './plans.ts';
import { nextDay } from './progress.ts';
import { mentionsCrisis } from './safety.ts';
import { canPost, canRead, chatMemberIds, isDm } from './chat.ts';
import type { Circle, CircleMessage, CirclePrefs, CircleView, Membership, MessageKind, Reaction, SharedVerse } from './types.ts';

export const MAX_MESSAGE = 600;

export type CircleAction =
  | { type: 'circleJoin'; planId: string; prefs: CirclePrefs; today: DateStr }
  | { type: 'circleSettings'; prefs: CirclePrefs }
  | { type: 'circleRead'; day: number; today: DateStr; share: string }
  | {
      type: 'circleMessage';
      kind: MessageKind;
      text: string;
      /** Defaults to the member's circle. */
      chatId?: string;
      replyToId?: string;
      verse?: SharedVerse;
      mentions?: string[];
      /** Reading day a "share" message is about. */
      day?: number;
    }
  | { type: 'circlePray'; messageId: string }
  | { type: 'circleReport'; messageId: string }
  | { type: 'saveMessage'; messageId: string }
  | { type: 'circleReact'; messageId: string; reaction: Reaction }
  | { type: 'chatRead'; chatId: string; at: string }
  /** A reply from another member's (simulated) phone. */
  | { type: 'chatIncoming'; chatId: string; fromUserId: string; text: string; replyToId?: string }
  | { type: 'circleLeave' }
  | { type: 'circleNext'; planId: string; today: DateStr }
  | { type: 'becomeGuide' };

const CIRCLE_ACTIONS = new Set<string>([
  'circleJoin', 'circleSettings', 'circleRead', 'circleMessage', 'circlePray', 'circleReport', 'circleLeave', 'circleNext', 'becomeGuide',
  'circleReact', 'saveMessage', 'chatRead', 'chatIncoming',
]);
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
  const toggle = (list: string[]) => (list.includes(meId) ? list.filter((id) => id !== meId) : [...list, meId]);
  const newMessage = (chatId: string, userId: string, kind: MessageKind, text: string, extra: Partial<CircleMessage> = {}): CircleMessage => ({
    id: uid('cm'), circleId: chatId, userId, kind, text, createdAt: new Date().toISOString(), prayers: [], flagged: mentionsCrisis(text), reports: [], ...extra,
  });

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

  // Chat actions work in any chat the member can see, including private chats and past circles.
  if (action.type === 'chatRead') {
    if (!canRead(state, action.chatId, meId)) return state;
    return { ...state, chatReads: { ...state.chatReads, [meId]: { ...state.chatReads?.[meId], [action.chatId]: action.at } } };
  }
  if (action.type === 'saveMessage') {
    const msg = state.circleMessages.find((x) => x.id === action.messageId);
    if (!msg || !canRead(state, msg.circleId, meId)) return state;
    const saved = state.savedMessages?.[meId] ?? [];
    const next = saved.some((x) => x.messageId === msg.id) ? saved.filter((x) => x.messageId !== msg.id) : [...saved, { messageId: msg.id, savedAt: new Date().toISOString() }];
    return { ...state, savedMessages: { ...state.savedMessages, [meId]: next } };
  }
  if (action.type === 'circlePray' || action.type === 'circleReport' || action.type === 'circleReact') {
    const msg = circleMessages.find((x) => x.id === action.messageId);
    if (!msg || !canRead(state, msg.circleId, meId)) return state;
    if (action.type === 'circleReport') {
      if (msg.userId === meId) return state;
      if (!msg.reports.includes(meId)) msg.reports.push(meId);
    } else if (action.type === 'circlePray') msg.prayers = toggle(msg.prayers);
    else if (action.reaction === 'pray') msg.prayers = toggle(msg.prayers);
    else if (['amen', 'love', 'with', 'peace'].includes(action.reaction)) {
      const key = action.reaction as Exclude<Reaction, 'pray'>;
      msg.reactions = { ...msg.reactions, [key]: toggle(msg.reactions?.[key] ?? []) };
    } else return state;
    return done();
  }
  if (action.type === 'chatIncoming') {
    const text = action.text.trim().slice(0, MAX_MESSAGE);
    if (!text || action.fromUserId === meId || !users[action.fromUserId] || !chatMemberIds(state, action.chatId).includes(action.fromUserId) || !canRead(state, action.chatId, meId))
      return state;
    const replyToId = circleMessages.some((x) => x.id === action.replyToId && x.circleId === action.chatId) ? action.replyToId : undefined;
    circleMessages.push(newMessage(action.chatId, action.fromUserId, 'note', text, replyToId ? { replyToId } : {}));
    return done();
  }
  if (action.type === 'circleMessage' && action.chatId && isDm(action.chatId)) {
    if (!canPost(state, action.chatId, meId)) return state;
    const msg = composeMessage(action.chatId);
    if (!msg) return state;
    circleMessages.push(msg);
    return done();
  }

  /** Builds a message from a circleMessage action, or null when it has nothing to send. */
  function composeMessage(chatId: string): CircleMessage | null {
    if (action.type !== 'circleMessage') return null;
    const text = action.text.trim().slice(0, MAX_MESSAGE);
    const verse = action.verse && action.verse.ref && action.verse.text
      ? { ref: action.verse.ref.slice(0, 80), text: action.verse.text.slice(0, 2000), bible: (action.verse.bible || '').slice(0, 80) }
      : undefined;
    if (!text && !verse) return null;
    const day = action.kind === 'share' && Number.isInteger(action.day) && action.day! > 0 && action.day! <= 400 ? action.day : undefined;
    const kind: MessageKind = verse ? 'verse' : action.kind === 'verse' || (action.kind === 'share' && !day) ? 'note' : action.kind;
    const extra: Partial<CircleMessage> = {};
    if (kind === 'share') extra.day = day;
    if (verse) extra.verse = verse;
    if (action.replyToId && circleMessages.some((x) => x.id === action.replyToId && x.circleId === chatId)) extra.replyToId = action.replyToId;
    const members = chatMemberIds(state, chatId);
    const mentions = [...new Set(action.mentions ?? [])].filter((id) => id !== meId && members.includes(id));
    if (mentions.length) extra.mentions = mentions;
    return newMessage(chatId, meId, kind, text, extra);
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
        circleMessages.push(newMessage(circle.id, meId, 'share', share, { day: action.day }));
      }
      if (!m.finishedOn && nextDay(m.reads, plan.days.length) === null) {
        m.finishedOn = action.today;
        me.finishedPlans = [...new Set([...(me.finishedPlans ?? []), plan.id])];
      }
      return done();
    }

    case 'circleMessage': {
      if (action.chatId && action.chatId !== circle.id) return state;
      const msg = composeMessage(circle.id);
      if (!msg) return state;
      circleMessages.push(msg);
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
