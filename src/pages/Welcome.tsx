import { Composer } from '../components/Composer';
import { navigate } from '../router';
import { useStore } from '../store';

/** First step after sign-up: every member begins with a devotion. */
export function Welcome() {
  const { me } = useStore();
  return (
    <div className="welcome">
      <div className="welcome-head">
        <p className="eyebrow">Welcome, {me.name.split(' ')[0]}</p>
        <h1>Begin with a verse.</h1>
        <p className="muted">
          Your first post on Selah is a devotion. Pick a passage and say how it is speaking to you. It sets the tone before anyone scrolls.
        </p>
      </div>
      <div className="welcome-card">
        <Composer initialKind="devotion" lockKind autoFocus onPosted={() => navigate('/home')} />
      </div>
      <button className="link skip" onClick={() => navigate('/home')}>
        I’ll do this later
      </button>
    </div>
  );
}
