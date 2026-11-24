import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { bibleById } from '../../bible';
import { MAX_MESSAGE } from '../../circles/reducer';
import { loadPassage } from '../../circles/passage';
import { mentionsCrisis } from '../../circles/safety';
import type { CircleMessage, MessageKind, SharedVerse } from '../../circles/types';
import { Modal } from '../../components/Modal';
import { useStore } from '../../store';
import type { User } from '../../types';
import { CrisisHelp } from './shared';
import { firstName } from './chatUi';

const EMOJI = ['🙏', '🙌', '❤️', '😊', '😢', '✝️', '📖', '🕊️', '✨', '🔥', '🤍', '😂'];

export interface TodayReading {
  /** Day to read next, or null when finished. */
  day: number | null;
  /** The day read today, if any: lets you share a line about it. */
  readToday: number | null;
  onOpen: () => void;
}

export function ChatCompose({ chatId, members, replyTo, onCancelReply, initialDraft, today, onSent }: {
  chatId: string;
  /** Others in the chat, for "Encourage someone". Empty in a private chat. */
  members: User[];
  replyTo: CircleMessage | null;
  onCancelReply: () => void;
  initialDraft?: string;
  today?: TodayReading;
  onSent: (kind: MessageKind) => void;
}) {
  const { state, me, dispatch } = useStore();
  const [draft, setDraft] = useState(initialDraft ?? '');
  const [kind, setKind] = useState<MessageKind>('note');
  const [day, setDay] = useState<number | undefined>();
  const [verse, setVerse] = useState<SharedVerse | null>(null);
  const [mentions, setMentions] = useState<string[]>([]);
  const [panel, setPanel] = useState<'none' | 'attach' | 'emoji' | 'encourage'>('none');
  const [pickingVerse, setPickingVerse] = useState(false);
  const box = useRef<HTMLTextAreaElement>(null);

  // Grow with the text, up to about six lines.
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [draft]);

  useEffect(() => {
    if (replyTo) box.current?.focus();
  }, [replyTo]);

  useEffect(() => {
    if (panel === 'none') return;
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && setPanel('none');
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [panel]);

  const canSend = Boolean(draft.trim() || verse);

  function send(e?: FormEvent) {
    e?.preventDefault();
    if (!canSend) return;
    const sentKind: MessageKind = verse ? 'verse' : kind;
    dispatch({
      type: 'circleMessage',
      chatId,
      kind: sentKind,
      text: draft,
      replyToId: replyTo?.id,
      verse: verse ?? undefined,
      mentions: mentions.filter((id) => draft.includes(`@${firstName(state.users[id])}`)),
      day,
    });
    setDraft('');
    setKind('note');
    setDay(undefined);
    setVerse(null);
    setMentions([]);
    setPanel('none');
    onCancelReply();
    onSent(sentKind);
    box.current?.focus();
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends and Shift+Enter starts a new line, as in the messaging component.
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  }

  function insert(text: string) {
    const el = box.current;
    const start = el?.selectionStart ?? draft.length;
    const end = el?.selectionEnd ?? draft.length;
    const next = (draft.slice(0, start) + text + draft.slice(end)).slice(0, MAX_MESSAGE);
    setDraft(next);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + text.length, start + text.length);
    });
  }

  const choose = (k: MessageKind, d?: number) => {
    setKind(k);
    setDay(d);
    setPanel('none');
    box.current?.focus();
  };

  const placeholder = kind === 'prayer' ? 'What should your circle pray for?' : kind === 'share' ? `One line about Day ${day}` : 'Message';
  const replyAuthor = replyTo && (replyTo.userId === me.id ? 'You' : (state.users[replyTo.userId]?.name ?? 'Former member'));

  return (
    <form className="chat-compose" onSubmit={send}>
      {mentionsCrisis(draft) && (
        <div className="cc-crisis">
          <CrisisHelp />
        </div>
      )}

      {(replyTo || kind !== 'note' || verse) && (
        <div className="cc-context">
          {replyTo && (
            <div className="cc-ctx-row">
              <div className="quote">
                <b>{replyAuthor}</b>
                <span>{replyTo.verse ? replyTo.verse.ref : replyTo.text}</span>
              </div>
              <button type="button" className="cc-x" aria-label="Cancel reply" onClick={onCancelReply}>✕</button>
            </div>
          )}
          {kind !== 'note' && !verse && (
            <div className="cc-ctx-row">
              <span className={`cc-kind ${kind}`}>{kind === 'prayer' ? 'Prayer request' : `Day ${day}`}</span>
              <button type="button" className="cc-x" aria-label="Send as a normal message" onClick={() => choose('note')}>✕</button>
            </div>
          )}
          {verse && (
            <div className="cc-ctx-row">
              <div className="verse-card small">
                <span className="verse-card-ref">{verse.ref}</span>
                <p>{verse.text}</p>
              </div>
              <button type="button" className="cc-x" aria-label="Remove verse" onClick={() => setVerse(null)}>✕</button>
            </div>
          )}
        </div>
      )}

      {panel === 'attach' && (
        <div className="cc-sheet" role="group" aria-label="Share something">
          {today && (today.day || today.readToday) && (
            <button type="button" className="cc-tile" onClick={() => (today.readToday ? choose('share', today.readToday) : (setPanel('none'), today.onOpen()))}>
              <span className="cc-disc t1" aria-hidden="true">📖</span>
              {today.readToday ? `Share about Day ${today.readToday}` : `Read Day ${today.day}`}
            </button>
          )}
          <button type="button" className="cc-tile" onClick={() => choose('prayer')}>
            <span className="cc-disc t2" aria-hidden="true">🕯️</span>Prayer request
          </button>
          <button type="button" className="cc-tile" onClick={() => (setPanel('none'), setPickingVerse(true))}>
            <span className="cc-disc t3" aria-hidden="true">“</span>Verse
          </button>
          {members.length > 0 && (
            <button type="button" className="cc-tile" onClick={() => setPanel('encourage')}>
              <span className="cc-disc t4" aria-hidden="true">🤍</span>Encourage someone
            </button>
          )}
          <button type="button" className="cc-tile" disabled title="Photos are coming later">
            <span className="cc-disc t5" aria-hidden="true">🖼️</span>Photo<small>Coming later</small>
          </button>
          <button type="button" className="cc-tile" disabled title="Voice notes are coming later">
            <span className="cc-disc t6" aria-hidden="true">🎙️</span>Voice note<small>Coming later</small>
          </button>
        </div>
      )}

      {panel === 'encourage' && (
        <div className="cc-sheet list" role="group" aria-label="Encourage someone">
          <p className="muted small">Who would you like to encourage?</p>
          {members.map((u) => (
            <button
              key={u.id}
              type="button"
              className="cc-person"
              onClick={() => {
                setMentions((ms) => [...new Set([...ms, u.id])]);
                setKind('note');
                setPanel('none');
                insert(`@${firstName(u)} `);
              }}
            >
              {u.name}
            </button>
          ))}
        </div>
      )}

      {panel === 'emoji' && (
        <div className="cc-emoji" role="group" aria-label="Emoji">
          {EMOJI.map((e) => (
            <button key={e} type="button" onClick={() => insert(e)} aria-label={`Insert ${e}`}>
              {e}
            </button>
          ))}
        </div>
      )}

      <div className="cc-row">
        <div className="cc-field">
          <button
            type="button"
            className={`cc-icon ${panel === 'attach' ? 'on' : ''}`}
            aria-label="Share a reading, prayer request or verse"
            aria-expanded={panel === 'attach'}
            onClick={() => setPanel((p) => (p === 'attach' ? 'none' : 'attach'))}
          >
            +
          </button>
          <label htmlFor="chat-input" className="sr-only">
            Message
          </label>
          <textarea
            id="chat-input"
            ref={box}
            rows={1}
            maxLength={MAX_MESSAGE}
            value={draft}
            placeholder={verse ? 'Add a note (optional)' : placeholder}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <button
            type="button"
            className={`cc-icon ${panel === 'emoji' ? 'on' : ''}`}
            aria-label="Emoji"
            aria-expanded={panel === 'emoji'}
            onClick={() => setPanel((p) => (p === 'emoji' ? 'none' : 'emoji'))}
          >
            ☺
          </button>
        </div>
        <button type="submit" className={`cc-send ${canSend ? 'ready' : ''}`} disabled={!canSend} aria-label="Send">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path d="M3.4 20.4 21 12 3.4 3.6 3.4 10l12.6 2-12.6 2z" fill="currentColor" />
          </svg>
        </button>
      </div>

      {pickingVerse && <VersePicker bibleId={me.bible} onPick={(v) => (setVerse(v), setPickingVerse(false), box.current?.focus())} onClose={() => setPickingVerse(false)} />}
    </form>
  );
}

function VersePicker({ bibleId, onPick, onClose }: { bibleId?: string; onPick: (v: SharedVerse) => void; onClose: () => void }) {
  const bible = bibleById(bibleId);
  const [ref, setRef] = useState('');
  const [found, setFound] = useState<SharedVerse | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'failed'>('idle');

  async function look(e: FormEvent) {
    e.preventDefault();
    const r = ref.trim();
    if (!r) return;
    setStatus('loading');
    setFound(null);
    try {
      const verses = await loadPassage(r, bible.id);
      const text = verses.slice(0, 12).map((v) => v.text).join(' ');
      setFound({ ref: r.replace(/\s+/g, ' ').replace(/^./, (c) => c.toUpperCase()), text, bible: bible.name });
      setStatus('idle');
    } catch {
      setStatus('failed');
    }
  }

  return (
    <Modal title="Share a verse" small onClose={onClose}>
      <form className="verse-picker" onSubmit={look}>
        <label htmlFor="verse-ref">Reference</label>
        <div className="verse-picker-row">
          <input id="verse-ref" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="e.g. Psalm 23:4 or John 3:16-17" autoFocus autoComplete="off" />
          <button className="btn btn-outline" disabled={!ref.trim() || status === 'loading'}>
            {status === 'loading' ? 'Finding…' : 'Find'}
          </button>
        </div>
        <p className="muted small">From the {bible.name}. You can change your Bible on the reading screen.</p>
        {status === 'failed' && <p className="error">Couldn't find “{ref}”. Check the book name and numbers, or try again when you're online.</p>}
        {found && (
          <>
            <div className="verse-card">
              <span className="verse-card-ref">{found.ref} · {found.bible}</span>
              <p>{found.text}</p>
            </div>
            <button type="button" className="btn btn-primary" onClick={() => onPick(found)}>
              Add to message
            </button>
          </>
        )}
      </form>
    </Modal>
  );
}
