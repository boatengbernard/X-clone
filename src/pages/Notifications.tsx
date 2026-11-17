import { useEffect, useMemo, useState } from 'react';
import { Avatar } from '../components/Avatar';
import { AmenIcon, CandleIcon, PassIcon, RepostIcon, UserIcon } from '../components/Icons';
import { PageHeader } from '../components/PageHeader';
import { PostCard } from '../components/PostCard';
import { navigate } from '../router';
import { useStore } from '../store';
import { timeAgo } from '../utils';
import { Empty } from './Home';

const VERB = { amen: 'said Amen to your post', praying: 'is praying with you', repost: 'reposted your post', follow: 'followed you', reply: 'replied', sent: 'passed a post on to you' };

type Tab = 'all' | 'mentions';

export function Notifications() {
  const { state, dispatch, myNotifications, me } = useStore();
  const [tab, setTab] = useState<Tab>('all');
  const items = [...myNotifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  // Mentions, as on X: replies to you and any post that names your @username.
  const mentions = useMemo(() => {
    if (!me) return [];
    const tag = new RegExp(`(^|[^\\w])@${me.handle}(?!\\w)`, 'i');
    return Object.values(state.posts)
      .filter((p) => p.authorId !== me.id && ((p.replyToId && state.posts[p.replyToId]?.authorId === me.id) || tag.test(p.text)))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [state.posts, me]);

  useEffect(() => {
    dispatch({ type: 'markNotificationsRead' });
  }, [dispatch]);

  return (
    <>
      <PageHeader title="Notifications">
        <div className="tabs" role="tablist" aria-label="Notifications">
          {(['all', 'mentions'] as const).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
              <span>{t === 'all' ? 'All' : 'Mentions'}</span>
            </button>
          ))}
        </div>
      </PageHeader>
      {tab === 'mentions' &&
        (mentions.length === 0 ? (
          <Empty title="No mentions yet" body="When someone replies to you or mentions your @username, it will show up here." />
        ) : (
          mentions.map((p) => <PostCard key={p.id} post={p} />)
        ))}
      {tab === 'all' && items.length === 0 && <Empty title="Nothing here yet" body="Amens, prayers, replies and new followers will show up here." />}
      {tab === 'all' && items.map((n) => {
        const actor = state.users[n.actorId];
        const post = n.postId ? state.posts[n.postId] : undefined;
        if (!actor) return null;
        if (n.kind === 'reply') return post ? <PostCard key={n.id} post={post} /> : null;
        const Icon = n.kind === 'amen' ? AmenIcon : n.kind === 'praying' ? CandleIcon : n.kind === 'repost' ? RepostIcon : n.kind === 'sent' ? PassIcon : UserIcon;
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
