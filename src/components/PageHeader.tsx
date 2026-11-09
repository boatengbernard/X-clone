import type { ReactNode } from 'react';
import { BackIcon } from './Icons';

export function PageHeader({ title, subtitle, back, children }: { title: string; subtitle?: string; back?: boolean; children?: ReactNode }) {
  return (
    <div className="page-header sticky">
      <div className="page-title">
        {back && (
          <button
            className="icon-btn"
            aria-label="Back"
            onClick={() => (history.length > 1 ? history.back() : (location.hash = '#/home'))}
          >
            <BackIcon />
          </button>
        )}
        <div>
          <h1>{title}</h1>
          {subtitle && <div className="muted small">{subtitle}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}
