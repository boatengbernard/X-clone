import { useEffect, useState, type FormEvent } from 'react';
import { localDate } from '../circles/dates';
import { planById } from '../circles/plans';
import { graceLeft, needsCheckIn, nextDay, quietDays, readOn, rhythm, weekView } from '../circles/progress';
import { mentionsCrisis } from '../circles/safety';
import type { CircleMessage, CircleView, MessageKind } from '../circles/types';
import { Avatar } from '../components/Avatar';
import { PageHeader } from '../components/PageHeader';
import { useStore } from '../store';
import type { User } from '../types';
import { timeAgo } from '../utils';
import { Finished } from './circles/Finished';
import { JoinFlow } from './circles/JoinFlow';
import { Reading } from './circles/Reading';
import { CrisisHelp, readingReminder } from './circles/shared';

type Toast = { text: string; crisis: boolean };

export function Circles() {
  const { me, myCircle: view } = useStore();
  const [reading, setReading] = useState<number | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [justJoined, setJustJoined] = useState(false);

  useEffect(() => {
    if (!toast || toast.crisis) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  if (!view)
    return (
      <div className="rc">
        <PageHeader title="Circles" subtitle="Read the Bible daily, together" />
        <JoinFlow onJoined={() => setJustJoined(true)} />
      </div>
    );

  const mine = view.members.find((m) => m.user.id === me.id)?.membership;
  const plan = planById(view.circle.planId);
  if (!mine || !plan) return <p className="pad muted">Loading your circle…</p>;

  if (reading)
    return (
      <div className="rc">
        <Reading
          plan={plan}
          day={reading}
          onBack={() => setReading(null)}
          onDone={(shared) => {
            setReading(null);
            setToast({ text: `Day ${reading} done. Your circle can see you showed up.`, crisis: mentionsCrisis(shared) });
            window.scrollTo(0, 0);
          }}
        />
      </div>
    );

  if (mine.finishedOn)
    return (
      <div className="rc">
        <PageHeader title={view.circle.name} subtitle={plan.title} />
        <Finished view={view} membership={mine} plan={plan} />
      </div>
    );

  return (
    <div className="rc">
      <CircleHome view={view} onRead={setReading} toast={toast} onDismissToast={() => setToast(null)} justJoined={justJoined} />
    </div>
  );
}

function CircleHome({ view, onRead, toast, onDismissToast, justJoined }: {
  view: CircleView;
  onRead: (day: number) => void;
  toast: Toast | null;
  onDismissToast: () => void;
  justJoined: boolean;
}) {
  const { state, me, dispatch } = useStore();
  const today = localDate();
  const { circle, members, messages } = view;
  const plan = planById(circle.planId)!;
  const mine = members.find((m) => m.user.id === me.id)!.membership;
  const day = nextDay(mine.reads, plan.days.length)!;
  const readToday = readOn(mine.reads, today);
  const quiet = quietDays(mine, today);
  const week = weekView(mine, today);
  const grace = graceLeft(mine, today);
  const streak = rhythm(mine, today);
  const readTodayCount = members.filter((m) => readOn(m.membership.reads, today)).length;
  const isGuide = circle.guideId === me.id;
  const guide = members.find((m) => m.user.id === circle.guideId)?.user;
  const reminder = readingReminder(me.id, view);

  const [kind, setKind] = useState<MessageKind>('prayer');
  const [draft, setDraft] = useState('');
  const [confirmLeave, setConfirmLeave] = useState(false);

  function send(e: FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    dispatch({ type: 'circleMessage', kind, text: draft });
    setDraft('');
  }

  const checkIns = isGuide ? members.filter((m) => m.user.id !== me.id && needsCheckIn(m.membership, today)) : [];
  const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const flagged = isGuide ? messages.filter((m) => m.flagged && m.userId !== me.id && m.createdAt > weekAgo) : [];
  const nameOf = (id: string) => members.find((m) => m.user.id === id)?.user;
  const subtitle = `${plan.title} · ${members.length} ${members.length === 1 ? 'member' : 'members'}${guide ? ` · guided by ${guide.id === me.id ? 'you' : guide.name}` : ''}`;

  return (
    <>
      <PageHeader title={circle.name} subtitle={subtitle} />

      {toast && (
        <div className="toast" role="status">
          <span>✓ {toast.text}</span>
          <button className="link" onClick={onDismissToast} aria-label="Dismiss">✕</button>
        </div>
      )}
      {toast?.crisis && <div className="pad"><CrisisHelp /></div>}

      <div className="circle-body">
        <div className="stackavatars" aria-label={`Members: ${members.map((m) => m.user.name).join(', ')}`}>
          {members.slice(0, 8).map((m) => <Avatar key={m.user.id} user={m.user} size={30} />)}
        </div>

        {justJoined && (
          <div className="note warm">
            <span className="eyebrow">You're in</span>
            <p>
              Welcome to {circle.name}.{' '}
              {members.length > 1 ? `${members.length - 1} others are reading ${plan.title} with you.` : "You're the first one here. Others joining this week will be matched with you."}{' '}
              Show up when you can. Encourage, don't judge. What's shared here stays here.
            </p>
          </div>
        )}

        {reminder && !justJoined && <div className="reminder static"><b>It's past your {mine.reminderTime} reminder.</b> Your reading is ready.</div>}

        <section className="week-card" aria-label="This week">
          <div className="week">
            {week.map((d) => (
              <div key={d.date} className="wd">
                <span>{d.letter}</span>
                <span className={`dot s-${d.state} ${d.date === today ? 'is-today' : ''}`} title={d.state}>
                  {d.state === 'read' ? '✓' : d.state === 'grace' ? '~' : ''}
                </span>
              </div>
            ))}
          </div>
          <p className="muted small">
            {streak > 0 ? `${streak}-day rhythm · ` : ''}{grace} grace {grace === 1 ? 'day' : 'days'} left this week · {mine.reads.length} of {plan.days.length} read
          </p>
          <div className="progress"><i style={{ width: `${(mine.reads.length / plan.days.length) * 100}%` }} /></div>
        </section>

        {quiet >= 1 && !readToday && (
          <div className="note warm">
            <h3>Welcome back, {me.name.split(' ')[0]}</h3>
            <p>
              You haven't lost anything. Your {mine.reads.length} {mine.reads.length === 1 ? 'reading is' : 'readings are'} still yours, and you pick up right where you left off at Day {day}. No catching up needed.
            </p>
          </div>
        )}

        <section className="today">
          {readToday ? (
            <>
              <span className="eyebrow">Today</span>
              <h3>Done for today ✓</h3>
              <p className="muted">{readTodayCount} of {members.length} in your circle have read today.</p>
              <button className="btn ghost" onClick={() => onRead(day)}>Read ahead: Day {day}, {plan.days[day - 1].ref}</button>
            </>
          ) : (
            <>
              <span className="eyebrow">Day {day} of {plan.days.length} · {plan.minutes}</span>
              <h3 className="ref">{plan.days[day - 1].ref}</h3>
              <p className="muted">{plan.days[day - 1].question}</p>
              <button className="btn honey" onClick={() => onRead(day)}>Start Day {day}</button>
              <p className="muted small">{readTodayCount} of {members.length} have read today.</p>
            </>
          )}
        </section>

        {(checkIns.length > 0 || flagged.length > 0) && (
          <section className="note guide">
            <span className="eyebrow">For you as guide</span>
            {flagged.map((m) => (
              <p key={m.id}><b>{nameOf(m.userId)?.name}</b> shared something that may mean they're in danger. Please reach out to them personally today.</p>
            ))}
            {checkIns.map((m) => (
              <div key={m.user.id} className="row between">
                <p><b>{m.user.name}</b> has been quiet for {quietDays(m.membership, today)} days.</p>
                <button
                  className="btn small ghost"
                  onClick={() => {
                    setKind('note');
                    setDraft(`@${m.user.handle} missed you the last couple of days. Praying for you. No catch-up needed, just come back.`);
                    document.getElementById('circle-compose')?.focus();
                  }}
                >
                  Encourage
                </button>
              </div>
            ))}
          </section>
        )}

        <form className="circle-compose" onSubmit={send}>
          <div className="chips" role="tablist">
            <button type="button" role="tab" aria-selected={kind === 'prayer'} className={`chip ${kind === 'prayer' ? 'sel' : ''}`} onClick={() => setKind('prayer')}>Ask for prayer</button>
            <button type="button" role="tab" aria-selected={kind === 'note'} className={`chip ${kind === 'note' ? 'sel' : ''}`} onClick={() => setKind('note')}>Encourage someone</button>
          </div>
          <label htmlFor="circle-compose" className="sr-only">Message your circle</label>
          <textarea
            id="circle-compose"
            rows={2}
            maxLength={600}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={kind === 'prayer' ? 'Having a hard week? Tell your circle what to pray for.' : 'Say something kind to your circle'}
          />
          {mentionsCrisis(draft) && <CrisisHelp />}
          <div className="row end"><button className="btn small" disabled={!draft.trim()}>Post to circle</button></div>
        </form>

        <ol className="messages" aria-label="Circle messages">
          {messages.length === 0 && <li className="muted pad">Nothing shared yet. When people finish a reading they can share one line here.</li>}
          {messages.map((m) => (
            <Message
              key={m.id}
              m={m}
              meId={me.id}
              author={state.users[m.userId]}
              onPray={() => dispatch({ type: 'circlePray', messageId: m.id })}
              onReport={() => dispatch({ type: 'circleReport', messageId: m.id })}
            />
          ))}
        </ol>

        <footer className="circle-foot">
          <p className="muted small">Circle posts are private to {circle.name} and never appear on the public feed. Reminders show here and on Home when Selah is open.</p>
          {confirmLeave ? (
            <div className="row">
              <span>Leave {circle.name}? Your readings stay saved.</span>
              <button className="btn small ghost" onClick={() => setConfirmLeave(false)}>Stay</button>
              <button className="btn small danger" onClick={() => dispatch({ type: 'circleLeave' })}>Leave circle</button>
            </div>
          ) : (
            <button className="link" onClick={() => setConfirmLeave(true)}>Leave circle</button>
          )}
        </footer>
      </div>
    </>
  );
}

function Message({ m, meId, author, onPray, onReport }: { m: CircleMessage; meId: string; author?: User; onPray: () => void; onReport: () => void }) {
  const praying = m.prayers.includes(meId);
  const reported = m.reports.includes(meId);
  return (
    <li className="msg">
      {author ? <Avatar user={author} size={32} /> : <span className="avatar" style={{ width: 32, height: 32, background: 'var(--mut)' }} aria-hidden="true" />}
      <div>
        <div className="post-head">
          {author ? <a className="user-name" href={`#/${author.handle}`}>{author.name}</a> : <b>Former member</b>} <span className="muted">· {timeAgo(m.createdAt)}</span>
          {m.kind === 'prayer' && <span className="pill">Prayer request</span>}
          {m.kind === 'share' && m.day && <span className="pill calm">Day {m.day}</span>}
        </div>
        <p>{m.text}</p>
        <div className="row">
          <button className={`pray ${praying ? 'on' : ''}`} onClick={onPray} aria-pressed={praying}>
            🙏 {m.prayers.length || ''} <span>{praying ? 'Praying' : 'Pray'}</span>
          </button>
          {m.userId !== meId && (
            <button className="link small" onClick={onReport} disabled={reported}>{reported ? 'Reported' : 'Report'}</button>
          )}
        </div>
      </div>
    </li>
  );
}
