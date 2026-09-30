import { useMemo, useState, type ReactNode } from 'react';
import { useStore } from '../store/store';
import { Badge, Empty, PageHeader, Panel, cx } from '../components/ui';
import { EXPENSE_CATEGORY_LABEL } from '../lib/format';
import { fmtCents } from '../lib/money';
import { fmtLong, fmtMonth, monthGrid, todayKey } from '../lib/dates';

interface DayActivity {
  tasks: { id: string; title: string; done: boolean }[];
  workouts: { id: string; type: string; minutes: number }[];
  learning: { id: string; subject: string; minutes: number }[];
  income: { id: string; label: string; cents: number }[];
  expenses: { id: string; label: string; cents: number }[];
  reviews: { id: string; kind: 'daily' | 'weekly' }[];
  milestones: { id: string; project: string; milestone: string }[];
}

export function CalendarPage() {
  const state = useStore((s) => s);
  const today = todayKey();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [selected, setSelected] = useState<string | null>(today);

  const grid = useMemo(() => monthGrid(cursor.y, cursor.m), [cursor]);

  const activityFor = (date: string): DayActivity => {
    const tasks = state.tasks
      .filter((t) => (t.dueDate === date && t.status !== 'done') || t.completedAt?.slice(0, 10) === date)
      .map((t) => ({ id: t.id, title: t.title, done: t.status === 'done' }));
    const workouts = state.workouts
      .filter((w) => w.date === date)
      .map((w) => ({ id: w.id, type: w.type, minutes: w.durationMinutes }));
    const learning = state.learning
      .filter((l) => l.date === date)
      .map((l) => ({ id: l.id, subject: l.subject, minutes: l.durationMinutes }));
    const income = state.income.filter((i) => i.date === date).map((i) => ({ id: i.id, label: i.source, cents: i.amount }));
    const expenses = state.expenses
      .filter((e) => e.date === date)
      .map((e) => ({ id: e.id, label: EXPENSE_CATEGORY_LABEL[e.category], cents: e.amount }));
    const reviews = [
      ...state.dailyReviews.filter((r) => r.date === date).map((r) => ({ id: r.id, kind: 'daily' as const })),
      ...state.weeklyReviews.filter((r) => date >= r.weekStart && date <= r.weekEnd).map((r) => ({ id: r.id, kind: 'weekly' as const })),
    ];
    const milestones = state.projects
      .filter((p) => p.targetDate === date && p.currentMilestone)
      .map((p) => ({ id: p.id, project: p.name, milestone: p.currentMilestone }));
    return { tasks, workouts, learning, income, expenses, reviews, milestones };
  };

  const sel = selected ? activityFor(selected) : null;
  const isCurrentMonth = cursor.y === new Date().getFullYear() && cursor.m === new Date().getMonth();

  const shift = (delta: number) => {
    setCursor((c) => {
      const d = new Date(c.y, c.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  };

  return (
    <div>
      <PageHeader
        title="Calendar"
        sub="Tasks, workouts, learning, money, reviews and milestones by day."
        right={
          <div className="flex items-center gap-2">
            <button className="btn !px-2.5" onClick={() => shift(-1)}>‹</button>
            <span className="min-w-[130px] text-center text-sm font-medium text-slate-300">{fmtMonth(cursor.y, cursor.m)}</span>
            <button className="btn !px-2.5" onClick={() => shift(1)}>›</button>
            {!isCurrentMonth && (
              <button className="btn !py-1 text-xs" onClick={() => { const d = new Date(); setCursor({ y: d.getFullYear(), m: d.getMonth() }); setSelected(today); }}>
                Today
              </button>
            )}
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <div className="grid grid-cols-7 border-b border-hollow-line text-center text-[10px] font-semibold uppercase tracking-wider text-slate-600">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
              <div key={d} className="py-1.5">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px bg-hollow-line">
            {grid.flat().map((date, i) => {
              if (date === null) return <div key={`empty-${i}`} className="bg-hollow-bg" />;
              const a = activityFor(date);
              const count = a.tasks.length + a.workouts.length + a.learning.length + a.income.length + a.expenses.length + a.reviews.length + a.milestones.length;
              return (
                <button
                  key={date}
                  onClick={() => setSelected(date)}
                  className={cx(
                    'relative min-h-[64px] bg-hollow-panel p-1.5 text-left transition-colors hover:bg-hollow-panel2',
                    selected === date && 'ring-1 ring-inset ring-accent',
                    date === today && 'bg-hollow-panel2',
                  )}
                >
                  <span className={cx('text-[11px] tabular-nums', date === today ? 'font-bold text-accent' : 'text-slate-500')}>
                    {Number(date.slice(8, 10))}
                  </span>
                  <div className="mt-1 flex flex-wrap gap-0.5">
                    {a.tasks.some((t) => !t.done) && <span className="h-1.5 w-1.5 rounded-full bg-warn" title="Open tasks" />}
                    {a.tasks.some((t) => t.done) && <span className="h-1.5 w-1.5 rounded-full bg-good" title="Completed tasks" />}
                    {a.workouts.length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-bad" title="Workouts" />}
                    {a.learning.length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-accent" title="Learning" />}
                    {a.income.length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-good/60" title="Income" />}
                    {a.expenses.length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-slate-500" title="Expenses" />}
                    {a.reviews.length > 0 && <span className="h-1.5 w-1.5 rounded-full border border-accent" title="Reviews" />}
                    {a.milestones.length > 0 && <span className="h-1.5 w-1.5 rotate-45 bg-accent" title="Milestone" />}
                  </div>
                  {count > 0 && <span className="absolute bottom-1 right-1.5 text-[9px] text-slate-600">{count}</span>}
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel title={selected ? fmtLong(selected) : 'Select a day'}>
          {!sel || !selected ? (
            <Empty>Click a date to see that day's activity.</Empty>
          ) : (
            <div className="space-y-4 p-4 text-sm">
              <Section title="Tasks">
                {sel.tasks.length === 0 ? (
                  <Muted>None</Muted>
                ) : (
                  sel.tasks.map((t) => (
                    <div key={t.id} className="flex items-center gap-2">
                      <span className={cx('h-1.5 w-1.5 rounded-full', t.done ? 'bg-good' : 'bg-warn')} />
                      <span className={cx('truncate', t.done ? 'text-slate-500 line-through' : 'text-slate-300')}>{t.title}</span>
                    </div>
                  ))
                )}
              </Section>
              <Section title="Workouts">
                {sel.workouts.length === 0 ? <Muted>None</Muted> : sel.workouts.map((w) => (
                  <div key={w.id} className="text-slate-300">{w.type} · {w.minutes} min</div>
                ))}
              </Section>
              <Section title="Learning">
                {sel.learning.length === 0 ? <Muted>None</Muted> : sel.learning.map((l) => (
                  <div key={l.id} className="text-slate-300">{l.subject} · {l.minutes} min</div>
                ))}
              </Section>
              <Section title="Money">
                {sel.income.length === 0 && sel.expenses.length === 0 ? (
                  <Muted>None</Muted>
                ) : (
                  <>
                    {sel.income.map((i) => (
                      <div key={i.id} className="text-good">+{fmtCents(i.cents, state.settings.currency)} · {i.label}</div>
                    ))}
                    {sel.expenses.map((e) => (
                      <div key={e.id} className="text-slate-300">−{fmtCents(e.cents, state.settings.currency)} · {e.label}</div>
                    ))}
                  </>
                )}
              </Section>
              <Section title="Reviews">
                {sel.reviews.length === 0 ? <Muted>None</Muted> : sel.reviews.map((r) => (
                  <div key={r.id} className="text-slate-300">{r.kind === 'daily' ? 'Daily review' : 'Weekly review'}</div>
                ))}
              </Section>
              <Section title="Milestones">
                {sel.milestones.length === 0 ? <Muted>None</Muted> : sel.milestones.map((m) => (
                  <div key={m.id} className="text-slate-300">
                    <Badge className="mr-1.5 border-accent/30 bg-accent/10 text-accent">{m.project}</Badge>
                    {m.milestone}
                  </div>
                ))}
              </Section>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600">{title}</div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Muted({ children }: { children: ReactNode }) {
  return <div className="text-xs text-slate-600">{children}</div>;
}
