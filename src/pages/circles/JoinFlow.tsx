import { useState } from 'react';
import { localDate } from '../../circles/dates';
import { PLANS } from '../../circles/plans';
import { GRACE_PER_WEEK } from '../../circles/progress';
import type { Nudge, Rhythm } from '../../circles/types';
import { useStore } from '../../store';

const RHYTHMS: { id: Rhythm; label: string; time: string }[] = [
  { id: 'morning', label: 'Early morning', time: '06:30' },
  { id: 'commute', label: 'Commute', time: '08:15' },
  { id: 'lunch', label: 'Lunch', time: '12:30' },
  { id: 'night', label: 'Before bed', time: '21:30' },
];

export function JoinFlow({ onJoined }: { onJoined: () => void }) {
  const { dispatch } = useStore();
  const [step, setStep] = useState<'intro' | 'plan' | 'rhythm'>('intro');
  const [planId, setPlanId] = useState('john-21');
  const [rhythm, setRhythm] = useState<Rhythm>('morning');
  const [reminderTime, setReminderTime] = useState('06:30');
  const [nudge, setNudge] = useState<Nudge>('two-days');

  function join() {
    dispatch({ type: 'circleJoin', planId, prefs: { rhythm, reminderTime, nudge }, today: localDate() });
    onJoined();
  }

  if (step === 'intro')
    return (
      <section className="flow">
        <span className="eyebrow">Reading Circles</span>
        <h2>Read the Bible every day, together</h2>
        <p className="lede">If you keep starting and stopping, you're not alone, and you're not a fake Christian. Join a small circle on the same short plan.</p>
        <ul className="promises">
          <li><b>Small portions.</b> One to eight minutes a day.</li>
          <li><b>Grace days, not broken streaks.</b> {GRACE_PER_WEEK} a week, and your progress never resets.</li>
          <li><b>A circle that notices you.</b> 6–8 people and a guide who reaches out if you go quiet.</li>
          <li><b>Private.</b> What's shared in a circle never appears on the public feed.</li>
        </ul>
        <button className="btn honey" onClick={() => setStep('plan')}>Find a plan</button>
      </section>
    );

  if (step === 'plan')
    return (
      <section className="flow">
        <button className="back" onClick={() => setStep('intro')}>‹ Back</button>
        <h2>Start smaller than you think you need to</h2>
        <div className="plans" role="radiogroup" aria-label="Reading plan">
          {PLANS.map((p) => (
            <button key={p.id} role="radio" aria-checked={planId === p.id} className={`plan ${planId === p.id ? 'sel' : ''}`} onClick={() => setPlanId(p.id)}>
              <span className="plan-top"><b>{p.title}</b>{p.tag && <span className="tag">{p.tag}</span>}</span>
              <span className="muted">{p.days.length} days · {p.minutes}</span>
              <span>{p.blurb}</span>
            </button>
          ))}
        </div>
        <button className="btn" onClick={() => setStep('rhythm')}>Continue with {PLANS.find((p) => p.id === planId)?.title}</button>
      </section>
    );

  return (
    <section className="flow">
      <button className="back" onClick={() => setStep('plan')}>‹ Back</button>
      <h2>Set a rhythm that fits your life</h2>
      <fieldset>
        <legend>When do you usually have a quiet moment?</legend>
        <div className="chips">
          {RHYTHMS.map((r) => (
            <button key={r.id} type="button" className={`chip ${rhythm === r.id ? 'sel' : ''}`} aria-pressed={rhythm === r.id} onClick={() => { setRhythm(r.id); setReminderTime(r.time); }}>
              {r.label}
            </button>
          ))}
        </div>
      </fieldset>
      <label htmlFor="reminder" className="legend">Remind me at</label>
      <input id="reminder" type="time" className="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} />
      <fieldset>
        <legend>How should your circle check in?</legend>
        <div className="chips">
          <button type="button" className={`chip ${nudge === 'two-days' ? 'sel' : ''}`} aria-pressed={nudge === 'two-days'} onClick={() => setNudge('two-days')}>Notice if I miss 2 days</button>
          <button type="button" className={`chip ${nudge === 'ask' ? 'sel' : ''}`} aria-pressed={nudge === 'ask'} onClick={() => setNudge('ask')}>Only if I ask</button>
        </div>
      </fieldset>
      <div className="note calm">
        <b>Grace days:</b> you get {GRACE_PER_WEEK} each week. A missed day uses one, and you always pick up where you left off.
      </div>
      <button className="btn honey" onClick={join}>Find my circle</button>
    </section>
  );
}
