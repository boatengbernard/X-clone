import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { localDate } from '../circles/dates';
import { planById } from '../circles/plans';
import { nextDay, readOn } from '../circles/progress';
import { navigate } from '../router';
import { unreadTotal } from '../circles/chat';
import { useStore } from '../store';
import type { ThemeChoice } from '../types';
import { Avatar, TraditionTag } from './Avatar';
import { Composer } from './Composer';
import { FollowButton } from './FollowButton';
import { BellIcon, CirclesIcon, HomeIcon, JournalIcon, Logo, LogoutIcon, MoonIcon, SearchIcon, SunIcon, UserIcon } from './Icons';
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  // Following a link in the drawer changes the page; close the drawer when that happens.
  useEffect(() => setDrawerOpen(false), [active]);
  const lastSeen = state.lastSeenNotifications[me.id] ?? '';
  const unread = myNotifications.filter((n) => n.createdAt > lastSeen).length;
  const unreadChats = useMemo(() => unreadTotal(state, me.id), [state, me.id]);

  const nav = [
    { key: 'home', label: 'Home', href: '#/home', Icon: HomeIcon },
    { key: 'explore', label: 'Explore', href: '#/explore', Icon: SearchIcon },
    { key: 'circles', label: 'Circles', href: '#/circles', Icon: CirclesIcon, badge: unreadChats },
    { key: 'notifications', label: 'Notifications', href: '#/notifications', Icon: BellIcon, badge: unread },
    { key: 'journal', label: 'Journal', href: '#/journal', Icon: JournalIcon },
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
          <button
            className="drawer-toggle"
            aria-label={unread ? `Open menu, ${unread} unread notifications` : 'Open menu'}
            aria-expanded={drawerOpen}
            aria-controls="nav-drawer"
            onClick={() => setDrawerOpen(true)}
          >
            <Avatar user={me} link={false} size={34} />
            {unread ? <span className="badge" aria-hidden="true">{unread}</span> : null}
          </button>
          <Wordmark />
          <span className="mobile-top-spacer" aria-hidden="true" />
        </div>
        {children}
      </main>

      <RightRail />

      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} nav={nav} active={active} />

      {/* Circle posts are private, so the public share button stays off the Circles screens. */}
      {active !== 'circles' && (
        <button className="fab" aria-label="Share something" onClick={() => setComposing(true)}>
          +
        </button>
      )}

      {composing && (
        <Modal onClose={() => setComposing(false)}>
          <Composer autoFocus onPosted={() => setComposing(false)} />
        </Modal>
      )}
    </div>
  );
}

type NavEntry = { key: string; label: string; href: string; Icon: (p: { filled?: boolean; width?: number; height?: number }) => ReactNode; badge?: number };

/** Mobile side menu: slides in from the left over the page, like X's account drawer. */
function NavDrawer({ open, onClose, nav, active }: { open: boolean; onClose: () => void; nav: NavEntry[]; active: string }) {
  const { state, me, dispatch } = useStore();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    panel.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      opener?.focus?.();
    };
  }, [open, onClose]);

  const following = me.following.length;
  const followers = Object.values(state.users).filter((u) => u.following.includes(me.id)).length;

  return createPortal(
    <div className={`drawer-root ${open ? 'open' : ''}`} inert={!open}>
      <div className="drawer-backdrop" onClick={onClose} />
      <div id="nav-drawer" className="drawer" role="dialog" aria-modal="true" aria-label="Menu" tabIndex={-1} ref={panel}>
        <div className="drawer-account">
          <div className="drawer-account-top">
            <a href={`#/${me.handle}`} onClick={onClose} aria-label="Your profile">
              <Avatar user={me} link={false} size={44} />
            </a>
            <button className="icon-btn" onClick={onClose} aria-label="Close menu">
              ✕
            </button>
          </div>
          <a href={`#/${me.handle}`} onClick={onClose} className="drawer-name">
            <strong>{me.name}</strong>
            <span className="muted small">@{me.handle}</span>
          </a>
          <div className="drawer-counts small">
            <span>
              <strong>{following}</strong> <span className="muted">Following</span>
            </span>
            <span>
              <strong>{followers}</strong> <span className="muted">Followers</span>
            </span>
          </div>
        </div>
        <nav aria-label="Primary" className="drawer-nav">
          {nav.map(({ key, label, href, Icon, badge }) => (
            <a
              key={key}
              href={href}
              onClick={onClose}
              className={`drawer-item ${active === key ? 'active' : ''}`}
              aria-current={active === key ? 'page' : undefined}
            >
              <span className="nav-icon">
                <Icon filled={active === key} width={24} height={24} />
                {badge ? <span className="badge">{badge}</span> : null}
              </span>
              <span>{label}</span>
            </a>
          ))}
        </nav>
        <div className="drawer-foot">
          <button className="drawer-item" onClick={() => dispatch({ type: 'setTheme', theme: NEXT_THEME[state.theme] })}>
            <span className="nav-icon">{state.theme === 'dark' ? <MoonIcon width={24} height={24} /> : <SunIcon width={24} height={24} />}</span>
            <span>{THEME_LABEL[state.theme]}</span>
          </button>
          <button className="drawer-item" onClick={() => dispatch({ type: 'logout' })}>
            <span className="nav-icon">
              <LogoutIcon width={24} height={24} />
            </span>
            <span>Log out</span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function CircleCard() {
  const { myCircle } = useStore();
  if (!myCircle)
    return (
      <section className="card circle-card">
        <h2>Reading Circles</h2>
        <p className="small muted">Read a few minutes a day with 6–8 people on the same plan. Grace days, not broken streaks.</p>
        <a className="btn btn-outline btn-sm" href="#/circles/join">Find a circle</a>
      </section>
    );
  return (
    <section className="card circle-card">
      <h2>{myCircle.circle.name}</h2>
      <CircleTodayLine />
      <a className="btn btn-outline btn-sm" href="#/circles/mine">Open chat</a>
    </section>
  );
}

function CircleTodayLine() {
  const { me, myCircle } = useStore();
  const m = myCircle?.members.find((x) => x.user.id === me.id)?.membership;
  const plan = m && planById(m.planId);
  if (!m || !plan) return null;
  if (m.finishedOn) return <p className="small muted">You finished {plan.title}. Choose what to read next.</p>;
  const day = nextDay(m.reads, plan.days.length);
  const read = readOn(m.reads, localDate());
  return (
    <p className="small muted">
      {read ? 'Done for today ✓ ' : ''}
      {day ? `${read ? 'Next' : 'Today'}: Day ${day}, ${plan.days[day - 1].ref}` : ''} · {m.reads.length} of {plan.days.length} read
    </p>
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

      <CircleCard />

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
