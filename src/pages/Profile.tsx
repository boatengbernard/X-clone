import { useMemo, useState } from 'react';
import { Avatar } from '../components/Avatar';
import { FollowButton } from '../components/FollowButton';
import { CalendarIcon, LinkIcon, PinIcon, VerifiedBadge } from '../components/Icons';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { PostCard } from '../components/PostCard';
import { useStore } from '../store';
import type { User } from '../types';
import { Empty, type FeedItem } from './Home';

type Tab = 'posts' | 'replies' | 'likes';

export function Profile({ handle }: { handle: string }) {
  const { state, me, userByHandle } = useStore();
  const user = userByHandle(handle);
  const [tab, setTab] = useState<Tab>('posts');
  const [editing, setEditing] = useState(false);

  const items = useMemo<FeedItem[]>(() => {
    if (!user) return [];
    const all = Object.values(state.posts).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (tab === 'likes') return all.filter((p) => p.likes.includes(user.id)).map((post) => ({ post, key: post.id }));
    if (tab === 'replies') return all.filter((p) => p.authorId === user.id && p.replyToId).map((post) => ({ post, key: post.id }));
    return all.flatMap((post): FeedItem[] => {
      const out: FeedItem[] = [];
      if (post.reposts.includes(user.id) && post.authorId !== user.id) out.push({ post, repostedBy: user.id, key: `rp-${post.id}` });
      if (post.authorId === user.id && !post.replyToId) out.push({ post, key: post.id });
      return out;
    });
  }, [state.posts, user, tab]);

  if (!user) {
    return (
      <>
        <PageHeader title="Profile" back />
        <div className="banner" />
        <Empty title="This account doesn’t exist" body="Try searching for another." />
      </>
    );
  }

  const postCount = Object.values(state.posts).filter((p) => p.authorId === user.id).length;
  const followers = Object.values(state.users).filter((u) => u.following.includes(user.id)).length;
  const isMe = user.id === me.id;
  const followsYou = !isMe && user.following.includes(me.id);

  return (
    <>
      <PageHeader title={user.name} subtitle={`${postCount} posts`} back />
      <div className="banner" style={{ background: user.bannerColor }} />
      <div className="profile-top">
        <div className="profile-avatar">
          <Avatar user={user} size={120} />
        </div>
        {isMe ? (
          <button className="btn btn-outline" onClick={() => setEditing(true)}>
            Edit profile
          </button>
        ) : (
          <FollowButton userId={user.id} />
        )}
      </div>
      <div className="profile-info">
        <h2 className="profile-name">
          {user.name} {user.verified && <VerifiedBadge width={20} height={20} />}
        </h2>
        <div className="muted">
          @{user.handle} {followsYou && <span className="pill">Follows you</span>}
        </div>
        {user.bio && <p>{user.bio}</p>}
        <div className="muted profile-meta">
          {user.location && (
            <span>
              <PinIcon /> {user.location}
            </span>
          )}
          {user.website && (
            <span>
              <LinkIcon />{' '}
              <a className="link" href={`https://${user.website.replace(/^https?:\/\//, '')}`} target="_blank" rel="noreferrer">
                {user.website}
              </a>
            </span>
          )}
          <span>
            <CalendarIcon /> Joined {new Date(user.joined).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </span>
        </div>
        <div className="profile-stats">
          <span>
            <strong>{user.following.length}</strong> <span className="muted">Following</span>
          </span>
          <span>
            <strong>{followers}</strong> <span className="muted">{followers === 1 ? 'Follower' : 'Followers'}</span>
          </span>
        </div>
      </div>
      <div className="tabs" role="tablist">
        {(['posts', 'replies', 'likes'] as Tab[]).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
            <span>{t[0].toUpperCase() + t.slice(1)}</span>
          </button>
        ))}
      </div>
      {items.length === 0 ? (
        <Empty title={tab === 'likes' ? 'No likes yet' : `@${user.handle} hasn’t posted ${tab === 'replies' ? 'replies' : ''} yet`} body="When they do, it’ll show up here." />
      ) : (
        items.map((i) => <PostCard key={i.key} post={i.post} repostedBy={i.repostedBy} />)
      )}
      {editing && <EditProfile user={user} onClose={() => setEditing(false)} />}
    </>
  );
}

function EditProfile({ user, onClose }: { user: User; onClose: () => void }) {
  const { dispatch } = useStore();
  const [form, setForm] = useState({ name: user.name, bio: user.bio, location: user.location ?? '', website: user.website ?? '' });
  const field = (key: keyof typeof form, label: string, max: number, multiline = false) => (
    <label className="field">
      <span>
        {label} <span className="muted small">{form[key].length}/{max}</span>
      </span>
      {multiline ? (
        <textarea maxLength={max} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} rows={3} />
      ) : (
        <input maxLength={max} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
      )}
    </label>
  );
  return (
    <Modal onClose={onClose} title="Edit profile">
      <form
        className="edit-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!form.name.trim()) return;
          dispatch({ type: 'updateProfile', patch: { ...form, name: form.name.trim() } });
          onClose();
        }}
      >
        {field('name', 'Name', 50)}
        {field('bio', 'Bio', 160, true)}
        {field('location', 'Location', 30)}
        {field('website', 'Website', 100)}
        <div className="edit-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => {
              if (confirm('Reset all app data to the demo content?')) {
                dispatch({ type: 'reset' });
                onClose();
              }
            }}
          >
            Reset demo data
          </button>
          <button type="submit" className="btn btn-contrast" disabled={!form.name.trim()}>
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}
