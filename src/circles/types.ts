import type { User } from '../types.ts';
import type { DateStr } from './dates.ts';

export type { User };

export type Rhythm = 'morning' | 'commute' | 'lunch' | 'night';
export type Nudge = 'two-days' | 'ask';

export interface ReadingLog {
  day: number;
  date: DateStr;
}

export interface Membership {
  id: string;
  userId: string;
  circleId: string;
  planId: string;
  joinedOn: DateStr;
  rhythm: Rhythm;
  /** HH:MM, local time. */
  reminderTime: string;
  nudge: Nudge;
  reads: ReadingLog[];
  finishedOn?: DateStr;
  active: boolean;
}

export interface Circle {
  id: string;
  name: string;
  planId: string;
  createdOn: DateStr;
  guideId: string;
  memberIds: string[];
  /** Circle that continues with the next plan, keyed by plan id. */
  next: Record<string, string>;
}

export type MessageKind = 'share' | 'prayer' | 'note';

export interface CircleMessage {
  id: string;
  circleId: string;
  userId: string;
  kind: MessageKind;
  day?: number;
  text: string;
  createdAt: string;
  prayers: string[];
  /** Mentions self-harm. The guide is alerted and the writer sees crisis help. */
  flagged: boolean;
  reports: string[];
}

export interface CircleMember {
  user: User;
  membership: Membership;
}

export interface CircleView {
  circle: Circle;
  members: CircleMember[];
  messages: CircleMessage[];
}

export interface CircleData {
  circles: Circle[];
  memberships: Membership[];
  circleMessages: CircleMessage[];
}

export type CirclePrefs = Pick<Membership, 'rhythm' | 'reminderTime' | 'nudge'>;
