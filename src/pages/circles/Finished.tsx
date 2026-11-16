import { localDate } from '../../circles/dates';
import { PLANS, type Plan } from '../../circles/plans';
import { finishSummary } from '../../circles/progress';
import type { CircleView, Membership } from '../../circles/types';
import { useStore } from '../../store';

export function Finished({ view, membership, plan }: { view: CircleView; membership: Membership; plan: Plan }) {
  const { me, dispatch } = useStore();
  const s = finishSummary(membership);
  const finishedCount = view.members.filter((m) => m.membership.finishedOn).length;
  const prayerCount = view.messages.filter((m) => m.kind === 'prayer').length;
  const nextPlans = PLANS.filter((p) => p.id !== plan.id);

  return (
    <section className="finished">
      <span className="eyebrow">You read the whole {plan.title}</span>
      <div className="big">{plan.days.length}</div>
      <p className="muted">readings over {s.days} days · {s.graceDays} grace {s.graceDays === 1 ? 'day' : 'days'} used</p>
      <div className="note">
        <span className="eyebrow">{view.circle.name}</span>
        <p>{finishedCount} of {view.members.length} have finished. {prayerCount} prayer {prayerCount === 1 ? 'request' : 'requests'} shared along the way.</p>
      </div>
      <h3>Keep going with {view.circle.name}</h3>
      <div className="stack">
        {nextPlans.map((p) => (
          <button key={p.id} className="btn ghost left" onClick={() => dispatch({ type: 'circleNext', planId: p.id, today: localDate() })}>
            Start <b>{p.title}</b> <span className="muted">· {p.days.length} days, {p.minutes}</span>
          </button>
        ))}
      </div>
      {!me.canGuide ? (
        <div className="note calm">
          <p><b>Become a circle guide.</b> You know what it's like to start again. Guides welcome new circles and reach out when someone goes quiet.</p>
          <button className="btn small" onClick={() => dispatch({ type: 'becomeGuide' })}>I'll guide a circle</button>
        </div>
      ) : (
        <p className="muted small">You're a circle guide. You'll guide the next circle you join.</p>
      )}
    </section>
  );
}
