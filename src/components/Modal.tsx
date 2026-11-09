import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export function Modal({ children, onClose, title }: { children: ReactNode; onClose: () => void; title?: string }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
          {title && <h2>{title}</h2>}
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
