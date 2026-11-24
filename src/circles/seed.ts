import { addDays, localDate } from './dates.ts';
import type { Circle, CircleData, CircleMessage, Membership } from './types.ts';

/**
 * One sample circle, "Morning Light", made of the sample members so a fresh install
 * shows Reading Circles working. Dates are relative to today. The demo account
 * (Abena) is not in it, so she sees the join flow.
 */
export function sampleCircles(today = localDate(), now = new Date()): CircleData {
  const ago = (mins: number) => new Date(now.getTime() - mins * 60_000).toISOString();
  const d = (n: number) => addDays(today, -n);

  const circle: Circle = {
    id: 'c_morning', name: 'Morning Light', planId: 'john-21', createdOn: d(4), guideId: 'u_kofi',
    memberIds: ['u_kofi', 'u_maria', 'u_daniel', 'u_grace', 'u_sam'], next: {},
  };
  const reads = (...daysAgo: number[]) => daysAgo.map((n, i) => ({ day: i + 1, date: d(n) }));
  const member = (userId: string, r: Membership['reads'], nudge: Membership['nudge'] = 'two-days'): Membership => ({
    id: `m_${userId}`, userId, circleId: circle.id, planId: 'john-21', joinedOn: d(4), rhythm: 'morning', reminderTime: '07:30', nudge, reads: r, active: true,
  });
  const memberships = [
    member('u_kofi', reads(4, 3, 2, 1, 0)),
    member('u_maria', reads(3, 2, 1, 0)),
    member('u_daniel', reads(3, 2, 1)),
    member('u_grace', reads(4, 3, 0), 'ask'),
    member('u_sam', reads(3)),
  ];

  const msg = (id: string, userId: string, kind: CircleMessage['kind'], text: string, mins: number, day?: number, prayers: string[] = [], extra: Partial<CircleMessage> = {}): CircleMessage => ({
    id, circleId: circle.id, userId, kind, day, text, createdAt: ago(mins), prayers, flagged: false, reports: [], ...extra,
  });
  const circleMessages = [
    msg('cm1', 'u_kofi', 'note', 'Welcome everyone! No pressure here. We read, we share one line, we pray for each other.', 60 * 24 * 4),
    msg('cm2', 'u_sam', 'note', 'First time trying this. Not sure what I believe yet, but I want to read it for myself.', 60 * 24 * 4 - 30),
    msg('cm3', 'u_maria', 'share', '"The darkness comprehended it not." Needed that before work.', 60 * 24 * 3, 1, ['u_kofi']),
    msg('cm4', 'u_kofi', 'prayer', 'Please pray for my mother’s recovery after her surgery.', 60 * 24 * 2, undefined, ['u_maria', 'u_daniel', 'u_grace']),
    msg('cm6', 'u_grace', 'note', 'Holding her up today, Kofi.', 60 * 24 * 2 - 20, undefined, [], { replyToId: 'cm4', reactions: { love: ['u_kofi'] } }),
    msg('cm7', 'u_daniel', 'verse', 'For your mum, and for all of us this week.', 60 * 24 * 2 - 5, undefined, ['u_kofi'], {
      verse: { ref: 'Isaiah 41:10', text: 'Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee.', bible: 'King James Version' },
    }),
    msg('cm5', 'u_maria', 'share', 'Jesus didn’t give up on Peter. Gives me hope for me.', 90, 4, [], { reactions: { amen: ['u_kofi', 'u_grace'], love: ['u_sam'] } }),
    msg('cm8', 'u_sam', 'note', 'Same. I keep coming back to that part.', 70, undefined, [], { replyToId: 'cm5' }),
  ];

  return { circles: [circle], memberships, circleMessages };
}
