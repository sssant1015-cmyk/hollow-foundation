import { useEffect, useRef, useState, type ReactNode } from 'react';

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

export function Panel({
  title,
  right,
  children,
  className,
}: {
  title?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cx('panel flex flex-col', className)}>
      {(title || right) && (
        <header className="flex items-center justify-between gap-3 border-b border-hollow-line px-4 py-2.5">
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{title}</h2>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

export function PageHeader({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-white">{title}</h1>
        {sub && <p className="mt-0.5 text-sm text-slate-500">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
        className ?? 'border-hollow-line bg-hollow-panel2 text-slate-400',
      )}
    >
      {children}
    </span>
  );
}

export function Bar({ pct, className, barClass }: { pct: number; className?: string; barClass?: string }) {
  return (
    <div className={cx('h-1.5 w-full overflow-hidden rounded-full bg-hollow-line', className)}>
      <div
        className={cx('h-full rounded-full bg-accent transition-[width] duration-300', barClass)}
        style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
      />
    </div>
  );
}

export function StatTile({ label, value, sub, accent }: { label: string; value: ReactNode; sub?: ReactNode; accent?: boolean }) {
  return (
    <div className={cx('panel px-4 py-3', accent && 'border-accent/30')}>
      <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{label}</div>
      <div className={cx('mt-1 text-xl font-semibold tabular-nums', accent ? 'text-accent' : 'text-white')}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        className={cx(
          'panel max-h-[92vh] w-full overflow-y-auto rounded-b-none sm:rounded-xl',
          wide ? 'sm:max-w-2xl' : 'sm:max-w-md',
        )}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-hollow-line bg-hollow-panel px-4 py-3">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <button className="btn h-8 w-8 !p-0 text-slate-400" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmButton({
  onConfirm,
  children,
  confirmLabel = 'Click again to confirm',
  className,
}: {
  onConfirm: () => void;
  children: ReactNode;
  confirmLabel?: string;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  return (
    <button
      className={cx(className ?? 'btn', armed && 'btn-danger')}
      onClick={() => {
        if (armed) {
          setArmed(false);
          onConfirm();
        } else {
          setArmed(true);
          timer.current = setTimeout(() => setArmed(false), 2500);
        }
      }}
    >
      {armed ? confirmLabel : children}
    </button>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="px-4 py-8 text-center text-sm text-slate-600">{children}</div>;
}

export function Field({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      {children}
    </div>
  );
}

export function NumberInput({
  value,
  onChange,
  placeholder,
  min,
  step,
  suffix,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  min?: number;
  step?: number | string;
  suffix?: string;
}) {
  return (
    <div className="relative">
      <input
        className="field"
        type="number"
        inputMode="decimal"
        value={value}
        min={min}
        step={step}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">{suffix}</span>
      )}
    </div>
  );
}
