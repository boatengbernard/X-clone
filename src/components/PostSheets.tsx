import { useEffect, useMemo, useState } from 'react';
import { loadPassage } from '../circles/passage';
import { useStore } from '../store';
import type { Post, User } from '../types';
import { drawVerseCard } from '../verseCard';
import { Avatar, TraditionTag } from './Avatar';
import { FlagIcon, ImageIcon, KeepIcon, LinkIcon, RepostIcon, SearchIcon, SendIcon, TrashIcon } from './Icons';
import { Modal } from './Modal';

const postUrl = (post: Post) => `${location.origin}${location.pathname}#/post/${post.id}`;

async function copyLink(post: Post, done: (msg: string) => void) {
  const url = postUrl(post);
  try {
    await navigator.clipboard.writeText(url);
    done('Link copied');
  } catch {
    done('Copy this link: ' + url);
  }
}

/** The ⋯ menu: everything that isn't a response to the post. */
export function MoreSheet({
  post,
  onClose,
  onJournal,
  onReport,
  onDelete,
  done,
}: {
  post: Post;
  onClose: () => void;
  onJournal: () => void;
  onReport: () => void;
  onDelete: () => void;
  done: (msg: string) => void;
}) {
  const { dispatch, me, journalEntry, myBookmarks } = useStore();
  const kept = myBookmarks.includes(post.id);
  const hasNote = Boolean(journalEntry(post.id)?.note);
  const mine = post.authorId === me.id;
  return (
    <Modal onClose={onClose} title="More" small>
      <div className="sheet-list">
        <button className="sheet-item" onClick={onJournal}>
          <KeepIcon filled={kept} />
          {kept ? (hasNote ? 'Edit your journal note' : 'Add a note in your journal') : 'Add to journal'}
        </button>
        {kept && (
          <button
            className="sheet-item"
            onClick={() => {
              dispatch({ type: 'unkeep', postId: post.id });
              done('Removed from your journal');
              onClose();
            }}
          >
            <KeepIcon />
            Remove from journal
          </button>
        )}
        <button
          className="sheet-item"
          onClick={() => {
            copyLink(post, done);
            onClose();
          }}
        >
          <LinkIcon width={18} height={18} />
          Copy link
        </button>
        {mine ? (
          <button className="sheet-item danger" onClick={onDelete}>
            <TrashIcon width={18} height={18} />
            Delete post
          </button>
        ) : (
          <button className="sheet-item danger" onClick={onReport}>
            <FlagIcon width={18} height={18} />
            Report
          </button>
        )}
      </div>
    </Modal>
  );
}

/** Saving to the journal, with a private note. */
export function JournalSheet({ post, onClose, done }: { post: Post; onClose: () => void; done: (msg: string) => void }) {
  const { dispatch, journalEntry, myBookmarks } = useStore();
  const [note, setNote] = useState(journalEntry(post.id)?.note ?? '');
  const kept = myBookmarks.includes(post.id);
  return (
    <Modal onClose={onClose} title={kept ? 'Your journal note' : 'Add to your journal'} small>
      <form
        className="dialog-body"
        onSubmit={(e) => {
          e.preventDefault();
          dispatch({ type: 'keep', postId: post.id, note });
          done(kept ? 'Journal note saved' : 'Added to your journal');
          onClose();
        }}
      >
        <p className="muted small">Why does this speak to you? Only you can see this note. You can leave it empty.</p>
        <textarea
          id="journal-note"
          className="journal-input"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="I needed this today because…"
          maxLength={600}
          rows={4}
          autoFocus
        />
        <div className="dialog-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Save to journal
          </button>
        </div>
      </form>
    </Modal>
  );
}

function useVerseText(reference?: string) {
  const [text, setText] = useState<string>();
  useEffect(() => {
    if (!reference) return;
    let live = true;
    loadPassage(reference)
      .then((verses) => live && setText(verses.map((v) => v.text).join(' ')))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [reference]);
  return text;
}

/** A Scripture card preview, the same design as the saved image. */
export function VerseCard({ post, author, verseText }: { post: Post; author: User; verseText?: string }) {
  return (
    <figure className="verse-card" aria-label="Scripture card preview">
      <span className="vc-ribbon" aria-hidden="true" />
      {post.verse && <span className="vc-ref">{post.verse}</span>}
      {verseText && <blockquote className="vc-verse">“{verseText}”</blockquote>}
      <p className={verseText ? 'vc-reflection' : 'vc-reflection vc-alone'}>
        {verseText ? `${author.name.split(' ')[0]}: “${post.text}”` : post.text}
      </p>
      <figcaption className="vc-mark">
        <span>✝ Selah</span>
        <span>
          {author.name} · @{author.handle}
        </span>
      </figcaption>
    </figure>
  );
}

/** Pass it on: send inside Selah, save a Scripture card, repost or copy a link. */
export function PassSheet({ post, onClose, done }: { post: Post; onClose: () => void; done: (msg: string) => void }) {
  const { state, dispatch, me } = useStore();
  const author = state.users[post.authorId];
  const [view, setView] = useState<'main' | 'send'>('main');
  const [busy, setBusy] = useState(false);
  const isDevotion = post.kind === 'devotion' && !post.replyToId;
  const verseText = useVerseText(isDevotion ? post.verse : undefined);
  const reposted = post.reposts.includes(me.id);

  const saveImage = async () => {
    setBusy(true);
    try {
      const blob = await drawVerseCard({ reference: post.verse, verseText, reflection: post.text, authorName: author.name, handle: author.handle });
      const name = `selah-${(post.verse ?? 'devotion').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
      const file = new File([blob], name, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: post.verse ?? 'Selah' });
        done('Card ready to share');
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        done('Card saved to your device');
      }
      onClose();
    } catch (e) {
      if ((e as Error).name !== 'AbortError') done('Couldn’t make the image. Try again.');
    } finally {
      setBusy(false);
    }
  };

  if (view === 'send') return <SendView post={post} onBack={() => setView('main')} onClose={onClose} done={done} />;

  return (
    <Modal onClose={onClose} title="Pass it on" small>
      <div className="dialog-body pass-body">
        {isDevotion && <VerseCard post={post} author={author} verseText={verseText} />}
        <div className="sheet-list flush">
          <button className="sheet-item" onClick={() => setView('send')}>
            <SendIcon />
            Send to a member
          </button>
          {isDevotion && (
            <button className="sheet-item" onClick={saveImage} disabled={busy}>
              <ImageIcon />
              {busy ? 'Making your card…' : 'Save card as image for WhatsApp or Instagram'}
            </button>
          )}
          <button
            className={`sheet-item ${reposted ? 'on' : ''}`}
            aria-pressed={reposted}
            onClick={() => {
              dispatch({ type: 'repost', postId: post.id });
              done(reposted ? 'Repost removed' : 'Reposted to your followers');
              onClose();
            }}
          >
            <RepostIcon width={18} height={18} />
            {reposted ? 'Undo repost' : 'Repost to your followers'}
            {post.reposts.length > 0 && <span className="muted small sheet-count">{post.reposts.length}</span>}
          </button>
          <button
            className="sheet-item"
            onClick={() => {
              copyLink(post, done);
              onClose();
            }}
          >
            <LinkIcon width={18} height={18} />
            Copy link
          </button>
        </div>
      </div>
    </Modal>
  );
}

function SendView({ post, onBack, onClose, done }: { post: Post; onBack: () => void; onClose: () => void; done: (msg: string) => void }) {
  const { state, dispatch, me } = useStore();
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const people = useMemo(() => {
    const term = q.trim().toLowerCase().replace(/^@/, '');
    return Object.values(state.users)
      .filter((u) => u.id !== me.id && (!term || `${u.name} ${u.handle}`.toLowerCase().includes(term)))
      .sort((a, b) => Number(me.following.includes(b.id)) - Number(me.following.includes(a.id)) || a.name.localeCompare(b.name));
  }, [state.users, me, q]);
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <Modal onClose={onClose} title="Send to a member" small>
      <div className="dialog-body">
        <label className="search send-search">
          <SearchIcon width={16} height={16} />
          <input id="send-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search members" aria-label="Search members" />
        </label>
        <div className="send-list" role="group" aria-label="Members">
          {people.length === 0 && <p className="muted small">No members match “{q}”.</p>}
          {people.map((u) => (
            <label key={u.id} className={`send-row ${picked.includes(u.id) ? 'on' : ''}`}>
              <input type="checkbox" checked={picked.includes(u.id)} onChange={() => toggle(u.id)} />
              <Avatar user={u} size={32} link={false} />
              <span className="send-name">
                <strong>{u.name}</strong> <TraditionTag user={u} />
                <span className="muted small">@{u.handle}</span>
              </span>
            </label>
          ))}
        </div>
        <div className="dialog-actions">
          <button className="btn btn-outline" onClick={onBack}>
            Back
          </button>
          <button
            className="btn btn-primary"
            disabled={!picked.length}
            onClick={() => {
              dispatch({ type: 'send', postId: post.id, toUserIds: picked });
              const first = state.users[picked[0]]?.name.split(' ')[0];
              done(picked.length === 1 ? `Sent to ${first}` : `Sent to ${picked.length} members`);
              onClose();
            }}
          >
            {picked.length > 1 ? `Send to ${picked.length}` : 'Send'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
