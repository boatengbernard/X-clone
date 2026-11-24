import { canRead, dmOther, isDm } from '../circles/chat';
import { PageHeader } from '../components/PageHeader';
import { PostCard } from '../components/PostCard';
import { useStore } from '../store';
import { fullDate } from '../utils';
import { Empty } from './Home';

export function Journal() {
  const { state, me, dispatch, myBookmarks, journalEntry, savedMessages } = useStore();
  const posts = [...myBookmarks].reverse().map((id) => state.posts[id]).filter(Boolean);
  const kept = [...savedMessages]
    .reverse()
    .flatMap((s) => {
      const m = state.circleMessages.find((x) => x.id === s.messageId);
      return m && canRead(state, m.circleId, me.id) ? [{ m, savedAt: s.savedAt }] : [];
    });
  const chatName = (chatId: string) =>
    isDm(chatId) ? `Private chat with ${state.users[dmOther(chatId, me.id)]?.name ?? 'a former member'}` : (state.circles.find((c) => c.id === chatId)?.name ?? 'A circle');
  return (
    <>
      <PageHeader title="Journal" subtitle="Posts and circle messages you kept, with your private notes" />
      {kept.length > 0 && (
        <section className="journal-chats" aria-labelledby="journal-chats-h">
          <h2 id="journal-chats-h">From your circles</h2>
          <ul>
            {kept.map(({ m, savedAt }) => {
              const author = state.users[m.userId];
              return (
                <li key={m.id} className="journal-chat">
                  <div className="journal-chat-head">
                    <a href={`#/circles/${encodeURIComponent(m.circleId)}?m=${encodeURIComponent(m.id)}`}>
                      <b>{m.userId === me.id ? 'You' : (author?.name ?? 'Former member')}</b> in {chatName(m.circleId)}
                    </a>
                    <span className="muted small">Saved {fullDate(savedAt)}</span>
                  </div>
                  {m.kind === 'prayer' && <span className="bubble-tag prayer">Prayer request</span>}
                  {m.verse && (
                    <div className="verse-card">
                      <span className="verse-card-ref">{m.verse.ref}{m.verse.bible ? ` · ${m.verse.bible}` : ''}</span>
                      <p>{m.verse.text}</p>
                    </div>
                  )}
                  {m.text && <p>{m.text}</p>}
                  <button className="link small" onClick={() => dispatch({ type: 'saveMessage', messageId: m.id })}>
                    Remove from Journal
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
      {posts.length === 0 && kept.length === 0 ? (
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
