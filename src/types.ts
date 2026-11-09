export interface User {
  id: string;
  name: string;
  handle: string;
  bio: string;
  location?: string;
  website?: string;
  joined: string; // ISO date
  avatarColor: string;
  bannerColor: string;
  verified?: boolean;
  following: string[]; // user ids
}

export interface Post {
  id: string;
  authorId: string;
  text: string;
  createdAt: string; // ISO date
  replyToId?: string;
  quoteOfId?: string;
  likes: string[]; // user ids
  reposts: string[]; // user ids
  views: number;
}

export type NotificationKind = 'like' | 'repost' | 'reply' | 'follow' | 'mention';

export interface Notification {
  id: string;
  kind: NotificationKind;
  actorId: string;
  postId?: string;
  createdAt: string;
  read: boolean;
}

export interface AppState {
  currentUserId: string;
  users: Record<string, User>;
  posts: Record<string, Post>;
  bookmarks: string[];
  notifications: Notification[];
  theme: 'light' | 'dark';
}
