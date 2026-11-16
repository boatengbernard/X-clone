import { describe, expect, it } from 'vitest';
import { circleReducer, circleViewFor } from '../src/circles/reducer.ts';
import { createSeedState } from '../src/data/seed.ts';
import type { AppState } from '../src/types.ts';

const TODAY = '2026-11-16';
const prefs = { rhythm: 'morning', reminderTime: '07:30', nudge: 'two-days' } as const;
const signedIn = (id = 'u_abena'): AppState => ({ ...createSeedState(), currentUserId: id });

describe('Reading Circles in the store', () => {
  it('seeds a sample circle without the demo account in it', () => {
    const s = signedIn();
    expect(circleViewFor(s, 'u_abena')).toBeNull();
    expect(circleViewFor(s, 'u_kofi')?.circle.name).toBe('Morning Light');
  });

  it('joins the open circle on the same plan, or starts a new one', () => {
    let s = signedIn();
    // The sample circle started 4 days ago, so a John reader joins it.
    s = circleReducer(s, { type: 'circleJoin', planId: 'john-21', prefs, today: s.circles[0].createdOn }, 'u_abena');
    expect(circleViewFor(s, 'u_abena')?.circle.id).toBe('c_morning');

    const t = circleReducer(signedIn(), { type: 'circleJoin', planId: 'romans-16', prefs, today: TODAY }, 'u_abena');
    const v = circleViewFor(t, 'u_abena')!;
    expect(v.circle.id).not.toBe('c_morning');
    expect(v.circle.guideId).toBe('u_abena');
  });

  it('refuses a second circle while one is active', () => {
    const s = circleReducer(signedIn(), { type: 'circleJoin', planId: 'romans-16', prefs, today: TODAY }, 'u_abena');
    expect(circleReducer(s, { type: 'circleJoin', planId: 'verse-14', prefs, today: TODAY }, 'u_abena')).toBe(s);
  });

  it('records reads, keeps shares private to the circle and flags crisis words', () => {
    let s = circleReducer(signedIn(), { type: 'circleJoin', planId: 'verse-14', prefs, today: TODAY }, 'u_abena');
    const before = Object.keys(s.posts).length;
    s = circleReducer(s, { type: 'circleRead', day: 1, today: TODAY, share: 'I want to die some days' }, 'u_abena');
    const v = circleViewFor(s, 'u_abena')!;
    expect(v.members[0].membership.reads).toEqual([{ day: 1, date: TODAY }]);
    expect(v.messages[0].flagged).toBe(true);
    expect(Object.keys(s.posts).length).toBe(before);
  });

  it('marks the plan finished, then lets the reader guide and continue', () => {
    let s = circleReducer(signedIn(), { type: 'circleJoin', planId: 'verse-14', prefs, today: TODAY }, 'u_abena');
    for (let d = 1; d <= 14; d++) s = circleReducer(s, { type: 'circleRead', day: d, today: TODAY, share: '' }, 'u_abena');
    expect(circleViewFor(s, 'u_abena')!.members[0].membership.finishedOn).toBe(TODAY);
    expect(s.users.u_abena.finishedPlans).toEqual(['verse-14']);

    s = circleReducer(s, { type: 'becomeGuide' }, 'u_abena');
    expect(s.users.u_abena.canGuide).toBe(true);

    const name = circleViewFor(s, 'u_abena')!.circle.name;
    s = circleReducer(s, { type: 'circleNext', planId: 'psalms-30', today: TODAY }, 'u_abena');
    const next = circleViewFor(s, 'u_abena')!;
    expect(next.circle.planId).toBe('psalms-30');
    expect(next.circle.name).toBe(name);
  });

  it('passes the guide role on when the guide leaves', () => {
    let s = signedIn('u_kofi');
    s = circleReducer(s, { type: 'circleLeave' }, 'u_kofi');
    const v = circleViewFor(s, 'u_maria')!;
    expect(v.circle.memberIds).not.toContain('u_kofi');
    expect(v.circle.guideId).toBe('u_maria');
    expect(circleViewFor(s, 'u_kofi')).toBeNull();
  });

  it('does not change the original state', () => {
    const s = signedIn();
    const copy = structuredClone(s);
    circleReducer(s, { type: 'circleJoin', planId: 'john-21', prefs, today: TODAY }, 'u_abena');
    expect(s).toEqual(copy);
  });
});
