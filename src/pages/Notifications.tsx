import { useEffect } from 'react';
import { Avatar } from '../components/Avatar';
import { AmenIcon, CandleIcon, RepostIcon, UserIcon } from '../components/Icons';
import { PageHeader } from '../components/PageHeader';
import { PostCard } from '../components/PostCard';
import { navigate } from '../router';
import { useStore } from '../store';
import { timeAgo } from '../utils';
import { Empty } from './Home';

const VERB = { amen: 'said Amen to your post', praying: 'is praying with you', repost: 'reposted your post', follow: 'followed you', reply: 'replied' };

export function Notifications() {
  const { state, dispatch, myNotifications } = useStore();
  const items = [...myNotifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  useEffect(() => {
    dispatch({ type: 'markNotificationsRead' });
  }, [dispatch]);

  return (
    <>
      <PageHeader title="Notifications" />
      {items.length === 0 && <Empty title="Nothing here yet" body="Amens, prayers, replies and new followers will show up here." />}
      {items.map((n) => {
        const actor = state.users[n.actorId];
        const post = n.postId ? state.posts[n.postId] : undefined;
        if (!actor) return null;
        if (n.kind === 'reply') return post ? <PostCard key={n.id} post={post} /> : null;
        const Icon = n.kind === 'amen' ? AmenIcon : n.kind === 'praying' ? CandleIcon : n.kind === 'repost' ? RepostIcon : UserIcon;
        return (
          <div key={n.id} className="notification" onClick={() => navigate(post ? `/post/${post.id}` : `/${actor.handle}`)}>
            <Icon filled width={26} height={26} className={`notif-icon notif-${n.kind}`} />
            <div className="notif-body">
              <Avatar user={actor} size={32} />
              <p>
                <strong>{actor.name}</strong> {VERB[n.kind]} <span className="muted">· {timeAgo(n.createdAt)}</span>
              </p>
              {post && <p className="muted notif-text">{post.text}</p>}
            </div>
          </div>
        );
      })}
    </>
  );
}
