import { useMemo, useState } from 'react';
import { Composer } from '../components/Composer';
import { PostCard } from '../components/PostCard';
import { useStore } from '../store';
import type { Post } from '../types';
import { gatheredScore, traditionsInReplies } from '../utils';

export interface FeedItem {
  post: Post;
  repostedBy?: string;
  key: string;
}

type Tab = 'gathered' | 'perspectives' | 'following' | 'latest';
const TABS: { key: Tab; label: string; hint: string }[] = [
  { key: 'gathered', label: 'Gathered', hint: 'Recent posts, with devotions, prayer and cross-tradition conversations lifted.' },
  { key: 'perspectives', label: 'Perspectives', hint: 'Conversations where several traditions are answering.' },
  { key: 'following', label: 'Following', hint: 'People you follow, newest first.' },
  { key: 'latest', label: 'Latest', hint: 'Everything, newest first.' },
];

export function Home() {
  const { state, me, repliesTo, hasDevotion } = useStore();
  const [tab, setTab] = useState<Tab>('gathered');

  const feed = useMemo<FeedItem[]>(() => {
    const top = Object.values(state.posts).filter((p) => !p.replyToId);
    const traditions = (p: Post) => traditionsInReplies(repliesTo(p.id), state.users).length;
    const byTime = (a: Post, b: Post) => b.createdAt.localeCompare(a.createdAt);
    const plain = (list: Post[]) => list.map((post) => ({ post, key: post.id }));

    if (tab === 'latest') return plain(top.sort(byTime));
    if (tab === 'perspectives')
      return plain(top.filter((p) => traditions(p) >= 2).sort((a, b) => traditions(b) - traditions(a) || byTime(a, b)));
    if (tab === 'following') {
      const visible = new Set([me.id, ...me.following]);
      const items: (FeedItem & { at: string })[] = [];
      for (const post of top) {
        if (visible.has(post.authorId)) items.push({ post, key: post.id, at: post.createdAt });
        else {
          const by = post.reposts.find((u) => visible.has(u));
          if (by) items.push({ post, repostedBy: by, key: `${post.id}-rp`, at: post.createdAt });
        }
      }
      return items.sort((a, b) => b.at.localeCompare(a.at));
    }
    return plain(
      top
        .map((p) => ({ p, s: gatheredScore(p, traditions(p), me.following.includes(p.authorId)) }))
        .sort((a, b) => b.s - a.s)
        .map((x) => x.p),
    );
    // repliesTo is derived from state.posts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.posts, state.users, me, tab]);

  const needsDevotion = !hasDevotion(me.id);
  const current = TABS.find((t) => t.key === tab)!;

  return (
    <>
      <div className="page-header sticky">
        <div className="tabs" role="tablist">
          {TABS.map((t) => (
            <button key={t.key} role="tab" aria-selected={tab === t.key} className={tab === t.key ? 'active' : ''} onClick={() => setTab(t.key)}>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>
      {needsDevotion ? (
        <div className="devotion-prompt">
          <p className="eyebrow">Begin with a verse</p>
          <p>Every member starts by sharing a devotion. Choose a passage and say how it is speaking to you.</p>
          <Composer initialKind="devotion" lockKind />
        </div>
      ) : (
        <div className="home-composer">
          <Composer />
        </div>
      )}
      <p className="tab-hint muted small">{current.hint}</p>
      {feed.length === 0 ? (
        <Empty
          title={tab === 'following' ? 'No one followed yet' : 'Nothing here yet'}
          body={tab === 'following' ? 'Follow members from Explore to fill this timeline.' : 'When conversations start, they will show up here.'}
        />
      ) : (
        feed.map((item) => <PostCard key={item.key} post={item.post} repostedBy={item.repostedBy} showWhy />)
      )}
    </>
  );
}

export function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty">
      <h2>{title}</h2>
      <p className="muted">{body}</p>
    </div>
  );
}
