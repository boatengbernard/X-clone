import { useEffect, useMemo, useState } from 'react';
import { Avatar, TraditionTag } from '../components/Avatar';
import { FollowButton } from '../components/FollowButton';
import { SearchIcon } from '../components/Icons';
import { PostCard } from '../components/PostCard';
import { navigate } from '../router';
import { useStore } from '../store';
import { TRADITIONS, type User } from '../types';
import { findVideo } from '../utils';
import { Empty } from './Home';

const TABS = [
  { key: 'top', label: 'Top' },
  { key: 'latest', label: 'Latest' },
  { key: 'people', label: 'People' },
  { key: 'sermons', label: 'Sermons' },
] as const;
type Tab = (typeof TABS)[number]['key'];

export function Explore({ query }: { query: string }) {
  const { state } = useStore();
  const [q, setQ] = useState(query);
  const [tradition, setTradition] = useState('');
  const [tab, setTab] = useState<Tab>('top');
  useEffect(() => setQ(query), [query]);

  const term = query.trim().toLowerCase();
  const present = TRADITIONS.filter((t) => Object.values(state.users).some((u) => u.tradition === t));

  const people = useMemo(
    () =>
      Object.values(state.users).filter((u) => {
        if (tradition && u.tradition !== tradition) return false;
        if (!term) return Boolean(tradition) || tab === 'people';
        return `${u.name} ${u.handle} ${u.bio} ${u.tradition}`.toLowerCase().includes(term.replace(/^@/, ''));
      }),
    [state.users, term, tradition, tab],
  );
  const posts = useMemo(
    () =>
      Object.values(state.posts)
        .filter((p) => {
          if (tradition && state.users[p.authorId]?.tradition !== tradition) return false;
          if (!term) return !p.replyToId;
          return `${p.text} ${p.verse ?? ''}`.toLowerCase().includes(term);
        })
        .sort((a, b) => b.amens.length - a.amens.length || b.createdAt.localeCompare(a.createdAt)),
    [state.posts, state.users, term, tradition],
  );
  const shown = useMemo(() => {
    if (tab === 'latest') return [...posts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (tab === 'sermons') return posts.filter((p) => findVideo(p.text)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return posts;
  }, [posts, tab]);
  const noResults = term ? `No results for “${query}”` : 'Nothing here yet';

  return (
    <>
      <div className="page-header sticky">
        <form
          className="search search-page"
          onSubmit={(e) => {
            e.preventDefault();
            navigate(`/explore?q=${encodeURIComponent(q)}`);
          }}
        >
          <SearchIcon width={18} height={18} />
          <input id="explore-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search posts, passages, people" aria-label="Search" />
        </form>
        <div className="chips chips-scroll" role="group" aria-label="Filter by tradition">
          <button aria-pressed={!tradition} className={!tradition ? 'on' : ''} onClick={() => setTradition('')}>
            All traditions
          </button>
          {present.map((t) => (
            <button key={t} aria-pressed={tradition === t} className={tradition === t ? 'on' : ''} onClick={() => setTradition(tradition === t ? '' : t)}>
              {t}
            </button>
          ))}
        </div>
        <div className="tabs" role="tablist" aria-label="Search results">
          {TABS.map((t) => (
            <button key={t.key} role="tab" aria-selected={tab === t.key} className={tab === t.key ? 'active' : ''} onClick={() => setTab(t.key)}>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {tab === 'people' ? (
        people.length === 0 ? (
          <Empty title={noResults} body="Try another name, username or tradition." />
        ) : (
          people.map((u) => <PersonRow key={u.id} user={u} />)
        )
      ) : (
        <>
          {tab === 'top' && people.length > 0 && (
            <section>
              <h2 className="section-title">People</h2>
              {people.slice(0, 3).map((u) => (
                <PersonRow key={u.id} user={u} />
              ))}
              {people.length > 3 && (
                <button className="show-more" onClick={() => setTab('people')}>
                  Show all {people.length} people
                </button>
              )}
            </section>
          )}
          {tab === 'top' && <h2 className="section-title">{term ? 'Posts' : 'Most amens'}</h2>}
          {shown.length === 0 ? (
            <Empty
              title={tab === 'sermons' && !term ? 'No sermons shared yet' : noResults}
              body={tab === 'sermons' ? 'Posts with a YouTube, Instagram, X, TikTok or Snapchat link show up here.' : 'Try another word, passage or tradition.'}
            />
          ) : (
            shown.map((p) => <PostCard key={p.id} post={p} />)
          )}
        </>
      )}
    </>
  );
}

function PersonRow({ user: u }: { user: User }) {
  return (
    <div className="who who-row" onClick={() => navigate(`/${u.handle}`)}>
      <Avatar user={u} />
      <div className="who-text">
        <span>
          <strong>{u.name}</strong> <TraditionTag user={u} />
        </span>
        <span className="muted small">@{u.handle}</span>
        {u.bio && <span className="small">{u.bio}</span>}
      </div>
      <FollowButton userId={u.id} />
    </div>
  );
}
