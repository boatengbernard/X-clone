import { useRef, useState } from 'react';
import { VERSE_SUGGESTIONS } from '../data/seed';
import { useStore } from '../store';
import { KIND_LABEL, STANCE_LABEL, type PostKind, type Stance } from '../types';
import { Avatar } from './Avatar';

const LIMIT = 500;

function Counter({ count }: { count: number }) {
  const remaining = LIMIT - count;
  if (remaining > 60) return null;
  return <span className={`counter ${remaining < 0 ? 'over' : ''}`}>{remaining}</span>;
}

interface Props {
  replyToId?: string;
  autoFocus?: boolean;
  onPosted?: () => void;
  compact?: boolean;
  initialKind?: PostKind;
  lockKind?: boolean;
}

const PLACEHOLDER: Record<PostKind, string> = {
  post: 'Share something with the community',
  devotion: 'How is this passage speaking to you?',
  question: 'Ask a question. Every tradition can answer.',
  prayer: 'What can we pray with you about?',
};

export function Composer({ replyToId, autoFocus, onPosted, compact, initialKind = 'post', lockKind }: Props) {
  const { me, dispatch } = useStore();
  const [kind, setKind] = useState<PostKind>(initialKind);
  const [text, setText] = useState('');
  const [verse, setVerse] = useState('');
  const [stance, setStance] = useState<Stance | undefined>();
  const ref = useRef<HTMLTextAreaElement>(null);
  const count = [...text].length;
  const needsVerse = !replyToId && kind === 'devotion';
  const canPost = text.trim().length > 0 && count <= LIMIT && (!needsVerse || verse.trim().length > 0);

  const submit = () => {
    if (!canPost) return;
    dispatch({
      type: 'post',
      kind: replyToId ? 'post' : kind,
      text: text.trim(),
      verse: needsVerse ? verse.trim() : undefined,
      stance: replyToId ? stance : undefined,
      replyToId,
    });
    setText('');
    setVerse('');
    setStance(undefined);
    if (ref.current) ref.current.style.height = '';
    onPosted?.();
  };

  const grow = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  return (
    <div className={`composer ${compact ? 'composer-compact' : ''}`}>
      <Avatar user={me} />
      <div className="composer-body">
        {!replyToId && !lockKind && (
          <div className="kind-picker" role="radiogroup" aria-label="Type of post">
            {(Object.keys(KIND_LABEL) as PostKind[]).map((k) => (
              <button key={k} role="radio" aria-checked={kind === k} className={kind === k ? 'on' : ''} onClick={() => setKind(k)}>
                {KIND_LABEL[k]}
              </button>
            ))}
          </div>
        )}
        {needsVerse && (
          <div className="verse-field">
            <input value={verse} onChange={(e) => setVerse(e.target.value)} placeholder="Bible passage, e.g. Psalm 23:1-3" aria-label="Bible passage" maxLength={60} />
            <div className="verse-chips">
              {VERSE_SUGGESTIONS.map((v) => (
                <button key={v} className={verse === v ? 'on' : ''} onClick={() => setVerse(v)} type="button">
                  {v}
                </button>
              ))}
            </div>
          </div>
        )}
        {replyToId && (
          <div className="stance-picker" role="radiogroup" aria-label="How does your reply relate?">
            {(Object.keys(STANCE_LABEL) as Stance[]).map((s) => (
              <button key={s} role="radio" aria-checked={stance === s} className={`stance-${s} ${stance === s ? 'on' : ''}`} onClick={() => setStance(stance === s ? undefined : s)}>
                {STANCE_LABEL[s]}
              </button>
            ))}
          </div>
        )}
        <textarea
          ref={ref}
          value={text}
          autoFocus={autoFocus}
          placeholder={replyToId ? 'Write a kind, honest reply' : PLACEHOLDER[kind]}
          rows={compact ? 1 : 2}
          onChange={(e) => {
            setText(e.target.value);
            grow();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
          }}
          aria-label={replyToId ? 'Reply' : PLACEHOLDER[kind]}
        />
        <div className="composer-actions">
          <span className="hint">{needsVerse && !verse.trim() ? 'Choose a passage to share a devotion' : 'Paste a YouTube, Instagram, X, TikTok or Snapchat link to share a sermon'}</span>
          <div className="composer-right">
            <Counter count={count} />
            <button className="btn btn-primary" disabled={!canPost} onClick={submit}>
              {replyToId ? 'Reply' : kind === 'devotion' ? 'Share devotion' : kind === 'question' ? 'Ask' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
