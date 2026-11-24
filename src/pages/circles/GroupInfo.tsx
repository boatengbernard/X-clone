import { useEffect, useState } from 'react';
import { dmId } from '../../circles/chat';
import { localDate } from '../../circles/dates';
import { planById } from '../../circles/plans';
import { needsCheckIn, quietDays, readOn, weekView, type DayState } from '../../circles/progress';
import { Avatar } from '../../components/Avatar';
import { BackIcon } from '../../components/Icons';
import { navigate } from '../../router';
import { useStore } from '../../store';
import { CircleAvatar, firstName } from './chatUi';

const DOT_LABEL: Record<DayState, string> = { read: 'read', grace: 'grace day', missed: 'missed', today: 'not yet today', future: 'still to come', before: 'before joining' };

/** Like WhatsApp's group info: who is in the circle, how their week is going, and your settings. */
export function GroupInfo({ circleId }: { circleId: string }) {
  const { state, me, dispatch } = useStore();
  const [confirmLeave, setConfirmLeave] = useState(false);
  useEffect(() => {
    document.body.classList.add('in-chat');
    return () => document.body.classList.remove('in-chat');
  }, []);
  const circle = state.circles.find((c) => c.id === circleId);
  const mine = state.memberships.find((m) => m.userId === me.id && m.circleId === circleId && m.active);
  const plan = planById(circle?.planId ?? '');
  if (!circle || !plan) return <p className="pad muted">This circle no longer exists.</p>;

  const today = localDate();
  const members = circle.memberIds.flatMap((id) => {
    const membership = state.memberships.find((x) => x.userId === id && x.circleId === circle.id && x.active);
    return state.users[id] && membership ? [{ user: state.users[id], membership }] : [];
  });
  // Guide first, then you, then everyone else by name.
  members.sort((a, b) => Number(b.user.id === circle.guideId) - Number(a.user.id === circle.guideId) || Number(b.user.id === me.id) - Number(a.user.id === me.id) || a.user.name.localeCompare(b.user.name));
  const isGuide = circle.guideId === me.id && Boolean(mine);
  const shared = state.circleMessages.filter((m) => m.circleId === circle.id && (m.kind === 'verse' || m.kind === 'prayer')).length;
  const back = `/circles/${encodeURIComponent(circle.id)}`;

  return (
    <div className="ginfo">
      <header className="chat-head">
        <button className="icon-btn" aria-label="Back to chat" onClick={() => navigate(back)}>
          <BackIcon />
        </button>
        <span className="chat-head-text">
          <strong>Group info</strong>
        </span>
      </header>

      <section className="ginfo-hero">
        <CircleAvatar name={circle.name} size={84} past={!mine} />
        <h1>{circle.name}</h1>
        <p className="muted">
          {plan.title} · {members.length} {members.length === 1 ? 'member' : 'members'}
        </p>
      </section>

      <section className="ginfo-box" aria-labelledby="ginfo-week">
        <h2 id="ginfo-week">This week</h2>
        <ul className="ginfo-members">
          {members.map(({ user, membership }) => {
            const isMe = user.id === me.id;
            const quiet = quietDays(membership, today);
            const status = membership.finishedOn
              ? 'Finished the plan'
              : readOn(membership.reads, today)
                ? 'Read today'
                : isGuide && needsCheckIn(membership, today)
                  ? `Quiet for ${quiet} days`
                  : 'Not yet today';
            const week = weekView(membership, today);
            return (
              <li key={user.id} className="ginfo-member">
                <Avatar user={user} size={40} link={false} />
                <span className="ginfo-member-text">
                  <span>
                    {isMe ? 'You' : user.name}
                    {user.id === circle.guideId && <span className="guide-badge">Guide</span>}
                  </span>
                  <small className={status.startsWith('Quiet') ? 'quiet' : ''}>{status}</small>
                </span>
                <span className="ginfo-dots" role="img" aria-label={`This week: ${week.map((d) => DOT_LABEL[d.state]).join(', ')}`}>
                  {week.map((d) => (
                    <i key={d.date} className={`s-${d.state} ${d.date === today ? 'is-today' : ''}`} />
                  ))}
                </span>
                {(isMe || !mine) && <span className="ginfo-member-actions" aria-hidden="true" />}
                {!isMe && mine && (
                  <span className="ginfo-member-actions">
                    {isGuide && status.startsWith('Quiet') ? (
                      <a
                        className="chat-guide-btn"
                        href={`#/circles/${encodeURIComponent(dmId(me.id, user.id))}?say=${encodeURIComponent(`Missed you the last couple of days, ${firstName(user)}. Praying for you. No catching up needed, just come back when you can.`)}`}
                      >
                        Encourage
                      </a>
                    ) : (
                      <a className="ginfo-msg" href={`#/circles/${encodeURIComponent(dmId(me.id, user.id))}`} aria-label={`Message ${user.name} privately`}>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
                          <path d="M21 11.5a8.4 8.4 0 0 1-12.3 7.4L3 20.5l1.6-5.3A8.4 8.4 0 1 1 21 11.5z" />
                        </svg>
                      </a>
                    )}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
        <p className="ginfo-legend muted small">
          <span><i className="s-read" /> read</span>
          <span><i className="s-grace" /> grace day</span>
          <span><i className="s-missed" /> missed</span>
          Grace days never break your rhythm.
        </p>
      </section>

      {mine && (
        <section className="ginfo-box" aria-label="Your settings">
          <label className="ginfo-row" htmlFor="ginfo-reminder">
            <span>Reading reminder</span>
            <input
              id="ginfo-reminder"
              type="time"
              value={mine.reminderTime}
              onChange={(e) => e.target.value && dispatch({ type: 'circleSettings', prefs: { rhythm: mine.rhythm, nudge: mine.nudge, reminderTime: e.target.value } })}
            />
          </label>
          <div className="ginfo-row">
            <span>Your progress</span>
            <span className="muted">
              {mine.reads.length} of {plan.days.length} read
            </span>
          </div>
          <div className="ginfo-row">
            <span>Verses and prayer requests shared</span>
            <span className="muted">{shared}</span>
          </div>
        </section>
      )}

      <section className="ginfo-box">
        <p className="ginfo-note muted small">🔒 Messages in {circle.name} stay inside the circle and never appear on the public feed. Reported messages go to the guide. Reminders show in Selah when it's open.</p>
        {mine &&
          (confirmLeave ? (
            <div className="ginfo-leave">
              <span>Leave {circle.name}? Your readings stay saved.</span>
              <div>
                <button className="btn btn-outline btn-sm" onClick={() => setConfirmLeave(false)}>
                  Stay
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    dispatch({ type: 'circleLeave' });
                    navigate('/circles');
                  }}
                >
                  Leave circle
                </button>
              </div>
            </div>
          ) : (
            <button className="ginfo-row danger" onClick={() => setConfirmLeave(true)}>
              Leave circle
            </button>
          ))}
      </section>
    </div>
  );
}
