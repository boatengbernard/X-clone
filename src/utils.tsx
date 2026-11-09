import { Fragment, type ReactNode } from 'react';

export function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return `${Math.max(1, Math.floor(diff))}s`;
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

export function compact(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(/\.0$/, '')}K`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
}

const TOKEN = /(#\w+|@\w+|https?:\/\/\S+|\b[\w-]+\.(?:com|io|dev|org|example)(?:\/\S*)?)/g;

/** Turns hashtags, mentions and links in post text into clickable elements. */
export function richText(text: string): ReactNode {
  return text.split(TOKEN).map((part, i) => {
    if (i % 2 === 0) return <Fragment key={i}>{part}</Fragment>;
    const stop = (e: React.MouseEvent) => e.stopPropagation();
    if (part.startsWith('#'))
      return <a key={i} className="link" href={`#/explore?q=${encodeURIComponent(part)}`} onClick={stop}>{part}</a>;
    if (part.startsWith('@'))
      return <a key={i} className="link" href={`#/${part.slice(1)}`} onClick={stop}>{part}</a>;
    const href = part.startsWith('http') ? part : `https://${part}`;
    return <a key={i} className="link" href={href} target="_blank" rel="noreferrer" onClick={stop}>{part}</a>;
  });
}

export function extractHashtags(text: string): string[] {
  return (text.match(/#\w+/g) ?? []).map((t) => t.toLowerCase());
}
