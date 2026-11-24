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

export type MessageKind = 'share' | 'prayer' | 'note' | 'verse';

/** Reactions on a chat message. "pray" is stored in `prayers`, the rest in `reactions`. */
export type Reaction = 'pray' | 'amen' | 'love' | 'with' | 'peace';

export interface SharedVerse {
  ref: string;
  text: string;
  /** Translation name, e.g. "King James Version". */
  bible: string;
}

export interface CircleMessage {
  id: string;
  /** The circle's id for its group chat, or a private chat id (`dm:<user>:<user>`, see chat.ts). */
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
  /** The message this one answers, shown as a quote above it. */
  replyToId?: string;
  verse?: SharedVerse;
  /** Members named with "Encourage someone". */
  mentions?: string[];
  reactions?: Partial<Record<Exclude<Reaction, 'pray'>, string[]>>;
}

export interface SavedMessage {
  messageId: string;
  savedAt: string;
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
  /** user id -> chat id -> when they last had that chat open (ISO). */
  chatReads?: Record<string, Record<string, string>>;
  /** user id -> chat messages they kept in their Journal. */
  savedMessages?: Record<string, SavedMessage[]>;
}

export type CirclePrefs = Pick<Membership, 'rhythm' | 'reminderTime' | 'nudge'>;
