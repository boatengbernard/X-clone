import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react';
import { createSeedState } from './data/seed';
import type { AppState, Notification, Post, User } from './types';

const STORAGE_KEY = 'x-clone-state-v1';

type Action =
  | { type: 'post'; text: string; replyToId?: string; quoteOfId?: string }
  | { type: 'delete'; postId: string }
  | { type: 'like'; postId: string }
  | { type: 'repost'; postId: string }
  | { type: 'bookmark'; postId: string }
  | { type: 'follow'; userId: string }
  | { type: 'updateProfile'; patch: Partial<Pick<User, 'name' | 'bio' | 'location' | 'website'>> }
  | { type: 'markNotificationsRead' }
  | { type: 'toggleTheme' }
  | { type: 'reset' };

const uid = (prefix: string) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

function toggle(list: string[], id: string) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

function reducer(state: AppState, action: Action): AppState {
  const me = state.currentUserId;
  switch (action.type) {
    case 'post': {
      const post: Post = {
        id: uid('p'),
        authorId: me,
        text: action.text,
        createdAt: new Date().toISOString(),
        replyToId: action.replyToId,
        quoteOfId: action.quoteOfId,
        likes: [],
        reposts: [],
        views: 0,
      };
      return { ...state, posts: { ...state.posts, [post.id]: post } };
    }
    case 'delete': {
      const posts = { ...state.posts };
      delete posts[action.postId];
      return { ...state, posts, bookmarks: state.bookmarks.filter((b) => b !== action.postId) };
    }
    case 'like':
    case 'repost': {
      const post = state.posts[action.postId];
      if (!post) return state;
      const key = action.type === 'like' ? 'likes' : 'reposts';
      return { ...state, posts: { ...state.posts, [post.id]: { ...post, [key]: toggle(post[key], me) } } };
    }
    case 'bookmark':
      return { ...state, bookmarks: toggle(state.bookmarks, action.postId) };
    case 'follow': {
      const user = state.users[me];
      return { ...state, users: { ...state.users, [me]: { ...user, following: toggle(user.following, action.userId) } } };
    }
    case 'updateProfile':
      return { ...state, users: { ...state.users, [me]: { ...state.users[me], ...action.patch } } };
    case 'markNotificationsRead':
      return { ...state, notifications: state.notifications.map((n): Notification => ({ ...n, read: true })) };
    case 'toggleTheme':
      return { ...state, theme: state.theme === 'dark' ? 'light' : 'dark' };
    case 'reset':
      return createSeedState();
  }
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AppState;
  } catch {
    /* storage unavailable — fall back to seed data */
  }
  return createSeedState();
}

const Ctx = createContext<{ state: AppState; dispatch: (a: Action) => void } | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
    document.documentElement.dataset.theme = state.theme;
  }, [state]);

  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  const { state } = ctx;
  return {
    ...ctx,
    me: state.users[state.currentUserId],
    userByHandle: (handle: string) => Object.values(state.users).find((u) => u.handle.toLowerCase() === handle.toLowerCase()),
    repliesTo: (postId: string) =>
      Object.values(state.posts)
        .filter((p) => p.replyToId === postId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  };
}
