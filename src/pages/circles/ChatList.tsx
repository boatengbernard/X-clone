import { useEffect, useMemo, useRef, useState } from 'react';
import { chatList, dmId, isDm, previewText, type ChatSummary } from '../../circles/chat';
import { Avatar } from '../../components/Avatar';
import { SearchIcon } from '../../components/Icons';
import { Modal } from '../../components/Modal';
import { navigate } from '../../router';
import { useStore } from '../../store';
import { CircleAvatar, firstName, listTime } from './chatUi';

type Filter = 'all' | 'unread' | 'prayer';

const chatHref = (id: string, messageId?: string) => `/circles/${encodeURIComponent(id)}${messageId ? `?m=${encodeURIComponent(messageId)}` : ''}`;

export function ChatList() {
  const { state, me, myCircle } = useStore();
  const chats = useMemo(() => chatList(state, me.id), [state, me.id]);
  const [filter, setFilter] = useState<Filter>('all');
  const [q, setQ] = useState('');
  const [picking, setPicking] = useState(false);
  const search = useRef<HTMLInputElement>(null);

  // "/" jumps to search, as in the messaging component.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(t.tagName) && !t.isContentEditable) {
        e.preventDefault();
        search.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const unread = chats.reduce((n, c) => n + c.unread, 0);
  const chatName = (id: string) => chats.find((c) => c.id === id)?.name ?? '';
  const query = q.trim().toLowerCase();

  const shown = chats.filter((c) => (filter === 'unread' ? c.unread > 0 : true) && (!query || c.name.toLowerCase().includes(query)));
  const live = shown.filter((c) => !c.past);
  const past = shown.filter((c) => c.past);

  const myIds = new Set(chats.map((c) => c.id));
  const messageHits = query
    ? state.circleMessages
        .filter((m) => myIds.has(m.circleId) && `${m.text} ${m.verse?.ref ?? ''} ${m.verse?.text ?? ''}`.toLowerCase().includes(query))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 30)
    : [];
  const prayers =
    filter === 'prayer'
      ? state.circleMessages.filter((m) => myIds.has(m.circleId) && m.kind === 'prayer').sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      : [];

  const others = myCircle ? myCircle.members.filter((m) => m.user.id !== me.id) : [];

  return (
    <div className="chats">
      <div className="chats-head sticky">
        <div className="chats-title">
          <h1>Circles</h1>
          <span className="muted small">Read the Bible daily, together</span>
        </div>
        <label className="chats-search">
          <SearchIcon width={16} height={16} />
          <span className="sr-only">Search chats and messages</span>
          <input id="chat-search" ref={search} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search chats and messages" autoComplete="off" />
          {q && (
            <button type="button" className="chats-clear" onClick={() => setQ('')} aria-label="Clear search">
              ✕
            </button>
          )}
        </label>
        <div className="chats-filters" role="group" aria-label="Show">
          {(['all', 'unread', 'prayer'] as const).map((f) => (
            <button key={f} type="button" className={`chats-chip ${filter === f ? 'on' : ''}`} aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : f === 'unread' ? `Unread${unread ? ` ${unread}` : ''}` : 'Prayer requests'}
            </button>
          ))}
        </div>
      </div>

      {!myCircle && filter === 'all' && !query && (
        <a className="join-card" href="#/circles/join">
          <CircleAvatar name="+" size={46} />
          <span>
            <strong>Find a reading circle</strong>
            <span className="muted small">Read a few minutes a day with 6–8 people on the same plan, and talk about it here.</span>
          </span>
        </a>
      )}

      {filter === 'prayer' ? (
        <ul className="chat-rows" aria-label="Prayer requests">
          {prayers.length === 0 && <li className="chats-empty muted">No prayer requests in your chats yet.</li>}
          {prayers.map((m) => {
            const author = state.users[m.userId];
            return (
              <li key={m.id}>
                <a className="chat-row" href={`#${chatHref(m.circleId, m.id)}`}>
                  {author ? <Avatar user={author} size={44} link={false} /> : <CircleAvatar name="?" size={44} />}
                  <span className="chat-row-main">
                    <span className="chat-row-name">
                      {m.userId === me.id ? 'You' : (author?.name ?? 'Former member')} <span className="muted small">in {chatName(m.circleId)}</span>
                    </span>
                    <span className="chat-row-preview">{m.text}</span>
                  </span>
                  <span className="chat-row-meta">
                    {listTime(m.createdAt)}
                    <span className={`chat-praying ${m.prayers.includes(me.id) ? 'on' : ''}`}>🙏 {m.prayers.length}</span>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      ) : (
        <>
          <ul className="chat-rows" aria-label="Chats">
            {live.map((c) => (
              <ChatRow key={c.id} c={c} />
            ))}
            {query && live.length === 0 && past.length === 0 && messageHits.length === 0 && <li className="chats-empty muted">Nothing matches “{q.trim()}”.</li>}
            {!query && filter === 'unread' && live.length === 0 && <li className="chats-empty muted">You're all caught up.</li>}
          </ul>
          {past.length > 0 && (
            <>
              <h2 className="chats-section">Finished and past circles</h2>
              <ul className="chat-rows" aria-label="Past circles">
                {past.map((c) => (
                  <ChatRow key={c.id} c={c} />
                ))}
              </ul>
            </>
          )}
          {messageHits.length > 0 && (
            <>
              <h2 className="chats-section">Messages</h2>
              <ul className="chat-rows" aria-label="Matching messages">
                {messageHits.map((m) => {
                  const author = state.users[m.userId];
                  return (
                    <li key={m.id}>
                      <a className="chat-row" href={`#${chatHref(m.circleId, m.id)}`}>
                        <span className="chat-row-main">
                          <span className="chat-row-name">{chatName(m.circleId)}</span>
                          <span className="chat-row-preview">
                            <b>{m.userId === me.id ? 'You' : firstName(author)}:</b> {previewText(m)}
                          </span>
                        </span>
                        <span className="chat-row-meta">{listTime(m.createdAt)}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </>
      )}

      {others.length > 0 && (
        <button className="chats-new" type="button" aria-label="Message someone in your circle" onClick={() => setPicking(true)}>
          +
        </button>
      )}

      {picking && (
        <Modal title="Message someone" small onClose={() => setPicking(false)}>
          <ul className="pick-list">
            {others.map(({ user }) => (
              <li key={user.id}>
                <button
                  type="button"
                  className="pick-row"
                  onClick={() => {
                    setPicking(false);
                    navigate(chatHref(dmId(me.id, user.id)));
                  }}
                >
                  <Avatar user={user} size={40} link={false} />
                  <span>
                    <strong>{user.name}</strong>
                    {myCircle?.circle.guideId === user.id && <span className="guide-badge">Guide</span>}
                    <span className="muted small">@{user.handle}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="muted small pick-note">Private chats are only between the two of you.</p>
        </Modal>
      )}
    </div>
  );
}

function ChatRow({ c }: { c: ChatSummary }) {
  const { state, me, myCircle } = useStore();
  const other = c.otherId ? state.users[c.otherId] : undefined;
  const author = c.last ? state.users[c.last.userId] : undefined;
  const who = !c.last ? '' : c.last.userId === me.id ? 'You' : isDm(c.id) ? '' : firstName(author);
  return (
    <li>
      <a className={`chat-row ${c.past ? 'past' : ''}`} href={`#${chatHref(c.id)}`}>
        {other ? <Avatar user={other} size={48} link={false} /> : <CircleAvatar name={c.name} size={48} past={c.past} />}
        <span className="chat-row-main">
          <span className="chat-row-name">
            {c.name}
            {other && myCircle?.circle.guideId === other.id && <span className="guide-badge">Guide</span>}
          </span>
          <span className="chat-row-preview">
            {c.last ? (
              <>
                {who && <b>{who}: </b>}
                {previewText(c.last)}
              </>
            ) : (
              <span className="muted">No messages yet. Say hello.</span>
            )}
          </span>
        </span>
        <span className={`chat-row-meta ${c.unread ? 'new' : ''}`}>
          {c.last ? listTime(c.last.createdAt) : ''}
          {c.unread > 0 && <span className="chat-unread" aria-label={`${c.unread} unread`}>{c.unread}</span>}
        </span>
      </a>
    </li>
  );
}
