import { useState, type ReactNode } from 'react';
import { cx } from '../components/ui';

export function ConfirmDelete({ onConfirm, label }: { onConfirm: () => void; label?: string }) {
  const [armed, setArmed] = useState(false);
  return (
    <button
      className={cx('btn !py-1 text-xs', armed ? 'btn-danger' : 'text-slate-500')}
      onClick={() => {
        if (armed) onConfirm();
        else {
          setArmed(true);
          setTimeout(() => setArmed(false), 2500);
        }
      }}
    >
      {armed ? 'Sure?' : label ?? 'Delete'}
    </button>
  );
}

export function DayCell({ date, children, onClick, dim }: { date: string; children?: ReactNode; onClick?: () => void; dim?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'flex h-full min-h-[72px] flex-col rounded-lg border p-1.5 text-left align-top transition-colors',
        dim ? 'border-transparent opacity-40' : 'border-hollow-line bg-hollow-panel hover:border-accent/50',
      )}
      data-date={date}
    >
      {children}
    </button>
  );
}
