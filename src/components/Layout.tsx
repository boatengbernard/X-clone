import { useMemo, useState, type ReactNode } from 'react';
import { navigate } from '../router';
import { useStore } from '../store';
import { extractHashtags } from '../utils';
import { Avatar, UserName } from './Avatar';
import { Composer } from './Composer';
import {
  BellIcon,
  BookmarkIcon,
  FeatherIcon,
  HomeIcon,
  Logo,
  MoonIcon,
  SearchIcon,
  SunIcon,
  UserIcon,
} from './Icons';
import { Modal } from './Modal';
import { FollowButton } from './FollowButton';

export function Layout({ children, active }: { children: ReactNode; active: string }) {
  const { state, me, dispatch } = useStore();
  const [composing, setComposing] = useState(false);
  const unread = state.notifications.filter((n) => !n.read).length;

  const nav = [
    { key: 'home', label: 'Home', href: '#/home', Icon: HomeIcon },
    { key: 'explore', label: 'Explore', href: '#/explore', Icon: SearchIcon },
    { key: 'notifications', label: 'Notifications', href: '#/notifications', Icon: BellIcon, badge: unread },
    { key: 'bookmarks', label: 'Bookmarks', href: '#/bookmarks', Icon: BookmarkIcon },
    { key: 'profile', label: 'Profile', href: `#/${me.handle}`, Icon: UserIcon },
  ];

  return (
    <div className="app">
      <header className="sidebar">
        <div className="sidebar-inner">
          <a href="#/home" className="logo" aria-label="Home">
            <Logo width={28} height={28} />
          </a>
          <nav aria-label="Primary">
            {nav.map(({ key, label, href, Icon, badge }) => (
              <a key={key} href={href} className={`nav-item ${active === key ? 'active' : ''}`} aria-current={active === key ? 'page' : undefined}>
                <span className="nav-icon">
                  <Icon filled={active === key} width={26} height={26} />
                  {badge ? <span className="badge">{badge}</span> : null}
                </span>
                <span className="nav-label">{label}</span>
              </a>
            ))}
            <button className="nav-item" onClick={() => dispatch({ type: 'toggleTheme' })}>
              <span className="nav-icon">{state.theme === 'dark' ? <SunIcon width={26} height={26} /> : <MoonIcon width={26} height={26} />}</span>
              <span className="nav-label">{state.theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
            </button>
          </nav>
          <button className="btn btn-primary btn-post" onClick={() => setComposing(true)}>
            <span className="nav-label">Post</span>
            <FeatherIcon className="post-icon" />
          </button>
          <a href={`#/${me.handle}`} className="account">
            <Avatar user={me} />
            <div className="account-text">
              <UserName user={me} />
              <span className="muted">@{me.handle}</span>
            </div>
          </a>
        </div>
      </header>

      <main className="timeline">{children}</main>

      <RightRail />

      <nav className="bottom-nav" aria-label="Mobile">
        {nav.map(({ key, href, Icon, badge, label }) => (
          <a key={key} href={href} className={active === key ? 'active' : ''} aria-label={label}>
            <Icon filled={active === key} width={26} height={26} />
            {badge ? <span className="badge">{badge}</span> : null}
          </a>
        ))}
      </nav>
      <button className="fab" aria-label="New post" onClick={() => setComposing(true)}>
        <FeatherIcon />
      </button>

      {composing && (
        <Modal onClose={() => setComposing(false)}>
          <Composer autoFocus onPosted={() => setComposing(false)} />
        </Modal>
      )}
    </div>
  );
}

function RightRail() {
  const { state, me } = useStore();
  const [q, setQ] = useState('');

  const trends = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of Object.values(state.posts)) for (const t of new Set(extractHashtags(p.text))) counts.set(t, (counts.get(t) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [state.posts]);

  const suggestions = Object.values(state.users)
    .filter((u) => u.id !== me.id && !me.following.includes(u.id))
    .slice(0, 3);

  return (
    <aside className="rail">
      <form
        className="search"
        onSubmit={(e) => {
          e.preventDefault();
          navigate(`/explore?q=${encodeURIComponent(q)}`);
        }}
      >
        <SearchIcon width={18} height={18} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" aria-label="Search" />
      </form>

      <section className="card">
        <h2>What’s happening</h2>
        {trends.map(([tag, n]) => (
          <a key={tag} className="trend" href={`#/explore?q=${encodeURIComponent(tag)}`}>
            <span className="muted small">Trending</span>
            <strong>{tag}</strong>
            <span className="muted small">
              {n} post{n === 1 ? '' : 's'}
            </span>
          </a>
        ))}
      </section>

      {suggestions.length > 0 && (
        <section className="card">
          <h2>Who to follow</h2>
          {suggestions.map((u) => (
            <div key={u.id} className="who">
              <Avatar user={u} />
              <div className="who-text">
                <UserName user={u} />
                <span className="muted">@{u.handle}</span>
              </div>
              <FollowButton userId={u.id} />
            </div>
          ))}
        </section>
      )}
      <footer className="muted small rail-footer">A learning project · Data is stored in your browser</footer>
    </aside>
  );
}
