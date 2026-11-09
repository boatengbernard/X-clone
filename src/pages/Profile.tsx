import { useMemo, useState } from 'react';
import { Avatar } from '../components/Avatar';
import { ConfirmDialog } from '../components/Dialogs';
import { FollowButton } from '../components/FollowButton';
import { CalendarIcon, LinkIcon, PinIcon } from '../components/Icons';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { PostCard } from '../components/PostCard';
import { navigate } from '../router';
import { useStore } from '../store';
import { TRADITIONS, type Tradition, type User } from '../types';
import { Empty, type FeedItem } from './Home';

type Tab = 'posts' | 'devotions' | 'replies' | 'amens';
const TAB_LABEL: Record<Tab, string> = { posts: 'Posts', devotions: 'Devotions', replies: 'Replies', amens: 'Amens' };

export function Profile({ handle }: { handle: string }) {
  const { state, me, userByHandle } = useStore();
  const user = userByHandle(handle);
  const [tab, setTab] = useState<Tab>('posts');
  const [editing, setEditing] = useState(false);

  const items = useMemo<FeedItem[]>(() => {
    if (!user) return [];
    const all = Object.values(state.posts).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const plain = (list: typeof all) => list.map((post) => ({ post, key: post.id }));
    if (tab === 'amens') return plain(all.filter((p) => p.amens.includes(user.id)));
    if (tab === 'replies') return plain(all.filter((p) => p.authorId === user.id && p.replyToId));
    if (tab === 'devotions') return plain(all.filter((p) => p.authorId === user.id && p.kind === 'devotion'));
    return all.flatMap((post): FeedItem[] => {
      if (post.authorId === user.id && !post.replyToId) return [{ post, key: post.id }];
      if (post.reposts.includes(user.id) && post.authorId !== user.id) return [{ post, repostedBy: user.id, key: `rp-${post.id}` }];
      return [];
    });
  }, [state.posts, user, tab]);

  if (!user) {
    return (
      <>
        <PageHeader title="Profile" back />
        <Empty title="This account doesn’t exist" body="Try searching for another member." />
      </>
    );
  }

  const postCount = Object.values(state.posts).filter((p) => p.authorId === user.id && !p.replyToId).length;
  const followers = Object.values(state.users).filter((u) => u.following.includes(user.id)).length;
  const isMe = user.id === me.id;
  const followsYou = !isMe && user.following.includes(me.id);

  return (
    <>
      <PageHeader title={user.name} subtitle={`${postCount} post${postCount === 1 ? '' : 's'}`} back />
      <div className="banner" style={{ background: user.bannerColor }}>
        <span className="banner-mark" aria-hidden="true" />
      </div>
      <div className="profile-top">
        <div className="profile-avatar">
          <Avatar user={user} size={112} link={false} />
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
        <h2 className="profile-name">{user.name}</h2>
        <div className="profile-sub">
          <span className="muted">@{user.handle}</span>
          <span className="tradition">{user.tradition}</span>
          {followsYou && <span className="pill">Follows you</span>}
          {user.demo && <span className="pill">Demo account</span>}
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
              <a className="link" href={`https://${user.website.replace(/^https?:\/\//, '')}`} target="_blank" rel="noreferrer noopener">
                {user.website.replace(/^https?:\/\//, '')}
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
        {(Object.keys(TAB_LABEL) as Tab[]).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
            <span>{TAB_LABEL[t]}</span>
          </button>
        ))}
      </div>
      {items.length === 0 ? (
        <Empty title={`No ${TAB_LABEL[tab].toLowerCase()} yet`} body={isMe ? 'When you share, it will show up here.' : 'When they share, it will show up here.'} />
      ) : (
        items.map((i) => <PostCard key={i.key} post={i.post} repostedBy={i.repostedBy} />)
      )}
      {editing && <EditProfile user={user} onClose={() => setEditing(false)} />}
    </>
  );
}

function EditProfile({ user, onClose }: { user: User; onClose: () => void }) {
  const { dispatch } = useStore();
  const [form, setForm] = useState({ name: user.name, bio: user.bio, location: user.location ?? '', website: user.website ?? '', tradition: user.tradition });
  const [confirmReset, setConfirmReset] = useState(false);
  const text = (key: 'name' | 'bio' | 'location' | 'website', label: string, max: number, multiline = false) => (
    <label className="field">
      <span>
        {label}{' '}
        <span className="muted small">
          {form[key].length}/{max}
        </span>
      </span>
      {multiline ? (
        <textarea id={`ep-${key}`} maxLength={max} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} rows={3} />
      ) : (
        <input id={`ep-${key}`} maxLength={max} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
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
        {text('name', 'Name', 50)}
        <label className="field">
          <span>Tradition</span>
          <select id="ep-tradition" value={form.tradition} onChange={(e) => setForm({ ...form, tradition: e.target.value as Tradition })}>
            {TRADITIONS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        {text('bio', 'Bio', 160, true)}
        {text('location', 'Location', 30)}
        {text('website', 'Website', 100)}
        <div className="edit-actions">
          <button type="button" className="btn btn-outline" onClick={() => setConfirmReset(true)}>
            Reset all data
          </button>
          <button type="submit" className="btn btn-contrast" disabled={!form.name.trim()}>
            Save
          </button>
        </div>
      </form>
      {confirmReset && (
        <ConfirmDialog
          title="Reset all data?"
          body="This deletes every account and post saved in this browser and restores the sample content."
          confirmLabel="Reset"
          danger
          onClose={() => setConfirmReset(false)}
          onConfirm={() => {
            dispatch({ type: 'reset' });
            navigate('/signup');
          }}
        />
      )}
    </Modal>
  );
}
