import { Composer } from '../components/Composer';
import { PostCard } from '../components/PostCard';
import { PageHeader } from '../components/PageHeader';
import { useStore } from '../store';
import type { Post } from '../types';
import { Empty } from './Home';

export function PostDetail({ id }: { id: string }) {
  const { state, repliesTo } = useStore();
  const post = state.posts[id];
  if (!post) {
    return (
      <>
        <PageHeader title="Post" back />
        <Empty title="This post doesn’t exist" body="It may have been deleted." />
      </>
    );
  }

  // Walk up the reply chain so the conversation shows above the focused post.
  const ancestors: Post[] = [];
  let cur = post.replyToId ? state.posts[post.replyToId] : undefined;
  while (cur) {
    ancestors.unshift(cur);
    cur = cur.replyToId ? state.posts[cur.replyToId] : undefined;
  }

  return (
    <>
      <PageHeader title="Post" back />
      {ancestors.map((p) => (
        <PostCard key={p.id} post={p} showThreadLine />
      ))}
      <PostCard post={post} detail />
      <div className="detail-composer">
        <Composer replyToId={post.id} placeholder="Post your reply" compact />
      </div>
      {repliesTo(post.id).map((r) => (
        <PostCard key={r.id} post={r} />
      ))}
    </>
  );
}
