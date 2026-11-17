import { PageHeader } from '../components/PageHeader';
import { PostCard } from '../components/PostCard';
import { useStore } from '../store';
import { fullDate } from '../utils';
import { Empty } from './Home';

export function Journal() {
  const { state, myBookmarks, journalEntry } = useStore();
  const posts = [...myBookmarks].reverse().map((id) => state.posts[id]).filter(Boolean);
  return (
    <>
      <PageHeader title="Journal" subtitle="Posts you kept, with your private notes" />
      {posts.length === 0 ? (
        <Empty
          title="Your journal is empty"
          body="Tap ⋯ on a devotion, sermon or conversation and choose Add to journal. You can write a note only you can see."
        />
      ) : (
        posts.map((p) => {
          const entry = journalEntry(p.id);
          return (
            <section key={p.id} className="journal-entry" aria-label="Journal entry">
              {entry?.note && (
                <div className="journal-note">
                  <span className="journal-note-label">Your note{entry.savedAt ? ` · ${fullDate(entry.savedAt)}` : ''}</span>
                  <p>{entry.note}</p>
                </div>
              )}
              <PostCard post={p} />
            </section>
          );
        })
      )}
    </>
  );
}
