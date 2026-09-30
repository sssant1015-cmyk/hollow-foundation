import { useStore } from '../store/store';
import { Badge, Bar, PageHeader, Panel, cx } from '../components/ui';
import { fmtDate, todayKey, addDays, daysBetween } from '../lib/dates';
import { DEFAULT_PHASES, getArcInfo, phaseOfDay } from '../lib/winterArc';

export function WinterArcPage() {
  const state = useStore((s) => s);
  const today = todayKey();
  const arc = getArcInfo(DEFAULT_PHASES);

  // 35-day rolling day grid around today for a sense of momentum.
  const gridStart = addDays(today, -20);
  const gridDays = Array.from({ length: 35 }, (_, i) => addDays(gridStart, i));

  const activeOn = (date: string) =>
    state.tasks.some((t) => t.completedAt?.slice(0, 10) === date) ||
    state.workouts.some((w) => w.date === date) ||
    state.learning.some((l) => l.date === date) ||
    state.habitLogs.some((l) => l.date === date);

  return (
    <div>
      <PageHeader
        title="Winter Arc"
        sub={`${fmtDate(DEFAULT_PHASES[0].start)} → ${fmtDate(DEFAULT_PHASES[DEFAULT_PHASES.length - 1].end)}`}
        right={
          <Badge className={arc.started && !arc.finished ? 'border-accent/40 bg-accent/10 text-accent' : ''}>
            {arc.finished ? 'Complete' : arc.started ? `Day ${arc.currentDay} of ${arc.totalDays}` : `Begins in ${daysBetween(today, DEFAULT_PHASES[0].start)} days`}
          </Badge>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Overview">
          <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4">
            {[
              { label: 'Days completed', value: `${arc.daysCompleted}`, sub: `of ${arc.totalDays}` },
              { label: 'Days remaining', value: `${arc.daysRemaining}`, sub: arc.finished ? 'done' : 'to execute' },
              { label: 'Completion', value: `${arc.completionPct}%`, sub: 'time elapsed' },
              { label: 'Current phase', value: arc.currentPhase ? `Phase ${arc.currentPhase.n}` : '—', sub: arc.currentPhase?.name ?? 'not started' },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{s.label}</div>
                <div className="mt-1 text-2xl font-semibold tabular-nums text-white">{s.value}</div>
                <div className="text-xs text-slate-500">{s.sub}</div>
              </div>
            ))}
          </div>
          <div className="px-4 pb-4">
            <Bar pct={arc.completionPct} className="h-2" />
            <p className="mt-2 text-xs text-slate-500">
              Current project: {state.projects.find((p) => p.status === 'active')?.name ?? 'none active'} ·
              Weekly focus lives in <span className="text-slate-400">Reviews → Weekly Review</span>.
            </p>
          </div>
        </Panel>

        <Panel title="Momentum">
          <div className="p-4">
            <div className="grid grid-cols-7 gap-1">
              {gridDays.map((d) => {
                const active = activeOn(d);
                const isToday = d === today;
                const inArc = d >= DEFAULT_PHASES[0].start && d <= DEFAULT_PHASES[DEFAULT_PHASES.length - 1].end;
                return (
                  <div
                    key={d}
                    title={d}
                    className={cx(
                      'flex aspect-square items-center justify-center rounded text-[10px] tabular-nums',
                      active ? 'bg-good/25 text-good' : 'bg-hollow-panel2 text-slate-700',
                      isToday && 'ring-1 ring-accent',
                      !inArc && 'opacity-40',
                    )}
                  >
                    {Number(d.slice(8, 10))}
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Green = a day with logged execution (task, workout, learning or habit).
            </p>
          </div>
        </Panel>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {DEFAULT_PHASES.map((p) => {
          const isCurrent = arc.currentPhase?.n === p.n;
          const isPast = p.end < today;
          const { day, of } = phaseOfDay(p);
          return (
            <Panel key={p.n} className={cx(isCurrent && 'border-accent/40')}>
              <div className="flex items-center justify-between p-4 pb-2">
                <div className="flex items-center gap-3">
                  <span className={cx(
                    'flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-semibold tabular-nums',
                    isCurrent ? 'border-accent/50 bg-accent/15 text-accent' : isPast ? 'border-hollow-line text-slate-600' : 'border-hollow-line text-slate-400',
                  )}>
                    {p.n}
                  </span>
                  <div>
                    <div className={cx('text-sm font-semibold', isCurrent ? 'text-white' : 'text-slate-300')}>{p.name}</div>
                    <div className="text-[11px] text-slate-500">{fmtDate(p.start)} → {fmtDate(p.end)}</div>
                  </div>
                </div>
                {isCurrent && <Badge className="border-accent/40 bg-accent/10 text-accent">Current · day {day}/{of}</Badge>}
                {isPast && <Badge>Done</Badge>}
              </div>
              <div className="px-4 pb-4">
                <Bar
                  pct={isPast ? 100 : isCurrent ? (day / of) * 100 : 0}
                  barClass={isCurrent ? undefined : isPast ? 'bg-slate-600' : 'bg-hollow-line'}
                />
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
