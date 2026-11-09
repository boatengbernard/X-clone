import { useRef, useState } from 'react';
import { useStore } from '../store';
import { Avatar } from './Avatar';

const LIMIT = 280;

function Ring({ count }: { count: number }) {
  const r = 9;
  const c = 2 * Math.PI * r;
  const pct = Math.min(count / LIMIT, 1);
  const remaining = LIMIT - count;
  const color = remaining < 0 ? 'var(--danger)' : remaining <= 20 ? 'var(--warning)' : 'var(--accent)';
  return (
    <div className="ring" title={`${remaining} characters remaining`}>
      <svg width={26} height={26} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r={r} fill="none" stroke="var(--border)" strokeWidth={2} />
        <circle
          cx="12"
          cy="12"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          transform="rotate(-90 12 12)"
          strokeLinecap="round"
        />
      </svg>
      {remaining <= 20 && <span style={{ color }}>{remaining}</span>}
    </div>
  );
}

interface Props {
  replyToId?: string;
  placeholder?: string;
  autoFocus?: boolean;
  onPosted?: () => void;
  compact?: boolean;
}

export function Composer({ replyToId, placeholder = "What's happening?", autoFocus, onPosted, compact }: Props) {
  const { me, dispatch } = useStore();
  const [text, setText] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);
  const count = [...text].length;
  const canPost = text.trim().length > 0 && count <= LIMIT;

  const submit = () => {
    if (!canPost) return;
    dispatch({ type: 'post', text: text.trim(), replyToId });
    setText('');
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
        <textarea
          ref={ref}
          value={text}
          autoFocus={autoFocus}
          placeholder={placeholder}
          rows={compact ? 1 : 2}
          onChange={(e) => {
            setText(e.target.value);
            grow();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
          }}
          aria-label={placeholder}
        />
        <div className="composer-actions">
          <span className="hint">Ctrl + Enter to post</span>
          <div className="composer-right">
            {count > 0 && <Ring count={count} />}
            <button className="btn btn-primary" disabled={!canPost} onClick={submit}>
              {replyToId ? 'Reply' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
