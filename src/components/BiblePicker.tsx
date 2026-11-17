import { BIBLES_BY_LANGUAGE, DEFAULT_BIBLE } from '../bible';
import { useStore } from '../store';

/** Chooses the Bible translation used everywhere Selah shows Scripture to the signed-in member. */
export function BiblePicker({ id, label = 'Translation' }: { id: string; label?: string }) {
  const { me, dispatch } = useStore();
  return (
    <label className="bible-picker" htmlFor={id}>
      <span>{label}</span>
      <select id={id} value={me.bible ?? DEFAULT_BIBLE} onChange={(e) => dispatch({ type: 'updateProfile', patch: { bible: e.target.value } })}>
        {BIBLES_BY_LANGUAGE.map(([language, bibles]) => (
          <optgroup key={language} label={language}>
            {bibles.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.abbr})
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </label>
  );
}
