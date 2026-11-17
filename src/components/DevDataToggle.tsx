import { devFixture } from '../store';

/** Dev-only switch between the demo data and break-ui's stress-test fixtures. Never rendered in production. */
const OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Demo data' },
  { value: 'worst', label: 'Worst case' },
  { value: 'empty', label: 'Empty' },
  { value: 'one', label: 'One' },
  { value: 'huge', label: '1,000 rows' },
];

export function DevDataToggle() {
  const current = devFixture ?? '';
  const pick = (value: string) => {
    const url = new URL(window.location.href);
    if (value) url.searchParams.set('data', value);
    else url.searchParams.delete('data');
    window.location.assign(url.toString());
  };
  return (
    <div
      role="group"
      aria-label="Test data"
      style={{ position: 'fixed', left: '50%', bottom: window.innerWidth < 700 ? 'calc(140px + env(safe-area-inset-bottom, 0px))' : 16, transform: 'translateX(-50%)', zIndex: 1000, display: 'flex', gap: 2, padding: 3, borderRadius: 10, background: '#e5e5e5', boxShadow: '0 1px 4px rgba(0,0,0,.2)', font: '12px/1 system-ui, sans-serif', maxWidth: 'calc(100vw - 16px)', overflowX: 'auto' }}
    >
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={current === o.value}
          onClick={() => pick(o.value)}
          style={{ padding: '7px 10px', borderRadius: 8, whiteSpace: 'nowrap', color: '#111', background: current === o.value ? '#fff' : 'transparent', boxShadow: current === o.value ? '0 1px 2px rgba(0,0,0,.15)' : 'none' }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
