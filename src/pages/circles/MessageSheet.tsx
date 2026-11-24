import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { REACTIONS, reactors, tickFor } from '../../circles/chat';
import type { CircleMessage } from '../../circles/types';
import { Avatar } from '../../components/Avatar';
import { useStore } from '../../store';
import { firstName, MessageText } from './chatUi';

/**
 * Opens when you press and hold a message (or right-click it, or use its ⌄ button):
 * a row of reactions and the message's actions. In "who" mode it lists who reacted.
 */
export function MessageSheet({ m, mode, memberIds, onReply, onClose }: {
  m: CircleMessage;
  mode: 'menu' | 'who';
  memberIds: string[];
  onReply: () => void;
  onClose: () => void;
}) {
  const { state, me, dispatch, savedMessages } = useStore();
  const panel = useRef<HTMLDivElement>(null);
  const [showSeen, setShowSeen] = useState(false);
  const [copied, setCopied] = useState(false);
  const mine = m.userId === me.id;
  const saved = savedMessages.some((x) => x.messageId === m.id);
  const reported = m.reports.includes(me.id);
  const author = state.users[m.userId];

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    panel.current?.querySelector<HTMLElement>('button')?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      opener?.focus?.();
    };
  }, [onClose]);

  const react = (key: (typeof REACTIONS)[number]['key']) => {
    dispatch({ type: 'circleReact', messageId: m.id, reaction: key });
    onClose();
  };

  const copy = async () => {
    const text = m.verse ? `${m.verse.text} (${m.verse.ref})${m.text ? `\n${m.text}` : ''}` : m.text;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(onClose, 700);
    } catch {
      setCopied(false);
    }
  };

  const seenBy = memberIds.filter((id) => id !== me.id && state.users[id]);
  const seen = tickFor(m) === 'seen';

  return createPortal(
    <div className="msheet-backdrop" onClick={onClose}>
      <div className="msheet" role="dialog" aria-modal="true" aria-label={mode === 'who' ? 'Reactions' : 'Message options'} ref={panel} onClick={(e) => e.stopPropagation()}>
        {mode === 'menu' && (
          <div className="msheet-reacts" role="group" aria-label="React">
            {REACTIONS.map((r) => {
              const on = reactors(m, r.key).includes(me.id);
              return (
                <button key={r.key} type="button" className={on ? 'on' : ''} aria-pressed={on} onClick={() => react(r.key)}>
                  <span aria-hidden="true">{r.emoji}</span>
                  <small>{r.label}</small>
                </button>
              );
            })}
          </div>
        )}

        <div className="msheet-preview">
          <b>{mine ? 'You' : (author?.name ?? 'Former member')}</b>
          <p>{m.verse ? `${m.verse.ref}: ${m.verse.text}` : <MessageText m={m} users={state.users} />}</p>
        </div>

        {mode === 'who' ? (
          <ul className="msheet-who">
            {REACTIONS.flatMap((r) =>
              reactors(m, r.key).map((id) => (
                <li key={`${r.key}-${id}`}>
                  {state.users[id] && <Avatar user={state.users[id]} size={32} link={false} />}
                  <span>{id === me.id ? 'You' : (state.users[id]?.name ?? 'Former member')}</span>
                  <span className="msheet-who-r">
                    {r.emoji} <small className="muted">{r.label}</small>
                  </span>
                </li>
              )),
            )}
          </ul>
        ) : (
          <div className="msheet-actions">
            <button type="button" onClick={() => (onReply(), onClose())}>Reply</button>
            <button type="button" onClick={() => (dispatch({ type: 'circlePray', messageId: m.id }), onClose())}>
              {m.prayers.includes(me.id) ? 'Stop praying for this' : 'Pray for this'}
            </button>
            <button type="button" onClick={() => dispatch({ type: 'saveMessage', messageId: m.id })}>
              {saved ? 'Saved to Journal ✓ (tap to remove)' : 'Save to Journal'}
            </button>
            <button type="button" onClick={copy}>{copied ? 'Copied' : 'Copy'}</button>
            {mine && (
              <>
                <button type="button" aria-expanded={showSeen} onClick={() => setShowSeen((v) => !v)}>
                  {seen ? `Seen by ${seenBy.length}` : 'Not seen yet'}
                </button>
                {showSeen && seen && <p className="msheet-seen muted small">{seenBy.map((id) => firstName(state.users[id])).join(', ')}</p>}
              </>
            )}
            {!mine && (
              <button type="button" className="warn" disabled={reported} onClick={() => dispatch({ type: 'circleReport', messageId: m.id })}>
                {reported ? 'Reported. Your guide will look at it.' : 'Report'}
              </button>
            )}
          </div>
        )}
        <button type="button" className="msheet-close" onClick={onClose}>
          Close
        </button>
      </div>
    </div>,
    document.body,
  );
}
