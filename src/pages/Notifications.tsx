import { useEffect } from 'react';
import { Avatar } from '../components/Avatar';
import { HeartIcon, RepostIcon, UserIcon } from '../components/Icons';
import { PageHeader } from '../components/PageHeader';
import { PostCard } from '../components/PostCard';
import { navigate } from '../router';
import { useStore } from '../store';
import { timeAgo } from '../utils';
import { Empty } from './Home';

export function Notifications() {
  const { state, dispatch, me } = useStore();

  // Build live notifications from likes/reposts on my posts plus stored ones (replies, follows).
  const derived = Object.values(state.posts)
    .filter((p) => p.authorId === me.id)
    .flatMap((p) => [
      ...p.likes.filter((u) => u !== me.id).map((u) => ({ id: `l-${p.id}-${u}`, kind: 'like' as const, actorId: u, postId: p.id, createdAt: p.createdAt })),
      ...p.reposts.filter((u) => u !== me.id).map((u) => ({ id: `r-${p.id}-${u}`, kind: 'repost' as const, actorId: u, postId: p.id, createdAt: p.createdAt })),
    ]);
  const stored = state.notifications.filter((n) => n.kind !== 'like' && n.kind !== 'repost');
  const items = [...stored, ...derived].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const hasUnread = state.notifications.some((n) => !n.read);

  useEffect(() => {
    if (hasUnread) dispatch({ type: 'markNotificationsRead' });
  }, [hasUnread, dispatch]);

  return (
    <>
      <PageHeader title="Notifications" />
      {items.length === 0 && <Empty title="Nothing to see here — yet" body="Likes, reposts and replies will show up here." />}
      {items.map((n) => {
        const actor = state.users[n.actorId];
        const post = n.postId ? state.posts[n.postId] : undefined;
        if (!actor) return null;
        if (n.kind === 'reply' || n.kind === 'mention') return post ? <PostCard key={n.id} post={post} /> : null;
        const Icon = n.kind === 'like' ? HeartIcon : n.kind === 'repost' ? RepostIcon : UserIcon;
        const verb = n.kind === 'like' ? 'liked your post' : n.kind === 'repost' ? 'reposted your post' : 'followed you';
        return (
          <div
            key={n.id}
            className="notification"
            onClick={() => navigate(post ? `/post/${post.id}` : `/${actor.handle}`)}
          >
            <Icon filled width={28} height={28} className={`notif-icon notif-${n.kind}`} />
            <div>
              <Avatar user={actor} size={32} />
              <p>
                <strong>{actor.name}</strong> {verb} <span className="muted">· {timeAgo(n.createdAt)}</span>
              </p>
              {post && <p className="muted">{post.text}</p>}
            </div>
          </div>
        );
      })}
    </>
  );
}
