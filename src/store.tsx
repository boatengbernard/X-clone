import { createContext, useContext, useEffect, useReducer, type ReactNode } from 'react';
import { createSeedState } from './data/seed';
import type { AppState, Notification, NotificationKind, Post, PostKind, Stance, ThemeChoice, Tradition, User } from './types';

const STORAGE_KEY = 'selah-state-v1';

export interface NewAccount {
  name: string;
  handle: string;
  email: string;
  passwordHash: string;
  tradition: Tradition;
}

type Action =
  | { type: 'signup'; account: NewAccount }
  | { type: 'login'; userId: string }
  | { type: 'logout' }
  | { type: 'post'; kind: PostKind; text: string; verse?: string; stance?: Stance; replyToId?: string }
  | { type: 'delete'; postId: string }
  | { type: 'amen' | 'praying' | 'repost'; postId: string }
  | { type: 'bookmark'; postId: string }
  | { type: 'follow'; userId: string }
  | { type: 'report'; postId: string; reason: string }
  | { type: 'updateProfile'; patch: Partial<Pick<User, 'name' | 'bio' | 'location' | 'website' | 'tradition'>> }
  | { type: 'markNotificationsRead' }
  | { type: 'setTheme'; theme: ThemeChoice }
  | { type: 'reset' };

const uid = (prefix: string) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

const AVATAR_COLORS = ['#a67c2e', '#8e3b46', '#3f5b7a', '#2f6f5e', '#b5603b', '#5a4a8a', '#7a6b44', '#4b6b8a'];

function notify(state: AppState, kind: NotificationKind, targetUserId: string, postId?: string): Notification[] {
  const actorId = state.currentUserId!;
  if (targetUserId === actorId) return state.notifications;
  return [{ id: uid('n'), kind, actorId, targetUserId, postId, createdAt: new Date().toISOString() }, ...state.notifications].slice(0, 500);
}

function reducer(state: AppState, action: Action): AppState {
  if (action.type === 'signup') {
    const id = uid('u');
    const user: User = {
      id,
      ...action.account,
      bio: '',
      joined: new Date().toISOString(),
      avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      bannerColor: '#1f2a3c',
      following: [],
    };
    return { ...state, users: { ...state.users, [id]: user }, currentUserId: id };
  }
  if (action.type === 'login') return { ...state, currentUserId: action.userId };
  if (action.type === 'setTheme') return { ...state, theme: action.theme };
  if (action.type === 'reset') return { ...createSeedState(), theme: state.theme };

  const me = state.currentUserId;
  if (!me) return state;

  switch (action.type) {
    case 'logout':
      return { ...state, currentUserId: null };
    case 'post': {
      const post: Post = {
        id: uid('p'),
        authorId: me,
        kind: action.kind,
        text: action.text,
        verse: action.verse,
        stance: action.stance,
        createdAt: new Date().toISOString(),
        replyToId: action.replyToId,
        amens: [],
        praying: [],
        reposts: [],
      };
      const parent = action.replyToId ? state.posts[action.replyToId] : undefined;
      return {
        ...state,
        posts: { ...state.posts, [post.id]: post },
        notifications: parent ? notify(state, 'reply', parent.authorId, post.id) : state.notifications,
      };
    }
    case 'delete': {
      const posts = { ...state.posts };
      // Remove the post and any replies beneath it.
      const doomed = new Set([action.postId]);
      let grew = true;
      while (grew) {
        grew = false;
        for (const p of Object.values(posts)) {
          if (p.replyToId && doomed.has(p.replyToId) && !doomed.has(p.id)) {
            doomed.add(p.id);
            grew = true;
          }
        }
      }
      doomed.forEach((id) => delete posts[id]);
      return { ...state, posts, notifications: state.notifications.filter((n) => !n.postId || !doomed.has(n.postId)) };
    }
    case 'amen':
    case 'praying':
    case 'repost': {
      const post = state.posts[action.postId];
      if (!post) return state;
      const key = action.type === 'amen' ? 'amens' : action.type === 'praying' ? 'praying' : 'reposts';
      const adding = !post[key].includes(me);
      return {
        ...state,
        posts: { ...state.posts, [post.id]: { ...post, [key]: toggle(post[key], me) } },
        notifications: adding ? notify(state, action.type, post.authorId, post.id) : state.notifications,
      };
    }
    case 'bookmark':
      return { ...state, bookmarks: { ...state.bookmarks, [me]: toggle(state.bookmarks[me] ?? [], action.postId) } };
    case 'follow': {
      const user = state.users[me];
      const adding = !user.following.includes(action.userId);
      return {
        ...state,
        users: { ...state.users, [me]: { ...user, following: toggle(user.following, action.userId) } },
        notifications: adding ? notify(state, 'follow', action.userId) : state.notifications,
      };
    }
    case 'report':
      return { ...state, reports: [...state.reports, { postId: action.postId, reporterId: me, reason: action.reason, createdAt: new Date().toISOString() }] };
    case 'updateProfile':
      return { ...state, users: { ...state.users, [me]: { ...state.users[me], ...action.patch } } };
    case 'markNotificationsRead':
      return { ...state, lastSeenNotifications: { ...state.lastSeenNotifications, [me]: new Date().toISOString() } };
  }
}

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed.version === 1) return parsed;
    }
  } catch {
    /* storage unavailable: fall back to the sample content */
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
  }, [state]);

  useEffect(() => {
    const root = document.documentElement;
    if (state.theme === 'system') root.removeAttribute('data-app-theme');
    else root.setAttribute('data-app-theme', state.theme);
  }, [state.theme]);

  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}

/* eslint-disable react-refresh/only-export-components */
export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  const { state } = ctx;
  const me = state.currentUserId ? state.users[state.currentUserId] : undefined;
  return {
    ...ctx,
    /** The signed-in member. Only call from screens shown after sign-in. */
    me: me as User,
    signedIn: Boolean(me),
    userByHandle: (handle: string) => Object.values(state.users).find((u) => u.handle.toLowerCase() === handle.toLowerCase()),
    repliesTo: (postId: string) =>
      Object.values(state.posts)
        .filter((p) => p.replyToId === postId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    myBookmarks: me ? (state.bookmarks[me.id] ?? []) : [],
    reportedByMe: (postId: string) => Boolean(me && state.reports.some((r) => r.postId === postId && r.reporterId === me.id)),
    myNotifications: me ? state.notifications.filter((n) => n.targetUserId === me.id) : [],
    hasDevotion: (userId: string) => Object.values(state.posts).some((p) => p.authorId === userId && p.kind === 'devotion' && !p.replyToId),
  };
}

export async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt.toLowerCase()}:${password}`);
  try {
    const buf = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // crypto.subtle is missing in some sandboxed frames; a simple hash keeps local sign-in working.
    let h = 5381;
    for (const b of data) h = ((h << 5) + h + b) | 0;
    return `djb2-${(h >>> 0).toString(16)}`;
  }
}
