import { useMemo, useState } from 'react';
import { Composer } from '../components/Composer';
import { PostCard } from '../components/PostCard';
import { useStore } from '../store';
import type { Post } from '../types';

export interface FeedItem {
  post: Post;
  repostedBy?: string;
  key: string;
}

export function Home() {
  const { state, me } = useStore();
  const [tab, setTab] = useState<'foryou' | 'following'>('foryou');

  const feed = useMemo(() => {
    const visible = new Set([me.id, ...me.following]);
    const items: (FeedItem & { sortKey: string })[] = [];
    for (const post of Object.values(state.posts)) {
      if (post.replyToId) continue;
      if (tab === 'foryou' || visible.has(post.authorId)) items.push({ post, key: post.id, sortKey: post.createdAt });
      // Show reposts by people you follow (or yourself) as their own feed entries.
      for (const uid of post.reposts) {
        if (uid !== post.authorId && visible.has(uid) && (tab === 'following' || uid === me.id))
          items.push({ post, repostedBy: uid, key: `${post.id}-rp-${uid}`, sortKey: post.createdAt });
      }
    }
    // Dedupe: if a post appears both originally and as a repost, keep the repost version only on Following.
    const seen = new Set<string>();
    return items
      .sort((a, b) => b.sortKey.localeCompare(a.sortKey) || (a.repostedBy ? -1 : 1))
      .filter((i) => (seen.has(i.post.id) ? false : (seen.add(i.post.id), true)));
  }, [state.posts, me, tab]);

  return (
    <>
      <div className="page-header sticky">
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'foryou'} className={tab === 'foryou' ? 'active' : ''} onClick={() => setTab('foryou')}>
            <span>For you</span>
          </button>
          <button role="tab" aria-selected={tab === 'following'} className={tab === 'following' ? 'active' : ''} onClick={() => setTab('following')}>
            <span>Following</span>
          </button>
        </div>
      </div>
      <div className="home-composer">
        <Composer />
      </div>
      {feed.length === 0 ? (
        <Empty title="Nothing to see yet" body="Follow some people to fill up this timeline." />
      ) : (
        feed.map((item) => <PostCard key={item.key} post={item.post} repostedBy={item.repostedBy} />)
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
