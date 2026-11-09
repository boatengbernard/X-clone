import { useEffect, useMemo, useState } from 'react';
import { Avatar, TraditionTag } from '../components/Avatar';
import { FollowButton } from '../components/FollowButton';
import { SearchIcon } from '../components/Icons';
import { PostCard } from '../components/PostCard';
import { navigate } from '../router';
import { useStore } from '../store';
import { TRADITIONS } from '../types';
import { Empty } from './Home';

export function Explore({ query }: { query: string }) {
  const { state } = useStore();
  const [q, setQ] = useState(query);
  const [tradition, setTradition] = useState('');
  useEffect(() => setQ(query), [query]);

  const term = query.trim().toLowerCase();
  const present = TRADITIONS.filter((t) => Object.values(state.users).some((u) => u.tradition === t));

  const people = useMemo(
    () =>
      Object.values(state.users).filter((u) => {
        if (tradition && u.tradition !== tradition) return false;
        if (!term) return Boolean(tradition);
        return `${u.name} ${u.handle} ${u.bio} ${u.tradition}`.toLowerCase().includes(term.replace(/^@/, ''));
      }),
    [state.users, term, tradition],
  );
  const posts = useMemo(
    () =>
      Object.values(state.posts)
        .filter((p) => {
          if (tradition && state.users[p.authorId]?.tradition !== tradition) return false;
          if (!term) return !p.replyToId;
          return `${p.text} ${p.verse ?? ''}`.toLowerCase().includes(term);
        })
        .sort((a, b) => (term ? b.createdAt.localeCompare(a.createdAt) : b.amens.length - a.amens.length)),
    [state.posts, state.users, term, tradition],
  );

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
      </div>
      {people.length > 0 && (
        <section>
          <h2 className="section-title">People</h2>
          {people.map((u) => (
            <div key={u.id} className="who who-row" onClick={() => navigate(`/${u.handle}`)}>
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
          ))}
        </section>
      )}
      <h2 className="section-title">{term ? 'Posts' : 'Most amens'}</h2>
      {posts.length === 0 ? (
        <Empty title={term ? `No results for “${query}”` : 'No posts yet'} body="Try another word, passage or tradition." />
      ) : (
        posts.map((p) => <PostCard key={p.id} post={p} />)
      )}
    </>
  );
}
