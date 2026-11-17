import { useEffect, useState } from 'react';
import { localDate } from '../../circles/dates';
import { loadPassage, type Verse } from '../../circles/passage';
import { passageLink, type Plan } from '../../circles/plans';
import { mentionsCrisis } from '../../circles/safety';
import { bibleById } from '../../bible';
import { BiblePicker } from '../../components/BiblePicker';
import { useStore } from '../../store';
import { CrisisHelp } from './shared';

export function Reading({ plan, day, onBack, onDone }: { plan: Plan; day: number; onBack: () => void; onDone: (shared: string) => void }) {
  const { dispatch, me } = useStore();
  const bible = bibleById(me.bible);
  const { ref, question } = plan.days[day - 1];
  const [verses, setVerses] = useState<Verse[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [step, setStep] = useState<'read' | 'share'>('read');
  const [share, setShare] = useState('');

  useEffect(() => {
    let live = true;
    setVerses(null);
    setFailed(false);
    loadPassage(ref, bible.id).then((v) => live && setVerses(v), () => live && setFailed(true));
    return () => { live = false; };
  }, [ref, bible.id]);

  function finish(withShare: boolean) {
    const text = withShare ? share.trim() : '';
    dispatch({ type: 'circleRead', day, today: localDate(), share: text });
    onDone(text);
  }

  const multiChapter = verses ? new Set(verses.map((v) => v.chapter)).size > 1 : false;

  return (
    <section className="reading">
      <button className="back" onClick={onBack}>‹ Circle</button>
      <div className="progress" aria-label={`Day ${day} of ${plan.days.length}`}><i style={{ width: `${(day / plan.days.length) * 100}%` }} /></div>
      <span className="eyebrow">Day {day} of {plan.days.length} · {plan.title}</span>
      <h2 className="ref">{ref}</h2>

      {step === 'read' && (
        <>
          {!verses && !failed && <p className="muted">Loading the passage…</p>}
          {failed && (
            <div className="note">
              The passage didn't load. <a href={passageLink(ref, bible.id)} target="_blank" rel="noreferrer">Read {ref} on BibleGateway</a>, then come back and mark it read.
            </div>
          )}
          {verses && (
            <div className="scripture">
              {verses.map((v) => (
                <span key={`${v.chapter}:${v.verse}`}><sup>{multiChapter ? `${v.chapter}:${v.verse}` : v.verse}</sup>{v.text} </span>
              ))}
              <p className="muted small">{bible.name}</p>
            </div>
          )}
          <BiblePicker id="reading-bible" />
          <div className="note calm"><span className="eyebrow">One question</span><p>{question}</p></div>
          <button className="btn honey" onClick={() => setStep('share')}>I've read it</button>
        </>
      )}

      {step === 'share' && (
        <div className="stack">
          <label htmlFor="share" className="legend">Share one line with your circle (optional)</label>
          <p className="muted small">{question}</p>
          <textarea id="share" rows={3} value={share} maxLength={600} onChange={(e) => setShare(e.target.value)} placeholder="A verse that stood out, or how you're really doing" />
          {mentionsCrisis(share) && <CrisisHelp />}
          <button className="btn" disabled={!share.trim()} onClick={() => finish(true)}>Post to circle</button>
          <button className="btn ghost" onClick={() => finish(false)}>Just mark as read</button>
        </div>
      )}
    </section>
  );
}
