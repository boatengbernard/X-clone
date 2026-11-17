import type { CircleData } from './circles/types.ts';

export const TRADITIONS = [
  'Catholic',
  'Orthodox',
  'Anglican',
  'Lutheran',
  'Reformed',
  'Methodist',
  'Baptist',
  'Pentecostal',
  'Evangelical',
  'Non-denominational',
  'Seeker',
  'Guest',
] as const;
export type Tradition = (typeof TRADITIONS)[number];

export const TRADITION_HINT: Partial<Record<Tradition, string>> = {
  Seeker: 'Open to finding out',
  Guest: 'Outside the faith, here to listen',
};

export type PostKind = 'post' | 'devotion' | 'question' | 'prayer';
export type Stance = 'agree' | 'nuance' | 'differ' | 'question';

export const STANCE_LABEL: Record<Stance, string> = {
  agree: 'Agree',
  nuance: 'Adding nuance',
  differ: 'Respectfully differ',
  question: 'Question',
};

export const KIND_LABEL: Record<PostKind, string> = {
  post: 'Post',
  devotion: 'Devotion',
  question: 'Question',
  prayer: 'Prayer request',
};

export interface User {
  id: string;
  name: string;
  handle: string;
  email?: string;
  passwordHash?: string;
  bio: string;
  tradition: Tradition;
  location?: string;
  website?: string;
  joined: string; // ISO date
  avatarColor: string;
  bannerColor: string;
  following: string[]; // user ids
  demo?: boolean;
  /** Finished a Reading Circles plan and offered to guide new circles. */
  canGuide?: boolean;
  /** Reading Circles plan ids this member has finished. */
  finishedPlans?: string[];
  /** bible-api.com translation id for Scripture shown to this member; King James Version when unset. */
  bible?: string;
}

export interface Post {
  id: string;
  authorId: string;
  kind: PostKind;
  text: string;
  verse?: string; // e.g. "Isaiah 41:10" for devotions
  stance?: Stance; // for replies
  createdAt: string;
  replyToId?: string;
  amens: string[]; // user ids
  praying: string[]; // user ids
  reposts: string[]; // user ids
}

export type NotificationKind = 'amen' | 'praying' | 'repost' | 'reply' | 'follow' | 'sent';

export interface Notification {
  id: string;
  kind: NotificationKind;
  actorId: string;
  targetUserId: string;
  postId?: string;
  createdAt: string;
}

/** A post kept in someone's journal, with their private note. */
export interface JournalEntry {
  note: string;
  savedAt: string;
}

export interface Report {
  postId: string;
  reporterId: string;
  reason: string;
  createdAt: string;
}

export type ThemeChoice = 'system' | 'light' | 'dark';

export interface AppState extends CircleData {
  version: 1;
  currentUserId: string | null;
  users: Record<string, User>;
  posts: Record<string, Post>;
  bookmarks: Record<string, string[]>; // user id -> post ids kept in their journal
  /** user id -> post id -> private note. Older saved data has no notes yet. */
  journal?: Record<string, Record<string, JournalEntry>>;
  notifications: Notification[];
  lastSeenNotifications: Record<string, string>; // user id -> ISO
  reports: Report[];
  theme: ThemeChoice;
}
