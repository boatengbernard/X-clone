import type { AppState } from '../types.ts';
import type { CircleMessage, Reaction } from './types.ts';

/**
 * Circle chats. Every circle has a group chat whose id is the circle's id. Members of a
 * circle can also talk one to one in a private chat whose id is built from both user ids.
 * Both kinds of message live in `circleMessages`, keyed by `circleId`.
 */

export const dmId = (a: string, b: string) => `dm:${[a, b].sort().join(':')}`;
export const isDm = (chatId: string) => chatId.startsWith('dm:');
export const dmUsers = (chatId: string) => (isDm(chatId) ? chatId.slice(3).split(':') : []);
export const dmOther = (chatId: string, meId: string) => dmUsers(chatId).find((id) => id !== meId) ?? '';

export const REACTIONS: { key: Reaction; emoji: string; label: string }[] = [
  { key: 'pray', emoji: '🙏', label: 'Praying' },
  { key: 'amen', emoji: '🙌', label: 'Amen' },
  { key: 'love', emoji: '❤️', label: 'Love' },
  { key: 'with', emoji: '😢', label: 'With you' },
  { key: 'peace', emoji: '🕊️', label: 'Peace' },
];

/** Who gave a message this reaction. Praying is the message's `prayers` list. */
export const reactors = (m: CircleMessage, key: Reaction): string[] => (key === 'pray' ? m.prayers : (m.reactions?.[key] ?? []));

/** The newest messages of one chat, oldest first. */
export function chatMessages(state: Pick<AppState, 'circleMessages'>, chatId: string, limit = 300): CircleMessage[] {
  return state.circleMessages
    .filter((m) => m.circleId === chatId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(-limit);
}

const activeCircleIds = (state: AppState, userId: string) =>
  new Set(state.memberships.filter((m) => m.userId === userId && m.active).map((m) => m.circleId));

/** True when two people are reading in the same circle right now. */
export const shareCircle = (state: AppState, a: string, b: string) => {
  const mine = activeCircleIds(state, a);
  return [...activeCircleIds(state, b)].some((id) => mine.has(id));
};

/** A member can read a group chat they belong to or once belonged to, and their own private chats. */
export function canRead(state: AppState, chatId: string, userId: string): boolean {
  if (isDm(chatId)) return dmUsers(chatId).includes(userId);
  return state.memberships.some((m) => m.userId === userId && m.circleId === chatId);
}

/**
 * Group chats take messages from current members only. A private chat can be started with
 * someone in your circle, and carries on after either of you moves to another circle.
 */
export function canPost(state: AppState, chatId: string, userId: string): boolean {
  if (isDm(chatId)) {
    const [a, b] = dmUsers(chatId);
    const other = a === userId ? b : a;
    if (!dmUsers(chatId).includes(userId) || other === userId || !state.users[other]) return false;
    return shareCircle(state, userId, other) || state.circleMessages.some((m) => m.circleId === chatId);
  }
  return state.memberships.some((m) => m.userId === userId && m.circleId === chatId && m.active);
}

/** Everyone in a chat: the circle's current members, or the two people in a private chat. */
export function chatMemberIds(state: AppState, chatId: string): string[] {
  if (isDm(chatId)) return dmUsers(chatId);
  return state.circles.find((c) => c.id === chatId)?.memberIds ?? [];
}

export interface ChatSummary {
  id: string;
  kind: 'circle' | 'dm';
  name: string;
  /** For a private chat, the other person. */
  otherId?: string;
  last?: CircleMessage;
  unread: number;
  /** A circle the member has left or moved on from: readable, no longer open for messages. */
  past: boolean;
}

/** Messages from others since the member last opened the chat. A new member starts from when they joined. */
export function unreadIn(state: AppState, chatId: string, userId: string): number {
  let since = state.chatReads?.[userId]?.[chatId];
  if (!since && !isDm(chatId)) {
    const m = state.memberships.find((x) => x.userId === userId && x.circleId === chatId && x.active);
    if (!m) return 0;
    since = `${m.joinedOn}T00:00:00`;
  }
  return state.circleMessages.filter((m) => m.circleId === chatId && m.userId !== userId && (!since || m.createdAt > since)).length;
}

/** The member's chats: their circle, then private chats and past circles, newest activity first. */
export function chatList(state: AppState, userId: string): ChatSummary[] {
  const lastOf = (id: string) => {
    let last: CircleMessage | undefined;
    for (const m of state.circleMessages) if (m.circleId === id && (!last || m.createdAt > last.createdAt)) last = m;
    return last;
  };
  const out: ChatSummary[] = [];
  const seenCircles = new Set<string>();
  for (const m of state.memberships) {
    if (m.userId !== userId || seenCircles.has(m.circleId)) continue;
    const circle = state.circles.find((c) => c.id === m.circleId);
    if (!circle) continue;
    seenCircles.add(circle.id);
    const active = state.memberships.some((x) => x.userId === userId && x.circleId === circle.id && x.active);
    out.push({ id: circle.id, kind: 'circle', name: circle.name, last: lastOf(circle.id), unread: active ? unreadIn(state, circle.id, userId) : 0, past: !active });
  }
  const dms = new Set(state.circleMessages.filter((m) => isDm(m.circleId) && dmUsers(m.circleId).includes(userId)).map((m) => m.circleId));
  for (const id of dms) {
    const otherId = dmOther(id, userId);
    const other = state.users[otherId];
    if (!other) continue;
    out.push({ id, kind: 'dm', name: other.name, otherId, last: lastOf(id), unread: unreadIn(state, id, userId), past: false });
  }
  const at = (c: ChatSummary) => c.last?.createdAt ?? '';
  return out.sort((a, b) => Number(a.past) - Number(b.past) || Number(b.kind === 'circle' && !b.past) - Number(a.kind === 'circle' && !a.past) || at(b).localeCompare(at(a)));
}

export const unreadTotal = (state: AppState, userId: string) => chatList(state, userId).reduce((n, c) => n + c.unread, 0);

export type Tick = 'sent' | 'delivered' | 'seen';

/**
 * Delivery state of your own message. Selah keeps everything on this device, so the other
 * members' phones are simulated: a message is delivered after a moment and seen soon after.
 */
export function tickFor(m: CircleMessage, now = Date.now()): Tick {
  const age = now - new Date(m.createdAt).getTime();
  return age < 1500 ? 'sent' : age < 4000 ? 'delivered' : 'seen';
}

/** A short line for the chat list: "Kofi: Day 5 done". */
export function previewText(m: CircleMessage): string {
  if (m.kind === 'verse' && m.verse) return `${m.verse.ref}${m.text ? ` · ${m.text}` : ''}`;
  if (m.kind === 'prayer') return `Prayer request: ${m.text}`;
  if (m.kind === 'share' && m.day) return `Day ${m.day}: ${m.text}`;
  return m.text;
}
