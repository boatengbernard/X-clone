import { useState } from 'react';
import { Wordmark } from '../components/Layout';
import { navigate } from '../router';
import { hashPassword, useStore } from '../store';
import { TRADITIONS, TRADITION_HINT, type Tradition } from '../types';

const HANDLE_RE = /^[a-z0-9_]{3,15}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Auth({ mode }: { mode: 'signup' | 'login' }) {
  return (
    <div className="auth">
      <div className="auth-side">
        <Wordmark />
        <h1>
          A calm place to share <em>Scripture</em>, sermons and honest questions.
        </h1>
        <ul className="auth-points">
          <li>Free to join. No ads, ever.</li>
          <li>Every tradition welcome, and honest seekers too.</li>
          <li>Each post tells you why you are seeing it.</li>
        </ul>
      </div>
      <div className="auth-main">{mode === 'signup' ? <SignUp /> : <LogIn />}</div>
    </div>
  );
}

function SignUp() {
  const { state, dispatch } = useStore();
  const [form, setForm] = useState({ name: '', handle: '', email: '', password: '', tradition: '' as Tradition | '' });
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const v = k === 'handle' ? e.target.value.toLowerCase().replace(/^@/, '') : e.target.value;
    setForm({ ...form, [k]: v });
    setErrors({ ...errors, [k]: undefined });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const users = Object.values(state.users);
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = 'Enter your name.';
    if (!HANDLE_RE.test(form.handle)) next.handle = 'Use 3–15 lowercase letters, numbers or underscores.';
    else if (users.some((u) => u.handle === form.handle) || ['home', 'explore', 'notifications', 'bookmarks', 'post', 'login', 'signup', 'welcome'].includes(form.handle))
      next.handle = 'That username is taken. Try another.';
    if (!EMAIL_RE.test(form.email.trim())) next.email = 'Enter a valid email address.';
    else if (users.some((u) => u.email?.toLowerCase() === form.email.trim().toLowerCase())) next.email = 'An account already uses this email. Log in instead.';
    if (form.password.length < 8) next.password = 'Use at least 8 characters.';
    if (!form.tradition) next.tradition = 'Choose how you identify. You can change it later.';
    setErrors(next);
    if (Object.keys(next).length || !agree || !form.tradition) return;
    setBusy(true);
    const passwordHash = await hashPassword(form.password, form.email.trim());
    dispatch({ type: 'signup', account: { name: form.name.trim(), handle: form.handle, email: form.email.trim(), passwordHash, tradition: form.tradition } });
    navigate('/welcome');
  };

  return (
    <form className="auth-form" onSubmit={submit} noValidate>
      <h2>Create your account</h2>
      <p className="muted">Anyone can join. It takes about a minute.</p>
      <Field id="su-name" label="Name" error={errors.name}>
        <input id="su-name" value={form.name} onChange={set('name')} autoComplete="name" maxLength={50} />
      </Field>
      <Field id="su-handle" label="Username" error={errors.handle}>
        <div className="prefix-input">
          <span>@</span>
          <input id="su-handle" value={form.handle} onChange={set('handle')} autoComplete="username" maxLength={15} />
        </div>
      </Field>
      <Field id="su-email" label="Email" error={errors.email}>
        <input id="su-email" type="email" value={form.email} onChange={set('email')} autoComplete="email" />
      </Field>
      <Field id="su-password" label="Password" error={errors.password}>
        <input id="su-password" type="password" value={form.password} onChange={set('password')} autoComplete="new-password" />
      </Field>
      <Field id="su-tradition" label="How do you identify?" error={errors.tradition}>
        <select id="su-tradition" value={form.tradition} onChange={set('tradition')}>
          <option value="">Choose one</option>
          {TRADITIONS.map((t) => (
            <option key={t} value={t}>
              {t}
              {TRADITION_HINT[t] ? ` (${TRADITION_HINT[t]})` : ''}
            </option>
          ))}
        </select>
      </Field>
      <label className="check">
        <input id="su-agree" type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
        <span>I agree to treat every member with respect, and to the Terms and Privacy Policy.</span>
      </label>
      <button className="btn btn-primary btn-block" type="submit" disabled={busy || !agree}>
        Create account
      </button>
      <p className="muted small center">
        Already a member? <a className="link" href="#/login">Log in</a>
      </p>
      <p className="muted small center">Preview build: accounts are saved in this browser only.</p>
    </form>
  );
}

function LogIn() {
  const { state, dispatch } = useStore();
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const key = id.trim().toLowerCase().replace(/^@/, '');
    const user = Object.values(state.users).find((u) => u.handle === key || u.email?.toLowerCase() === key);
    if (!user || !user.passwordHash || !user.email || (await hashPassword(password, user.email)) !== user.passwordHash) {
      setError('That email or username and password don’t match. Check them and try again.');
      return;
    }
    dispatch({ type: 'login', userId: user.id });
    navigate('/home');
  };

  const demo = Object.values(state.users).find((u) => u.demo);

  return (
    <form className="auth-form" onSubmit={submit} noValidate>
      <h2>Welcome back</h2>
      <Field id="li-id" label="Email or username">
        <input id="li-id" value={id} onChange={(e) => (setId(e.target.value), setError(''))} autoComplete="username" />
      </Field>
      <Field id="li-password" label="Password">
        <input id="li-password" type="password" value={password} onChange={(e) => (setPassword(e.target.value), setError(''))} autoComplete="current-password" />
      </Field>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button className="btn btn-primary btn-block" type="submit" disabled={!id || !password}>
        Log in
      </button>
      {demo && (
        <button
          type="button"
          className="btn btn-outline btn-block"
          onClick={() => {
            dispatch({ type: 'login', userId: demo.id });
            navigate('/home');
          }}
        >
          Look around with the demo account
        </button>
      )}
      <p className="muted small center">
        New to Selah? <a className="link" href="#/signup">Create an account</a>
      </p>
    </form>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className={`auth-field ${error ? 'has-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {children}
      {error && <span className="error">{error}</span>}
    </div>
  );
}
