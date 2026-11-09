import { useState } from 'react';
import { Modal } from './Modal';

/** In-page confirmation (browser confirm() is blocked in some embeds). */
export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  danger,
  onConfirm,
  onClose,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal onClose={onClose} title={title} small>
      <div className="dialog-body">
        <p className="muted">{body}</p>
        <div className="dialog-actions">
          <button className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

const REASONS = ['Mocking or abuse', 'Harassment of a person', 'Spam or scam', 'Something else'];

export function ReportDialog({ onSubmit, onClose }: { onSubmit: (reason: string) => void; onClose: () => void }) {
  const [reason, setReason] = useState('');
  return (
    <Modal onClose={onClose} title="Report this post" small>
      <div className="dialog-body">
        <p className="muted">
          Moderators review every report. Disagreeing about belief is welcome on Selah, so report only mocking, abuse, harassment or spam.
        </p>
        <fieldset className="radio-list">
          <legend className="sr-only">Reason</legend>
          {REASONS.map((r) => (
            <label key={r} className={reason === r ? 'on' : ''}>
              <input type="radio" name="report-reason" value={r} checked={reason === r} onChange={() => setReason(r)} />
              {r}
            </label>
          ))}
        </fieldset>
        <div className="dialog-actions">
          <button className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            disabled={!reason}
            onClick={() => {
              onSubmit(reason);
              onClose();
            }}
          >
            Send report
          </button>
        </div>
      </div>
    </Modal>
  );
}
