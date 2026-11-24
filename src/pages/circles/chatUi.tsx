/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from 'react';
import { localDate } from '../../circles/dates';
import type { CircleMessage } from '../../circles/types';
import type { User } from '../../types';

/** A circle's picture: its first letter in Selah's serif on navy. */
export function CircleAvatar({ name, size = 40, past }: { name: string; size?: number; past?: boolean }) {
  return (
    <span className={`circle-avatar ${past ? 'past' : ''}`} style={{ width: size, height: size, fontSize: size * 0.46 }} aria-hidden="true">
      {name.trim().charAt(0).toUpperCase() || '·'}
    </span>
  );
}

/** Each sender's name keeps one colour in a group chat, as in WhatsApp. Six theme-aware colours. */
export function nameColor(userId: string): string {
  let h = 0;
  for (const c of userId) h = (h * 31 + c.charCodeAt(0)) | 0;
  return `var(--chat-n${(Math.abs(h) % 6) + 1})`;
}

export const firstName = (u?: User) => u?.name.split(' ')[0] ?? 'Someone';

/** "07:42" */
export const clock = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

/** Chat list time: the clock today, "Yesterday", the weekday this week, else a short date. */
export function listTime(iso: string, now = new Date()): string {
  const d = new Date(iso);
  const days = Math.round((new Date(localDate(now)).getTime() - new Date(localDate(d)).getTime()) / 86_400_000);
  if (days <= 0) return clock(iso);
  if (days === 1) return 'Yesterday';
  if (days < 7) return d.toLocaleDateString([], { weekday: 'long' });
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

/** Date divider label inside a chat. */
export function dividerLabel(iso: string, now = new Date()): string {
  const t = listTime(iso, now);
  if (t.includes(':')) return 'Today';
  if (t === 'Yesterday') return t;
  return new Date(iso).toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' });
}

/** Message text with the people it mentions highlighted. */
export function MessageText({ m, users }: { m: CircleMessage; users: Record<string, User> }): ReactNode {
  const names = (m.mentions ?? []).map((id) => firstName(users[id])).filter(Boolean);
  if (!names.length) return m.text;
  const re = new RegExp(`(@(?:${names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')}))`, 'g');
  return m.text.split(re).map((part, i) => (i % 2 ? <b key={i} className="mention">{part}</b> : part));
}
