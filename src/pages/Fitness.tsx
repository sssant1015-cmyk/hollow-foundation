import { actions, useStore } from '../store/store';
import { Empty, PageHeader, Panel, StatTile, cx } from '../components/ui';
import { useModal } from '../components/ModalHost';
import { fmtWeight } from '../lib/format';
import { fmtDate, todayKey, startOfWeek } from '../lib/dates';
import { ConfirmDelete } from './shared';

function WeightChart({ points, unit }: { points: { date: string; kg: number }[]; unit: 'kg' | 'lb' }) {
  if (points.length === 0) return <Empty>No weight data yet.</Empty>;
  const W = 560;
  const H = 160;
  const pad = { top: 12, right: 12, bottom: 20, left: 34 };
  const ys = points.map((p) => p.kg);
  const min = Math.min(...ys) - 1;
  const max = Math.max(...ys) + 1;
  const span = Math.max(max - min, 1);
  const x = (i: number) => pad.left + (i / Math.max(points.length - 1, 1)) * (W - pad.left - pad.right);
  const y = (v: number) => pad.top + (1 - (v - min) / span) * (H - pad.top - pad.bottom);
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.kg).toFixed(1)}`).join(' ');
  const area = `${line} L${x(points.length - 1).toFixed(1)},${H - pad.bottom} L${x(0).toFixed(1)},${H - pad.bottom} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Weight progress chart">
      {[0, 0.5, 1].map((f) => {
        const v = min + f * span;
        return (
          <g key={f}>
            <line x1={pad.left} x2={W - pad.right} y1={y(v)} y2={y(v)} stroke="var(--h-line)" strokeWidth="1" />
            <text x={pad.left - 6} y={y(v) + 3} textAnchor="end" fontSize="9" fill="#64748b">
              {unit === 'kg' ? v.toFixed(1) : (v * 2.20462).toFixed(0)}
            </text>
          </g>
        );
      })}
      <path d={area} fill="var(--h-accent)" opacity="0.08" />
      <path d={line} fill="none" stroke="var(--h-accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <circle key={p.date + i} cx={x(i)} cy={y(p.kg)} r="2.5" fill="var(--h-accent)" />
      ))}
      <text x={pad.left} y={H - 6} fontSize="9" fill="#64748b">{fmtDate(points[0].date)}</text>
      <text x={W - pad.right} y={H - 6} textAnchor="end" fontSize="9" fill="#64748b">{fmtDate(points[points.length - 1].date)}</text>
    </svg>
  );
}

export function FitnessPage() {
  const state = useStore((s) => s);
  const { open } = useModal();
  const unit = state.settings.weightUnit;
  const today = todayKey();
  const weekStart = startOfWeek(today);
  const monthStart = today.slice(0, 8) + '01';

  const weights = [...state.weights].sort((a, b) => a.date.localeCompare(b.date));
  const latest = weights[weights.length - 1];
  const first = weights[0];
  const change = latest && first ? latest.weight - first.weight : null;

  const workoutsThisWeek = state.workouts.filter((w) => w.date >= weekStart && w.date <= today).length;
  const workoutsThisMonth = state.workouts.filter((w) => w.date >= monthStart && w.date <= today).length;
  const totalMinutes = state.workouts.reduce((sum, w) => sum + w.durationMinutes, 0);

  const workouts = [...state.workouts].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <PageHeader
        title="Fitness"
        sub="Weight and workout tracking. No health advice — just your numbers."
        right={
          <div className="flex gap-2">
            <button className="btn" onClick={() => open({ kind: 'weight' })}>Log Weight</button>
            <button className="btn btn-primary" onClick={() => open({ kind: 'workout' })}>Log Workout</button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Current weight" value={latest ? fmtWeight(latest.weight, unit) : '—'} sub={latest ? fmtDate(latest.date) : 'no entries'} accent />
        <StatTile label="Starting weight" value={first ? fmtWeight(first.weight, unit) : '—'} sub={first ? fmtDate(first.date) : '—'} />
        <StatTile label="Change" value={change != null ? `${change >= 0 ? '+' : '−'}${Math.abs(change).toFixed(1)} kg` : '—'} sub="since first entry" />
        <StatTile label="Workouts" value={`${workoutsThisWeek} wk / ${workoutsThisMonth} mo`} sub={`${Math.round(totalMinutes / 60)}h all-time`} />
      </div>

      <Panel title="Weight progress" className="mt-5">
        <div className="p-4">
          <WeightChart points={weights.map((w) => ({ date: w.date, kg: w.weight }))} unit={unit} />
        </div>
      </Panel>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel title="Workout log">
          {workouts.length === 0 ? (
            <Empty>No workouts logged yet.</Empty>
          ) : (
            <ul className="max-h-[420px] divide-y divide-hollow-line overflow-y-auto">
              {workouts.map((w) => (
                <li key={w.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-200">{w.type}</span>
                      <span className="text-[11px] text-slate-500">{fmtDate(w.date)}</span>
                    </div>
                    <div className="mt-0.5 text-xs text-slate-500">{w.durationMinutes} min</div>
                    {w.exercises && <p className="mt-1 whitespace-pre-wrap text-xs text-slate-400">{w.exercises}</p>}
                    {w.notes && <p className="mt-1 text-xs text-slate-600">{w.notes}</p>}
                  </div>
                  <ConfirmDelete onConfirm={() => actions.deleteWorkout(w.id)} label="✕" />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Weight log">
          {weights.length === 0 ? (
            <Empty>No weight entries yet.</Empty>
          ) : (
            <ul className="max-h-[420px] divide-y divide-hollow-line overflow-y-auto">
              {[...weights].reverse().map((w) => (
                <li key={w.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <span className="w-24 text-xs text-slate-500">{fmtDate(w.date)}</span>
                  <span className={cx('font-medium tabular-nums text-slate-200')}>{fmtWeight(w.weight, unit)}</span>
                  <span className="min-w-0 flex-1 truncate text-xs text-slate-600">{w.note}</span>
                  <ConfirmDelete onConfirm={() => actions.deleteWeight(w.id)} label="✕" />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
