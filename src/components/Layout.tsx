import { useMemo, useState, type ReactNode } from 'react';
import { navigate } from '../router';
import { useStore } from '../store';
import type { ThemeChoice } from '../types';
import { Avatar, TraditionTag } from './Avatar';
import { Composer } from './Composer';
import { FollowButton } from './FollowButton';
import { BellIcon, BookmarkIcon, HomeIcon, Logo, LogoutIcon, MoonIcon, SearchIcon, SunIcon, UserIcon } from './Icons';
import { Modal } from './Modal';

export function Wordmark() {
  return (
    <span className="wordmark">
      <Logo />
      Selah
    </span>
  );
}

const NEXT_THEME: Record<ThemeChoice, ThemeChoice> = { system: 'dark', dark: 'light', light: 'system' };
const THEME_LABEL: Record<ThemeChoice, string> = { system: 'Theme: system', dark: 'Theme: dark', light: 'Theme: light' };

export function Layout({ children, active }: { children: ReactNode; active: string }) {
  const { state, me, dispatch, myNotifications } = useStore();
  const [composing, setComposing] = useState(false);
  const lastSeen = state.lastSeenNotifications[me.id] ?? '';
  const unread = myNotifications.filter((n) => n.createdAt > lastSeen).length;

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
          <a href="#/home" className="logo" aria-label="Selah home">
            <Wordmark />
          </a>
          <nav aria-label="Primary">
            {nav.map(({ key, label, href, Icon, badge }) => (
              <a key={key} href={href} className={`nav-item ${active === key ? 'active' : ''}`} aria-current={active === key ? 'page' : undefined}>
                <span className="nav-icon">
                  <Icon filled={active === key} width={24} height={24} />
                  {badge ? <span className="badge">{badge}</span> : null}
                </span>
                <span className="nav-label">{label}</span>
              </a>
            ))}
            <button className="nav-item" onClick={() => dispatch({ type: 'setTheme', theme: NEXT_THEME[state.theme] })}>
              <span className="nav-icon">{state.theme === 'dark' ? <MoonIcon width={24} height={24} /> : <SunIcon width={24} height={24} />}</span>
              <span className="nav-label">{THEME_LABEL[state.theme]}</span>
            </button>
            <button className="nav-item" onClick={() => dispatch({ type: 'logout' })}>
              <span className="nav-icon">
                <LogoutIcon width={24} height={24} />
              </span>
              <span className="nav-label">Log out</span>
            </button>
          </nav>
          <button className="btn btn-primary btn-post" onClick={() => setComposing(true)}>
            <span className="nav-label">Share</span>
            <span className="post-icon" aria-label="Share">
              +
            </span>
          </button>
          <a href={`#/${me.handle}`} className="account">
            <Avatar user={me} link={false} />
            <div className="account-text">
              <strong>{me.name}</strong>
              <span className="muted small">@{me.handle}</span>
            </div>
          </a>
        </div>
      </header>

      <main className="timeline">
        <div className="mobile-top">
          <Wordmark />
          <button className="icon-btn" aria-label="Log out" onClick={() => dispatch({ type: 'logout' })}>
            <LogoutIcon width={20} height={20} />
          </button>
        </div>
        {children}
      </main>

      <RightRail />

      <nav className="bottom-nav" aria-label="Mobile">
        {nav.map(({ key, href, Icon, badge, label }) => (
          <a key={key} href={href} className={active === key ? 'active' : ''} aria-label={label}>
            <Icon filled={active === key} width={24} height={24} />
            {badge ? <span className="badge">{badge}</span> : null}
          </a>
        ))}
      </nav>
      <button className="fab" aria-label="Share something" onClick={() => setComposing(true)}>
        +
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

  const verses = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of Object.values(state.posts)) if (p.verse) counts.set(p.verse, (counts.get(p.verse) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [state.posts]);

  // Suggest people from traditions other than your own first.
  const suggestions = Object.values(state.users)
    .filter((u) => u.id !== me.id && !me.following.includes(u.id))
    .sort((a, b) => Number(a.tradition === me.tradition) - Number(b.tradition === me.tradition))
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
        <input id="rail-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search Selah" aria-label="Search Selah" />
      </form>

      {verses.length > 0 && (
        <section className="card">
          <h2>Passages people are reading</h2>
          {verses.map(([verse, n]) => (
            <a key={verse} className="trend" href={`#/explore?q=${encodeURIComponent(verse)}`}>
              <strong className="verse">{verse}</strong>
              <span className="muted small">
                {n} devotion{n === 1 ? '' : 's'}
              </span>
            </a>
          ))}
        </section>
      )}

      {suggestions.length > 0 && (
        <section className="card">
          <h2>Hear another tradition</h2>
          {suggestions.map((u) => (
            <div key={u.id} className="who">
              <Avatar user={u} />
              <div className="who-text">
                <a href={`#/${u.handle}`} className="user-name">
                  {u.name}
                </a>
                <TraditionTag user={u} />
              </div>
              <FollowButton userId={u.id} />
            </div>
          ))}
        </section>
      )}

      <section className="card formula">
        <h2>How Gathered is ranked</h2>
        <p className="small muted">
          Newer posts first. Devotions and prayer requests get a lift, and so do conversations where several traditions are talking. There are no ads and no paid
          placement. Every post says why it is there.
        </p>
      </section>
      <footer className="muted small rail-footer">Selah · No ads · Built in faith</footer>
    </aside>
  );
}
