import { describe, expect, it } from 'vitest';
import { createSeedState } from '../src/data/seed.ts';
import { reducer } from '../src/store.tsx';
import type { AppState } from '../src/types.ts';
import { wrapLines } from '../src/verseCard.ts';

const signedIn = (id = 'u_abena'): AppState => ({ ...createSeedState(), currentUserId: id });
const firstPostBy = (s: AppState, notBy: string) => Object.values(s.posts).find((p) => p.authorId !== notBy && !p.replyToId)!;

describe('Journal', () => {
  it('keeps a post with a private note and edits it without losing the save date', () => {
    let s = signedIn();
    const post = firstPostBy(s, 'u_abena');
    s = reducer(s, { type: 'keep', postId: post.id, note: '  Needed this today  ' });
    expect(s.bookmarks.u_abena).toContain(post.id);
    const saved = s.journal!.u_abena[post.id];
    expect(saved.note).toBe('Needed this today');

    s = reducer(s, { type: 'keep', postId: post.id, note: 'Read again Friday' });
    expect(s.journal!.u_abena[post.id]).toEqual({ note: 'Read again Friday', savedAt: saved.savedAt });
    expect(s.bookmarks.u_abena.filter((id) => id === post.id)).toHaveLength(1);
  });

  it('removes the post and its note together', () => {
    let s = signedIn();
    const post = firstPostBy(s, 'u_abena');
    s = reducer(s, { type: 'keep', postId: post.id, note: 'x' });
    s = reducer(s, { type: 'unkeep', postId: post.id });
    expect(s.bookmarks.u_abena).not.toContain(post.id);
    expect(s.journal!.u_abena[post.id]).toBeUndefined();
  });

  it('works on data saved before journals existed', () => {
    const s = signedIn();
    delete s.journal;
    const post = firstPostBy(s, 'u_abena');
    expect(reducer(s, { type: 'keep', postId: post.id, note: '' }).journal!.u_abena[post.id].note).toBe('');
  });
});

describe('Pass it on', () => {
  it('notifies each member once and never the sender', () => {
    const s = signedIn();
    const post = firstPostBy(s, 'u_abena');
    const before = s.notifications.length;
    const t = reducer(s, { type: 'send', postId: post.id, toUserIds: ['u_kofi', 'u_kofi', 'u_abena'] });
    const sent = t.notifications.slice(0, t.notifications.length - before);
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ kind: 'sent', actorId: 'u_abena', targetUserId: 'u_kofi', postId: post.id });
  });
});

describe('Scripture card text', () => {
  const measure = (s: string) => s.length * 10;
  it('wraps words to the width', () => {
    expect(wrapLines(measure, 'Fear not for I am with thee', 120, 5)).toEqual(['Fear not for', 'I am with', 'thee']);
  });
  it('ends with an ellipsis when it runs out of lines', () => {
    const lines = wrapLines(measure, 'one two three four five six seven eight', 100, 2);
    expect(lines).toHaveLength(2);
    expect(lines[1].endsWith('…')).toBe(true);
    expect(measure(lines[1])).toBeLessThanOrEqual(100);
  });
});
