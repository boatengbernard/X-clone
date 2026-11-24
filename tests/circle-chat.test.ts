import { describe, expect, it } from 'vitest';
import { canPost, canRead, chatList, chatMessages, dmId, tickFor, unreadIn, unreadTotal } from '../src/circles/chat.ts';
import { circleReducer } from '../src/circles/reducer.ts';
import { createSeedState } from '../src/data/seed.ts';
import type { AppState } from '../src/types.ts';

const prefs = { rhythm: 'morning', reminderTime: '07:30', nudge: 'two-days' } as const;
const signedIn = (id = 'u_abena'): AppState => ({ ...createSeedState(), currentUserId: id });
/** Abena joins the sample circle (Morning Light). */
const joined = () => {
  const s = signedIn();
  return circleReducer(s, { type: 'circleJoin', planId: 'john-21', prefs, today: s.circles[0].createdOn }, 'u_abena');
};
const last = (s: AppState, chatId: string) => chatMessages(s, chatId).at(-1)!;

describe('circle group chat', () => {
  it('lists your circle first and counts only messages since you joined as unread', () => {
    const s = joined();
    const list = chatList(s, 'u_abena');
    expect(list[0]).toMatchObject({ id: 'c_morning', kind: 'circle', past: false });
    // The sample messages are older than her joining day (4 days ago, start of day) except the newest few.
    expect(unreadIn(s, 'c_morning', 'u_abena')).toBeGreaterThanOrEqual(0);
    const read = circleReducer(s, { type: 'chatRead', chatId: 'c_morning', at: new Date(Date.now() + 1000).toISOString() }, 'u_abena');
    expect(unreadTotal(read, 'u_abena')).toBe(0);
  });

  it('sends replies, verses and mentions, and keeps only valid ones', () => {
    let s = joined();
    const first = chatMessages(s, 'c_morning')[0];
    s = circleReducer(s, { type: 'circleMessage', kind: 'note', text: '@Kofi thank you', replyToId: first.id, mentions: ['u_kofi', 'u_nobody', 'u_abena'] }, 'u_abena');
    expect(last(s, 'c_morning')).toMatchObject({ replyToId: first.id, mentions: ['u_kofi'], kind: 'note' });

    s = circleReducer(s, { type: 'circleMessage', kind: 'note', text: '', verse: { ref: 'John 3:16', text: 'For God so loved the world', bible: 'King James Version' } }, 'u_abena');
    expect(last(s, 'c_morning')).toMatchObject({ kind: 'verse', verse: { ref: 'John 3:16' } });

    s = circleReducer(s, { type: 'circleMessage', kind: 'share', text: 'Good one', day: 2 }, 'u_abena');
    expect(last(s, 'c_morning')).toMatchObject({ kind: 'share', day: 2 });

    const before = s;
    s = circleReducer(s, { type: 'circleMessage', kind: 'note', text: '   ' }, 'u_abena');
    expect(s).toBe(before);
    s = circleReducer(s, { type: 'circleMessage', kind: 'note', text: 'hi', replyToId: 'cm_missing' }, 'u_abena');
    expect(last(s, 'c_morning').replyToId).toBeUndefined();
  });

  it('toggles reactions, with Praying stored as prayers', () => {
    let s = joined();
    const id = chatMessages(s, 'c_morning')[0].id;
    s = circleReducer(s, { type: 'circleReact', messageId: id, reaction: 'amen' }, 'u_abena');
    s = circleReducer(s, { type: 'circleReact', messageId: id, reaction: 'pray' }, 'u_abena');
    let m = s.circleMessages.find((x) => x.id === id)!;
    expect(m.reactions?.amen).toContain('u_abena');
    expect(m.prayers).toContain('u_abena');
    s = circleReducer(s, { type: 'circleReact', messageId: id, reaction: 'amen' }, 'u_abena');
    m = s.circleMessages.find((x) => x.id === id)!;
    expect(m.reactions?.amen).not.toContain('u_abena');
  });

  it('keeps private chats between two circle members', () => {
    let s = joined();
    const id = dmId('u_abena', 'u_kofi');
    expect(canPost(s, id, 'u_abena')).toBe(true);
    s = circleReducer(s, { type: 'circleMessage', chatId: id, kind: 'note', text: 'Hi Kofi' }, 'u_abena');
    expect(last(s, id).text).toBe('Hi Kofi');
    expect(canRead(s, id, 'u_maria')).toBe(false);
    expect(chatList(s, 'u_kofi').some((c) => c.id === id && c.unread === 1)).toBe(true);

    // Nobody outside your circle can be messaged out of the blue.
    const stranger = Object.keys(s.users).find((u) => !s.circles[0].memberIds.includes(u))!;
    expect(canPost(s, dmId('u_abena', stranger), 'u_abena')).toBe(false);
    const t = circleReducer(s, { type: 'circleMessage', chatId: dmId('u_abena', stranger), kind: 'note', text: 'hey' }, 'u_abena');
    expect(t).toBe(s);
  });

  it('only accepts simulated replies from people in the chat', () => {
    const s = joined();
    const ok = circleReducer(s, { type: 'chatIncoming', chatId: 'c_morning', fromUserId: 'u_kofi', text: 'Amen!' }, 'u_abena');
    expect(last(ok, 'c_morning')).toMatchObject({ userId: 'u_kofi', text: 'Amen!' });
    const stranger = Object.keys(s.users).find((u) => !s.circles[0].memberIds.includes(u) && u !== 'u_abena')!;
    expect(circleReducer(s, { type: 'chatIncoming', chatId: 'c_morning', fromUserId: stranger, text: 'hi' }, 'u_abena')).toBe(s);
    expect(circleReducer(s, { type: 'chatIncoming', chatId: 'c_morning', fromUserId: 'u_abena', text: 'hi' }, 'u_abena')).toBe(s);
  });

  it('saves messages to the Journal and turns a left circle read-only', () => {
    let s = joined();
    const id = chatMessages(s, 'c_morning')[0].id;
    s = circleReducer(s, { type: 'saveMessage', messageId: id }, 'u_abena');
    expect(s.savedMessages?.u_abena?.map((x) => x.messageId)).toEqual([id]);
    s = circleReducer(s, { type: 'circleLeave' }, 'u_abena');
    expect(canRead(s, 'c_morning', 'u_abena')).toBe(true);
    expect(canPost(s, 'c_morning', 'u_abena')).toBe(false);
    expect(chatList(s, 'u_abena').find((c) => c.id === 'c_morning')?.past).toBe(true);
  });

  it('moves ticks from sent to delivered to seen', () => {
    const at = Date.parse('2026-11-24T10:00:00Z');
    const m = { createdAt: new Date(at).toISOString() } as Parameters<typeof tickFor>[0];
    expect(tickFor(m, at + 500)).toBe('sent');
    expect(tickFor(m, at + 2000)).toBe('delivered');
    expect(tickFor(m, at + 5000)).toBe('seen');
  });
});
