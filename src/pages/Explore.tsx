import { useEffect, useMemo, useState } from 'react';
import { Avatar, UserName } from '../components/Avatar';
import { FollowButton } from '../components/FollowButton';
import { SearchIcon } from '../components/Icons';
import { PostCard } from '../components/PostCard';
import { navigate } from '../router';
import { useStore } from '../store';
import { Empty } from './Home';

export function Explore({ query }: { query: string }) {
  const { state } = useStore();
  const [q, setQ] = useState(query);
  useEffect(() => setQ(query), [query]);

  const term = query.trim().toLowerCase();
  const people = useMemo(
    () =>
      term
        ? Object.values(state.users).filter((u) => `${u.name} ${u.handle} ${u.bio}`.toLowerCase().includes(term.replace(/^@/, '')))
        : [],
    [state.users, term],
  );
  const posts = useMemo(
    () =>
      Object.values(state.posts)
        .filter((p) => (term ? p.text.toLowerCase().includes(term) : !p.replyToId))
        .sort((a, b) => (term ? b.createdAt.localeCompare(a.createdAt) : b.likes.length + b.reposts.length - (a.likes.length + a.reposts.length))),
    [state.posts, term],
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
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search posts, people, #tags" aria-label="Search" autoFocus={!query} />
        </form>
      </div>
      {!term && <h2 className="section-title">Popular posts</h2>}
      {people.length > 0 && (
        <section>
          <h2 className="section-title">People</h2>
          {people.map((u) => (
            <div key={u.id} className="who who-row" onClick={() => navigate(`/${u.handle}`)}>
              <Avatar user={u} />
              <div className="who-text">
                <UserName user={u} />
                <span className="muted">@{u.handle}</span>
                <span className="small">{u.bio}</span>
              </div>
              <FollowButton userId={u.id} />
            </div>
          ))}
          <h2 className="section-title">Posts</h2>
        </section>
      )}
      {posts.length === 0 ? (
        <Empty title={`No results for “${query}”`} body="Try searching for something else." />
      ) : (
        posts.map((p) => <PostCard key={p.id} post={p} />)
      )}
    </>
  );
}
