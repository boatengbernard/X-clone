import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { canPost, chatMemberIds, chatMessages, dmId, dmOther, isDm, REACTIONS, reactors, tickFor, type Tick } from '../../circles/chat';
import { localDate } from '../../circles/dates';
import { planById } from '../../circles/plans';
import { needsCheckIn, nextDay, quietDays, readOn } from '../../circles/progress';
import type { CircleMessage, MessageKind } from '../../circles/types';
import { Avatar } from '../../components/Avatar';
import { BackIcon } from '../../components/Icons';
import { navigate } from '../../router';
import { useStore } from '../../store';
import { ChatCompose } from './ChatCompose';
import { CircleAvatar, clock, dividerLabel, firstName, MessageText, nameColor } from './chatUi';
import { MessageSheet } from './MessageSheet';
import { CrisisHelp, readingReminder } from './shared';

/** Short replies from other members' (simulated) phones, so the chat feels alive on this one device. */
const REPLIES: Record<string, string[]> = {
  prayer: ['Praying for you right now 🙏', "Holding this up today. You're not alone.", 'Praying with you 🙏'],
  share: ['Amen. Thanks for sharing that.', 'That line stood out to me too.', 'So good. Needed that today.'],
  verse: ['Needed that verse today 🙌', 'Amen 🙌 Saving this one.'],
  note: ['Amen!', 'Thank you for this 🙏', "So glad you're here."],
  dm: ['Thank you, that means a lot 🙏', 'Thanks for checking in. Talk soon!', "Good to hear from you. I'm praying for you too."],
};
const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

export function ChatView({ chatId, focusId, initialDraft, justRead, welcome }: {
  chatId: string;
  /** Message to scroll to and highlight, from search or the prayer list. */
  focusId?: string;
  initialDraft?: string;
  /** Day just marked read, for the "Day 5 done" note. */
  justRead?: number;
  welcome?: boolean;
}) {
  const { state, me, dispatch } = useStore();
  const dm = isDm(chatId);
  const other = dm ? state.users[dmOther(chatId, me.id)] : undefined;
  const circle = dm ? undefined : state.circles.find((c) => c.id === chatId);
  const myMembership = state.memberships.find((m) => m.userId === me.id && m.circleId === chatId && m.active);
  const plan = myMembership ? planById(myMembership.planId) : undefined;
  const memberIds = chatMemberIds(state, chatId);
  const others = memberIds.filter((id) => id !== me.id).map((id) => state.users[id]).filter(Boolean);
  const postable = canPost(state, chatId, me.id);
  const messages = useMemo(() => chatMessages(state, chatId), [state, chatId]);
  const byId = useMemo(() => new Map(messages.map((m) => [m.id, m])), [messages]);

  const [sheet, setSheet] = useState<{ id: string; mode: 'menu' | 'who' } | null>(null);
  const [replyTo, setReplyTo] = useState<CircleMessage | null>(null);
  const [flash, setFlash] = useState<string | null>(focusId ?? null);
  const [typing, setTyping] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const scroller = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Full-height chat: hides the phone top bar and the page's bottom padding while open.
  useEffect(() => {
    document.body.classList.add('in-chat');
    return () => document.body.classList.remove('in-chat');
  }, []);

  // Opening a chat marks it read, and so does every new message while it is open.
  useEffect(() => {
    dispatch({ type: 'chatRead', chatId, at: new Date().toISOString() });
  }, [chatId, messages.length, dispatch]);

  useEffect(() => () => timers.current.forEach((t) => clearTimeout(t)), []);

  // Ticks move from sent to delivered to seen over a few seconds, so re-render while any are in flight.
  const lastMine = [...messages].reverse().find((m) => m.userId === me.id);
  useEffect(() => {
    if (!lastMine || tickFor(lastMine, now) === 'seen') return;
    const t = setTimeout(() => setNow(Date.now()), 500);
    return () => clearTimeout(t);
  }, [lastMine, now]);

  // Keep the newest message in view; jump to a focused one when asked.
  const scrollToBottom = useCallback((smooth = false) => {
    const el = scroller.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  }, []);
  const jumpTo = useCallback((id: string) => {
    const el = document.getElementById(`msg-${id}`);
    if (!el) return;
    el.scrollIntoView({ block: 'center' });
    setFlash(id);
    const t = window.setTimeout(() => setFlash((f) => (f === id ? null : f)), 1800);
    timers.current.push(t);
  }, []);
  useLayoutEffect(() => {
    if (focusId && byId.has(focusId)) jumpTo(focusId);
    else scrollToBottom();
    // Only on opening the chat.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);
  const count = messages.length;
  const prevCount = useRef(count);
  useEffect(() => {
    if (count > prevCount.current) {
      const el = scroller.current;
      const nearBottom = el ? el.scrollHeight - el.scrollTop - el.clientHeight < 240 : true;
      if (nearBottom || messages[count - 1]?.userId === me.id) scrollToBottom(true);
    }
    prevCount.current = count;
  }, [count, messages, me.id, scrollToBottom]);
  useEffect(() => {
    if (typing) scrollToBottom(true);
  }, [typing, scrollToBottom]);

  /** After you send, someone else in the chat starts typing and answers. Not for messages that raised a safety alert. */
  function simulateReply(kind: MessageKind) {
    const candidates = others.filter((u) => !u.passwordHash && !u.demo);
    if (!candidates.length) return;
    const who = pick(candidates);
    const t1 = window.setTimeout(() => setTyping(who.id), 1400);
    const t2 = window.setTimeout(() => {
      setTyping(null);
      const mineNow = chatMessages(stateRef.current, chatId).filter((m) => m.userId === me.id);
      const last = mineNow[mineNow.length - 1];
      if (!last || last.flagged) return;
      dispatch({ type: 'chatIncoming', chatId, fromUserId: who.id, text: pick(REPLIES[dm ? 'dm' : kind] ?? REPLIES.note), replyToId: kind === 'prayer' ? last.id : undefined });
    }, 4200);
    timers.current.push(t1, t2);
  }
  // Long press opens the message menu on touch screens.
  const press = useRef<number | null>(null);
  const startPress = (id: string) => (e: ReactPointerEvent) => {
    if (e.pointerType === 'mouse') return;
    press.current = window.setTimeout(() => {
      navigator.vibrate?.(10);
      setSheet({ id, mode: 'menu' });
    }, 450);
  };
  const endPress = () => {
    if (press.current) clearTimeout(press.current);
    press.current = null;
  };

  // ---- Header pieces
  const today = localDate();
  const day = myMembership && plan ? nextDay(myMembership.reads, plan.days.length) : null;
  const readTodayLog = myMembership?.reads.filter((r) => r.date === today).sort((a, b) => b.day - a.day)[0];
  const circleMembers = circle
    ? circle.memberIds.flatMap((id) => {
        const membership = state.memberships.find((x) => x.userId === id && x.circleId === circle.id && x.active);
        return state.users[id] && membership ? [{ user: state.users[id], membership }] : [];
      })
    : [];
  const readTodayCount = circleMembers.filter((m) => readOn(m.membership.reads, today)).length;
  const isGuide = circle?.guideId === me.id && Boolean(myMembership);
  const view = circle ? { circle, members: circleMembers, messages: [] } : null;
  const reminder = myMembership ? readingReminder(me.id, view) : null;

  const typingName = typing ? firstName(state.users[typing]) : '';
  const subtitle = typing
    ? `${typingName} is typing…`
    : dm
      ? other
        ? `@${other.handle}`
        : ''
      : others.length
        ? [...others.map((u) => firstName(u)), 'You'].join(', ')
        : 'Just you so far';

  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const flagged = isGuide ? messages.filter((m) => m.flagged && m.userId !== me.id && m.createdAt > weekAgo) : [];
  const checkIns = isGuide ? circleMembers.filter((m) => m.user.id !== me.id && needsCheckIn(m.membership, today)) : [];
  const myRecentFlag = lastMine?.flagged && Date.now() - new Date(lastMine.createdAt).getTime() < 30 * 60_000;

  // ---- Messages with date dividers
  const rows: { key: string; node: 'divider' | 'msg' | 'today'; label?: string; m?: CircleMessage; cont?: boolean }[] = [];
  let lastLabel = '';
  messages.forEach((m, i) => {
    const label = dividerLabel(m.createdAt);
    if (label !== lastLabel) {
      rows.push({ key: `d-${m.id}`, node: 'divider', label });
      if (label === 'Today' && myMembership) rows.push({ key: 'today', node: 'today' });
      lastLabel = label;
    }
    const prev = messages[i - 1];
    const cont = Boolean(prev && prev.userId === m.userId && dividerLabel(prev.createdAt) === label && new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() < 5 * 60_000);
    rows.push({ key: m.id, node: 'msg', m, cont });
  });
  if (myMembership && lastLabel !== 'Today') {
    rows.push({ key: 'd-today', node: 'divider', label: 'Today' });
    rows.push({ key: 'today', node: 'today' });
  }

  const readers = circleMembers.filter((m) => readOn(m.membership.reads, today)).map((m) => (m.user.id === me.id ? 'You' : firstName(m.user)));
  const todayLine = readers.length
    ? `${readers.length <= 3 ? readers.join(', ').replace(/, ([^,]*)$/, ' and $1') : `${readers.length} people`} read today · ${readTodayCount} of ${circleMembers.length}`
    : `Nobody has read yet today · 0 of ${circleMembers.length}`;

  const sheetMessage = sheet ? byId.get(sheet.id) : undefined;

  return (
    <div className="chat">
      <header className="chat-head">
        <button className="icon-btn" aria-label="Back to chats" onClick={() => navigate('/circles')}>
          <BackIcon />
        </button>
        <a className="chat-head-who" href={dm ? (other ? `#/${other.handle}` : '#/circles') : `#/circles/${encodeURIComponent(chatId)}/info`}>
          {dm ? other && <Avatar user={other} size={38} link={false} /> : <CircleAvatar name={circle?.name ?? '?'} size={38} past={!myMembership} />}
          <span className="chat-head-text">
            <strong>{dm ? (other?.name ?? 'Former member') : (circle?.name ?? 'Circle')}</strong>
            {subtitle && <span className={typing ? 'typing' : ''}>{subtitle}</span>}
          </span>
        </a>
        {!dm && (
          <a className="icon-btn chat-head-info" href={`#/circles/${encodeURIComponent(chatId)}/info`} aria-label="Group info">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 11v6M12 7.5h.01" />
            </svg>
          </a>
        )}
      </header>

      {myMembership && plan && (
        <div className="chat-pin">
          <span className="chat-pin-icon" aria-hidden="true">📖</span>
          {myMembership.finishedOn ? (
            <>
              <span className="chat-pin-text">
                <small>Finished</small>
                <b>You read all of {plan.title}</b>
              </span>
              <a className="chat-pin-go" href="#/circles/next">What's next</a>
            </>
          ) : readTodayLog ? (
            <>
              <span className="chat-pin-text">
                <small>Today · done ✓</small>
                <b>{day ? `Next: Day ${day}, ${plan.days[day - 1].ref}` : plan.title}</b>
              </span>
              {day && <button className="chat-pin-go ghost" onClick={() => navigate('/circles/read')}>Read ahead</button>}
            </>
          ) : day ? (
            <>
              <span className="chat-pin-text">
                <small>{reminder ? `Past your ${myMembership.reminderTime} reminder` : `Today · Day ${day} of ${plan.days.length} · ${plan.minutes}`}</small>
                <b>{plan.days[day - 1].ref}</b>
              </span>
              <button className="chat-pin-go" onClick={() => navigate('/circles/read')}>Read</button>
            </>
          ) : null}
        </div>
      )}

      {(flagged.length > 0 || checkIns.length > 0) && (
        <div className="chat-guide" role="note">
          <span className="chat-guide-label">For you as guide</span>
          {flagged.map((m) => (
            <div key={m.id} className="chat-guide-row">
              <span><b>{state.users[m.userId]?.name ?? 'A member'}</b> shared something that may mean they're in danger. Please reach out today.</span>
              <a className="chat-guide-btn" href={`#/circles/${encodeURIComponent(dmId(me.id, m.userId))}`}>Message</a>
            </div>
          ))}
          {checkIns.map((m) => (
            <div key={m.user.id} className="chat-guide-row">
              <span><b>{m.user.name}</b> has been quiet for {quietDays(m.membership, today)} days.</span>
              <a
                className="chat-guide-btn"
                href={`#/circles/${encodeURIComponent(dmId(me.id, m.user.id))}?say=${encodeURIComponent(`Missed you the last couple of days, ${firstName(m.user)}. Praying for you. No catching up needed, just come back when you can.`)}`}
              >
                Encourage
              </a>
            </div>
          ))}
        </div>
      )}

      <div className="chat-scroll" ref={scroller}>
        <ol className="chat-log" role="log" aria-live="polite" aria-relevant="additions" aria-label={`Messages in ${dm ? (other?.name ?? 'this chat') : (circle?.name ?? 'this circle')}`}>
          <li className="chat-sys lock">
            🔒{' '}
            {dm
              ? `Private chat between you and ${other?.name ?? 'a former member'}. Only the two of you can see it.`
              : `Messages in ${circle?.name ?? 'this circle'} stay inside the circle. They never appear on the public feed.`}
          </li>
          {welcome && circle && plan && (
            <li className="chat-sys welcome">
              Welcome to {circle.name}. {others.length ? `${others.length} ${others.length === 1 ? 'other is' : 'others are'} reading ${plan.title} with you.` : "You're the first one here. People who join this week will be matched with you."} Show up when you can. Encourage, don't judge.
            </li>
          )}
          {rows.map((r) =>
            r.node === 'divider' ? (
              <li key={r.key} className="chat-day">
                <span>{r.label}</span>
              </li>
            ) : r.node === 'today' ? (
              <Fragment key={r.key}>
                <li className="chat-sys">{todayLine}</li>
                {justRead && <li className="chat-sys done">✓ Day {justRead} done. Your circle can see you showed up.</li>}
              </Fragment>
            ) : (
              <Bubble
                key={r.key}
                m={r.m!}
                cont={r.cont!}
                dm={dm}
                quoted={r.m!.replyToId ? byId.get(r.m!.replyToId) : undefined}
                flash={flash === r.m!.id}
                tick={r.m!.userId === me.id ? tickFor(r.m!, now) : undefined}
                onMenu={() => setSheet({ id: r.m!.id, mode: 'menu' })}
                onWho={() => setSheet({ id: r.m!.id, mode: 'who' })}
                onJump={jumpTo}
                onPressStart={startPress(r.m!.id)}
                onPressEnd={endPress}
              />
            ),
          )}
          {typing && (
            <li className="chat-row-in">
              <span className="chat-typing" aria-label={`${typingName} is typing`}>
                <i />
                <i />
                <i />
              </span>
            </li>
          )}
        </ol>
      </div>

      {myRecentFlag && (
        <div className="cc-crisis standing">
          <CrisisHelp />
        </div>
      )}

      {postable ? (
        <ChatCompose
          key={chatId}
          chatId={chatId}
          members={dm ? [] : others}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          initialDraft={initialDraft}
          today={
            myMembership && plan && !myMembership.finishedOn
              ? { day, readToday: readTodayLog?.day ?? null, onOpen: () => navigate('/circles/read') }
              : undefined
          }
          onSent={simulateReply}
        />
      ) : (
        <p className="chat-readonly muted small">
          {dm ? 'You can message someone while you share a circle with them.' : "You're no longer in this circle. You can still read what was shared."}
        </p>
      )}

      {sheet && sheetMessage && (
        <MessageSheet m={sheetMessage} mode={sheet.mode} memberIds={memberIds} onReply={() => setReplyTo(sheetMessage)} onClose={() => setSheet(null)} />
      )}
    </div>
  );
}

function Bubble({ m, cont, dm, quoted, flash, tick, onMenu, onWho, onJump, onPressStart, onPressEnd }: {
  m: CircleMessage;
  cont: boolean;
  dm: boolean;
  quoted?: CircleMessage;
  flash: boolean;
  tick?: Tick;
  onMenu: () => void;
  onWho: () => void;
  onJump: (id: string) => void;
  onPressStart: (e: ReactPointerEvent) => void;
  onPressEnd: () => void;
}) {
  const { state, me, dispatch } = useStore();
  const mine = m.userId === me.id;
  const author = state.users[m.userId];
  const quotedAuthor = quoted && (quoted.userId === me.id ? 'You' : (state.users[quoted.userId]?.name ?? 'Former member'));
  const praying = m.prayers.includes(me.id);
  // On prayer requests "Praying" has its own button, so leave it out of the reaction pill.
  const shown = REACTIONS.filter((r) => !(m.kind === 'prayer' && r.key === 'pray')).map((r) => ({ ...r, n: reactors(m, r.key).length })).filter((r) => r.n > 0);
  const total = shown.reduce((n, r) => n + r.n, 0);

  return (
    <li id={`msg-${m.id}`} className={`chat-row-${mine ? 'out' : 'in'} ${cont ? 'cont' : ''} ${flash ? 'flash' : ''}`}>
      <div
        className={`bubble ${mine ? 'out' : 'in'} ${cont ? 'cont' : ''} ${m.kind === 'verse' ? 'has-verse' : ''}`}
        onContextMenu={(e) => {
          e.preventDefault();
          onMenu();
        }}
        onPointerDown={onPressStart}
        onPointerUp={onPressEnd}
        onPointerLeave={onPressEnd}
        onPointerCancel={onPressEnd}
        onPointerMove={(e) => (Math.abs(e.movementX) + Math.abs(e.movementY) > 6 ? onPressEnd() : undefined)}
      >
        {!mine && !cont && !dm && (
          <span className="bubble-name" style={{ color: nameColor(m.userId) }}>
            {author?.name ?? 'Former member'}
          </span>
        )}
        {quoted && (
          <button type="button" className="quote" style={{ borderColor: nameColor(quoted.userId) }} onClick={() => onJump(quoted.id)}>
            <b style={{ color: quoted.userId === me.id ? 'var(--gold)' : nameColor(quoted.userId) }}>{quotedAuthor}</b>
            <span>{quoted.verse ? quoted.verse.ref : quoted.text}</span>
          </button>
        )}
        {m.kind === 'prayer' && <span className="bubble-tag prayer">Prayer request</span>}
        {m.kind === 'share' && m.day && <span className="bubble-tag day">Day {m.day}</span>}
        {m.verse && (
          <div className="verse-card">
            <span className="verse-card-ref">{m.verse.ref}{m.verse.bible ? ` · ${m.verse.bible}` : ''}</span>
            <p>{m.verse.text}</p>
          </div>
        )}
        {m.text && (
          <span className="bubble-text">
            <MessageText m={m} users={state.users} />
          </span>
        )}
        <span className="bubble-meta">
          {clock(m.createdAt)}
          {tick && <Ticks tick={tick} />}
        </span>
        <button type="button" className="bubble-more" aria-label="Message options" onClick={onMenu}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>
      {(m.kind === 'prayer' || total > 0) && (
        <div className="bubble-under">
          {m.kind === 'prayer' && (
            <button type="button" className={`praying-btn ${praying ? 'on' : ''}`} aria-pressed={praying} onClick={() => dispatch({ type: 'circlePray', messageId: m.id })}>
              🙏 {praying ? 'Praying' : 'Pray'}
              {m.prayers.length > 0 && <span> · {m.prayers.length}</span>}
            </button>
          )}
          {total > 0 && (
            <button type="button" className="react-pill" onClick={onWho} aria-label={`Reactions: ${shown.map((r) => `${r.n} ${r.label}`).join(', ')}`}>
              {shown.map((r) => (
                <span key={r.key} aria-hidden="true">{r.emoji}</span>
              ))}
              {total > 1 && <span className="react-n">{total}</span>}
            </button>
          )}
        </div>
      )}
    </li>
  );
}

function Ticks({ tick }: { tick: Tick }) {
  const label = tick === 'sent' ? 'Sent' : tick === 'delivered' ? 'Delivered' : 'Seen';
  return (
    <span className={`ticks ${tick}`} role="img" aria-label={label}>
      <svg viewBox="0 0 18 12" width="16" height="11" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {tick === 'sent' ? (
          <path d="M3 6.5l3 3 6.5-7" />
        ) : (
          <>
            <path d="M1 6.5l3 3 6.5-7" />
            <path d="M7.5 9l.5.5 6.5-7" />
          </>
        )}
      </svg>
    </span>
  );
}
