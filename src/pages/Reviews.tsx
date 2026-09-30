import { actions, useStore } from '../store/store';
import { Badge, Empty, PageHeader, Panel } from '../components/ui';
import { useModal } from '../components/ModalHost';
import { fmtDate, startOfWeek, todayKey } from '../lib/dates';
import { fmtCents } from '../lib/money';
import { ConfirmDelete } from './shared';

export function ReviewsPage() {
  const state = useStore((s) => s);
  const { open } = useModal();
  const today = todayKey();
  const weekStart = startOfWeek(today);

  const daily = [...state.dailyReviews].sort((a, b) => b.date.localeCompare(a.date));
  const weekly = [...state.weeklyReviews].sort((a, b) => b.weekStart.localeCompare(a.weekStart));
  const todayReview = state.dailyReviews.find((r) => r.date === today);
  const thisWeek = state.weeklyReviews.find((r) => r.weekStart === weekStart);

  return (
    <div>
      <PageHeader
        title="Reviews"
        sub="Daily reflection and weekly review — quick to fill, quick to scan."
        right={
          <div className="flex gap-2">
            <button className="btn" onClick={() => open({ kind: 'daily-review', date: today })}>
              {todayReview ? 'Edit Today’s Review' : '+ Daily Review'}
            </button>
            <button className="btn btn-primary" onClick={() => open({ kind: 'weekly-review' })}>
              {thisWeek ? 'Edit This Week’s Review' : '+ Weekly Review'}
            </button>
          </div>
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Daily reviews">
          {daily.length === 0 ? (
            <Empty>No daily reviews yet. Two minutes tonight is enough.</Empty>
          ) : (
            <ul className="max-h-[560px] divide-y divide-hollow-line overflow-y-auto">
              {daily.map((r) => (
                <li key={r.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-200">{fmtDate(r.date)}</span>
                      <span className="text-[11px] text-slate-500">
                        day {r.dayRating}/5 · energy {r.energy}/5 · focus {r.focus}/5
                      </span>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <button className="btn !py-1 text-xs" onClick={() => open({ kind: 'daily-review', date: r.date })}>Edit</button>
                      <ConfirmDelete onConfirm={() => actions.deleteDailyReview(r.id)} label="✕" />
                    </div>
                  </div>
                  {r.accomplished && <p className="mt-1.5 whitespace-pre-wrap text-xs text-slate-400">{r.accomplished}</p>}
                  {r.learned && <p className="mt-1 text-xs text-slate-500">Learned: {r.learned}</p>}
                  {r.tomorrow && <p className="mt-1 text-xs text-slate-500">Tomorrow: {r.tomorrow}</p>}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Weekly reviews">
          {weekly.length === 0 ? (
            <Empty>No weekly reviews yet. Takes five minutes on Sunday.</Empty>
          ) : (
            <ul className="max-h-[560px] divide-y divide-hollow-line overflow-y-auto">
              {weekly.map((r) => (
                <li key={r.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-200">Week of {fmtDate(r.weekStart)}</span>
                      <Badge>{`${r.workouts} workouts`}</Badge>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <button className="btn !py-1 text-xs" onClick={() => open({ kind: 'weekly-review', weekStart: r.weekStart })}>Edit</button>
                      <ConfirmDelete onConfirm={() => actions.deleteWeeklyReview(r.id)} label="✕" />
                    </div>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-slate-500">
                    <span>Saved {fmtCents(r.moneySaved, state.settings.currency)}</span>
                    <span>Spent {fmtCents(r.moneySpent, state.settings.currency)}</span>
                    <span>{r.learningHours}h learning</span>
                    <span>{r.tasksCompleted} tasks</span>
                  </div>
                  {r.wins && <p className="mt-1.5 whitespace-pre-wrap text-xs text-slate-400">{r.wins}</p>}
                  {r.topObjectives.some(Boolean) && (
                    <p className="mt-1 text-xs text-slate-500">Next: {r.topObjectives.filter(Boolean).join(' · ')}</p>
                  )}
                  {r.mainObstacle && <p className="mt-1 text-xs text-slate-600">Obstacle: {r.mainObstacle}</p>}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
