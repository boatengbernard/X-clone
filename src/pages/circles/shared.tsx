import { localDate } from '../../circles/dates';
import { planById } from '../../circles/plans';
import { nextDay, readOn } from '../../circles/progress';
import { CRISIS_HELP } from '../../circles/safety';
import type { CircleView } from '../../circles/types';

export function CrisisHelp() {
  return (
    <div className="crisis" role="alert">
      <strong>You matter, and you don't have to carry this alone.</strong>
      <p>Your circle guide will see this and reach out. Please also talk to someone right now:</p>
      <ul>
        {CRISIS_HELP.map((h) => (
          <li key={h.label}>
            <b>{h.label}:</b> {h.detail}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** "Day 6: John 6" once the member's reminder time has passed and they haven't read today. */
// eslint-disable-next-line react-refresh/only-export-components
export function readingReminder(meId: string, view: CircleView | null): string | null {
  const m = view?.members.find((x) => x.user.id === meId)?.membership;
  if (!m || m.finishedOn) return null;
  const today = localDate();
  if (readOn(m.reads, today)) return null;
  const now = new Date();
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  if (hhmm < m.reminderTime) return null;
  const plan = planById(m.planId);
  const day = plan && nextDay(m.reads, plan.days.length);
  return plan && day ? `Day ${day}: ${plan.days[day - 1].ref}` : null;
}
