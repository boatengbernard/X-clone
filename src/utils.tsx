import { Fragment, type ReactNode } from 'react';
import type { Post, User } from './types';

export function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  const d = new Date(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }) });
}

export function fullDate(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })} · ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

const TOKEN = /(#\w+|@\w+|https?:\/\/[^\s]+)/g;

/** Turns hashtags, mentions and links in post text into clickable elements. */
export function richText(text: string): ReactNode {
  return text.split(TOKEN).map((part, i) => {
    if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>;
    const stop = (e: React.MouseEvent) => e.stopPropagation();
    if (part.startsWith('#'))
      return <a key={i} className="link" href={`#/explore?q=${encodeURIComponent(part)}`} onClick={stop}>{part}</a>;
    if (part.startsWith('@'))
      return <a key={i} className="link" href={`#/${part.slice(1)}`} onClick={stop}>{part}</a>;
    let label = part;
    try {
      const u = new URL(part);
      label = u.hostname.replace(/^www\./, '') + (u.pathname.length > 1 ? u.pathname.slice(0, 18) + (u.pathname.length > 18 ? '…' : '') : '');
    } catch {
      /* keep raw text */
    }
    return <a key={i} className="link" href={part} target="_blank" rel="noreferrer noopener" onClick={stop}>{label}</a>;
  });
}

export interface VideoLink {
  platform: 'YouTube' | 'Instagram' | 'X' | 'TikTok' | 'Snapchat';
  url: string;
  embedUrl?: string; // set when the video can play inside Selah
}

/** Finds the first sermon/video link from a supported platform in a post. */
export function findVideo(text: string): VideoLink | undefined {
  for (const raw of text.match(/https?:\/\/[^\s]+/g) ?? []) {
    let u: URL;
    try {
      u = new URL(raw);
    } catch {
      continue;
    }
    const host = u.hostname.replace(/^(www\.|m\.)/, '');
    if (host === 'youtube.com' && u.pathname === '/watch' && u.searchParams.get('v'))
      return { platform: 'YouTube', url: raw, embedUrl: `https://www.youtube-nocookie.com/embed/${u.searchParams.get('v')}?autoplay=1` };
    if (host === 'youtu.be' && u.pathname.length > 1)
      return { platform: 'YouTube', url: raw, embedUrl: `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}?autoplay=1` };
    if (host === 'youtube.com' && u.pathname.startsWith('/shorts/'))
      return { platform: 'YouTube', url: raw, embedUrl: `https://www.youtube-nocookie.com/embed/${u.pathname.split('/')[2]}?autoplay=1` };
    if (host === 'youtube.com') return { platform: 'YouTube', url: raw };
    if (host === 'instagram.com') {
      const m = u.pathname.match(/^\/(p|reel)\/([\w-]+)/);
      return { platform: 'Instagram', url: raw, embedUrl: m ? `https://www.instagram.com/${m[1]}/${m[2]}/embed` : undefined };
    }
    if (host === 'tiktok.com') {
      const m = u.pathname.match(/\/video\/(\d+)/);
      return { platform: 'TikTok', url: raw, embedUrl: m ? `https://www.tiktok.com/embed/v2/${m[1]}` : undefined };
    }
    if (host === 'x.com' || host === 'twitter.com') return { platform: 'X', url: raw };
    if (host.endsWith('snapchat.com')) return { platform: 'Snapchat', url: raw };
  }
  return undefined;
}

export function traditionsInReplies(replies: Post[], users: Record<string, User>): string[] {
  return [...new Set(replies.map((r) => users[r.authorId]?.tradition).filter(Boolean))] as string[];
}

/** The plain-language reason a post appears in your feed. Shown under every post. */
export function whyYouSee(post: Post, me: User, author: User, replyTraditions: number): string {
  const reasons: string[] = [];
  if (author.id === me.id) reasons.push('Your post');
  else if (me.following.includes(author.id)) reasons.push('From someone you follow');
  if (replyTraditions >= 3) reasons.push(`${replyTraditions} traditions are discussing this`);
  if (post.kind === 'devotion') reasons.push('A devotion');
  if (post.kind === 'prayer') reasons.push('A prayer request');
  if (author.id !== me.id && author.tradition !== me.tradition && reasons.length < 2) reasons.push(`A view from the ${author.tradition} tradition`);
  if (reasons.length === 0) reasons.push('Recent');
  return reasons.slice(0, 2).join(' · ');
}

/** Gathered ranking: public formula. Recency, plus a lift for devotions, prayer and cross-tradition conversation. */
export function gatheredScore(post: Post, replyTraditions: number, followed: boolean): number {
  const hours = (Date.now() - new Date(post.createdAt).getTime()) / 3_600_000;
  const recency = 1 / (1 + hours / 12);
  const kindLift = post.kind === 'devotion' ? 1.5 : post.kind === 'prayer' ? 1.4 : post.kind === 'question' ? 1.2 : 1;
  const conversationLift = 1 + 0.25 * Math.min(replyTraditions, 4);
  const followLift = followed ? 1.2 : 1;
  return recency * kindLift * conversationLift * followLift;
}
