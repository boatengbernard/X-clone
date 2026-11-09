import { useState } from 'react';
import { Composer } from '../components/Composer';
import { PageHeader } from '../components/PageHeader';
import { PostCard } from '../components/PostCard';
import { useStore } from '../store';
import type { Post } from '../types';
import { Empty } from './Home';

export function PostDetail({ id }: { id: string }) {
  const { state, repliesTo } = useStore();
  const [filter, setFilter] = useState('Everyone');
  const post = state.posts[id];
  if (!post) {
    return (
      <>
        <PageHeader title="Post" back />
        <Empty title="This post doesn’t exist" body="It may have been deleted." />
      </>
    );
  }

  const ancestors: Post[] = [];
  let cur = post.replyToId ? state.posts[post.replyToId] : undefined;
  while (cur) {
    ancestors.unshift(cur);
    cur = cur.replyToId ? state.posts[cur.replyToId] : undefined;
  }

  const replies = repliesTo(post.id);
  const traditions = [...new Set(replies.map((r) => state.users[r.authorId]?.tradition).filter(Boolean))];
  const shown = filter === 'Everyone' ? replies : replies.filter((r) => state.users[r.authorId]?.tradition === filter);

  return (
    <>
      <PageHeader title="Conversation" back />
      {ancestors.map((p) => (
        <PostCard key={p.id} post={p} showThreadLine />
      ))}
      <PostCard post={post} detail />
      <div className="detail-composer">
        <Composer replyToId={post.id} compact />
      </div>
      {traditions.length > 1 && (
        <div className="filter-bar">
          <span className="muted small">Hear one voice at a time</span>
          <div className="chips" role="group" aria-label="Filter replies by tradition">
            {['Everyone', ...traditions].map((t) => (
              <button key={t} aria-pressed={filter === t} className={filter === t ? 'on' : ''} onClick={() => setFilter(t)}>
                {t}
                {t === 'Everyone' ? ` (${replies.length})` : ''}
              </button>
            ))}
          </div>
        </div>
      )}
      {shown.map((r) => (
        <PostCard key={r.id} post={r} />
      ))}
    </>
  );
}
