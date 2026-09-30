import { actions, useStore } from '../store/store';
import { Badge, Bar, Empty, Panel, StatTile, cx } from '../components/ui';
import { useModal } from '../components/ModalHost';
import { CATEGORY_LABEL, PRIORITY_CLASS, PRIORITY_LABEL, fmtHours } from '../lib/format';
import { fmtDate, fmtLong, todayKey } from '../lib/dates';
import { fmtCents } from '../lib/money';
import { DEFAULT_PHASES, getArcInfo } from '../lib/commandArc';
import { getProgress, getQuickStats, todaysTasks, weekRange } from '../lib/stats';
import { navigate } from '../lib/router';
import type { Task } from '../types';

function TaskRow({ task }: { task: Task }) {
  const overdue = task.dueDate !== null && task.dueDate < todayKey();
  return (
    <li className="flex items-center gap-3 px-4 py-2.5">
      <button
        onClick={() => actions.toggleTask(task.id)}
        aria-label="Complete task"
        className={cx(
          'h-[18px] w-[18px] shrink-0 rounded border transition-colors',
          task.status === 'done' ? 'border-good bg-good/20 text-good' : 'border-hollow-line hover:border-accent',
        )}
      >
        {task.status === 'done' && <span className="block text-center text-[10px] leading-[16px]">✓</span>}
      </button>
      <div className="min-w-0 flex-1">
        <div className={cx('truncate text-sm', task.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-200')}>
          {task.title}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
          <span>{CATEGORY_LABEL[task.category]}</span>
          {task.dueDate && <span className={overdue ? 'text-bad' : ''}>{overdue ? 'overdue · ' : ''}{fmtDate(task.dueDate)}</span>}
          {task.estimatedMinutes != null && <span>~{task.estimatedMinutes}m</span>}
        </div>
      </div>
      <Badge className={PRIORITY_CLASS[task.priority]}>{PRIORITY_LABEL[task.priority]}</Badge>
    </li>
  );
}

export function Dashboard() {
  const state = useStore((s) => s);
  const { open } = useModal();
  const today = todayKey();
  const arc = getArcInfo(DEFAULT_PHASES);
  const stats = getQuickStats(state);
  const progress = getProgress(state);
  const due = todaysTasks(state).sort((a, b) => a.priority.localeCompare(b.priority));
  const doneToday = state.tasks.filter((t) => t.completedAt?.slice(0, 10) === today);
  const { start: weekStart } = weekRange(today);
  const activeProjects = state.projects.filter((p) => p.status === 'active');
  const currentProject = activeProjects[0];
  const lastReview = [...state.dailyReviews].sort((a, b) => b.date.localeCompare(a.date)).find((r) => r.date <= today);

  const quick = (kind: Parameters<typeof open>[0]['kind'], label: string) => (
    <button key={kind} className="btn justify-start" onClick={() => open({ kind })}>
      {label}
    </button>
  );

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">Hollow Foundation</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {fmtLong(today)} · {state.settings.name}
          </p>
        </div>
        <Badge className="border-accent/40 bg-accent/10 text-accent">
          {arc.finished ? 'Arc complete' : arc.started ? `Command Arc · Day ${arc.currentDay}/${arc.totalDays}` : `Arc starts ${fmtDate(DEFAULT_PHASES[0].start)}`}
        </Badge>
      </header>

      {/* Winter Arc banner */}
      <Panel className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 p-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Command Arc Progress</div>
            <div className="mt-1 flex items-baseline gap-3">
              <span className="text-3xl font-semibold tabular-nums text-accent sm:text-4xl">{progress.total}%</span>
              <span className="text-sm text-slate-500">
                Phase {arc.currentPhase?.n ?? '—'} · {arc.currentPhase?.name ?? (arc.finished ? 'Complete' : 'Not started')}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm sm:gap-6">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500">Day</div>
              <div className="mt-0.5 font-semibold tabular-nums text-white">{arc.started ? `${arc.currentDay}/${arc.totalDays}` : '—'}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500">Remaining</div>
              <div className="mt-0.5 font-semibold tabular-nums text-white">{arc.daysRemaining}d</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-widest text-slate-500">Streak</div>
              <div className="mt-0.5 font-semibold tabular-nums text-good">{stats.streak}d</div>
            </div>
          </div>
        </div>
        <Bar pct={arc.completionPct} className="h-1 rounded-none" />
        <div className="flex items-center justify-between px-4 py-2 text-xs text-slate-500">
          <span>
            {arc.started ? `Days completed: ${arc.daysCompleted}` : `Starts ${fmtDate(DEFAULT_PHASES[0].start)}`}
            {currentProject && <> · Current project: <button className="text-accent hover:underline" onClick={() => navigate('projects')}>{currentProject.name}</button></>}
          </span>
          <button className="text-accent hover:underline" onClick={() => navigate('arc')}>Command Arc →</button>
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Today */}
        <Panel
          className="lg:col-span-2"
          title="Today"
          right={
            <button className="btn btn-primary !py-1 !px-2.5 text-xs" onClick={() => open({ kind: 'task' })}>+ Add Task</button>
          }
        >
          <div className="flex items-center justify-between border-b border-hollow-line px-4 py-2 text-xs text-slate-500">
            <span>{due.length} open · {doneToday.length} completed</span>
            <div className="flex items-center gap-2">
              <Bar pct={stats.tasksTotalToday ? (stats.tasksDoneToday / stats.tasksTotalToday) * 100 : 0} className="h-1 w-24" />
              <span className="tabular-nums">
                {stats.tasksTotalToday ? Math.round((stats.tasksDoneToday / stats.tasksTotalToday) * 100) : 0}%
              </span>
            </div>
          </div>
          {due.length === 0 && doneToday.length === 0 ? (
            <Empty>
              Nothing scheduled for today.{' '}
              <button className="text-accent hover:underline" onClick={() => open({ kind: 'task' })}>Add your first task</button>
            </Empty>
          ) : (
            <ul className="divide-y divide-hollow-line">
              {due.map((t) => <TaskRow key={t.id} task={t} />)}
              {doneToday.length > 0 && (
                <li className="px-4 pt-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Completed today</li>
              )}
              {doneToday.map((t) => <TaskRow key={t.id} task={t} />)}
            </ul>
          )}
        </Panel>

        {/* Quick actions */}
        <Panel title="Quick Actions">
          <div className="grid grid-cols-2 gap-2 p-3">
            {quick('task', '+ Task')}
            {quick('expense', '− Expense')}
            {quick('income', '+ Income')}
            {quick('workout', 'Workout')}
            {quick('weight', 'Weight')}
            {quick('learning', 'Learning')}
            {quick('project', 'Project')}
            {quick('daily-review', 'Daily Review')}
            {quick('seed', 'Save Seed')}
          </div>
          <div className="border-t border-hollow-line p-3">
            <button className="btn w-full" onClick={() => open({ kind: 'weekly-review' })}>
              Complete Weekly Review
            </button>
          </div>
        </Panel>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Savings" value={fmtCents(state.savings.current, state.settings.currency)} sub={state.savings.goal > 0 ? `goal ${fmtCents(state.savings.goal, state.settings.currency)}` : 'no goal set'} />
        <StatTile label="Weight" value={stats.weightNow != null ? `${stats.weightNow.toFixed(1)} ${state.settings.weightUnit}` : '—'} sub={stats.weightChange != null ? `${stats.weightChange >= 0 ? '+' : ''}${stats.weightChange.toFixed(1)} kg total` : 'no entries'} />
        <StatTile label="Gym this week" value={stats.workoutsThisWeek} sub={`${stats.workoutsThisMonth} this month`} />
        <StatTile label="Active projects" value={stats.activeProjects} sub={`${state.projects.length} total`} />
        <StatTile label="Tasks this week" value={stats.tasksCompletedThisWeek} sub="completed" />
        <StatTile label="Learning this week" value={fmtHours(stats.learningMinutesThisWeek)} sub="logged" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Progress breakdown */}
        <Panel title="Progress Breakdown" className="lg:col-span-2">
          <div className="space-y-3 p-4">
            {progress.parts.map((p) => (
              <div key={p.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-slate-300">{p.label}</span>
                  <span className="tabular-nums text-slate-500">{p.pct}% · {p.detail}</span>
                </div>
                <Bar pct={p.pct} barClass={p.pct >= 70 ? 'bg-good' : p.pct >= 30 ? 'bg-accent' : 'bg-slate-600'} />
              </div>
            ))}
            <p className="pt-1 text-[11px] text-slate-600">
              Transparent math: due-task completion, project progress, savings goal, 4 workouts/week pace, 1h/day learning pace, weekly habit consistency.
            </p>
          </div>
        </Panel>

        {/* Yesterday / reviews */}
        <Panel title="Yesterday" right={<button className="text-xs text-accent hover:underline" onClick={() => navigate('reviews')}>Reviews →</button>}>
          {lastReview ? (
            <div className="space-y-2 p-4 text-sm">
              <div className="text-xs text-slate-500">{fmtDate(lastReview.date)} · day {lastReview.dayRating}/5 · energy {lastReview.energy}/5 · focus {lastReview.focus}/5</div>
              <p className="whitespace-pre-wrap text-slate-300">{lastReview.accomplished || '—'}</p>
              {lastReview.tomorrow && (
                <div className="border-t border-hollow-line pt-2">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">Planned for tomorrow</div>
                  <p className="mt-1 whitespace-pre-wrap text-slate-400">{lastReview.tomorrow}</p>
                </div>
              )}
            </div>
          ) : (
            <Empty>
              No reviews yet.{' '}
              <button className="text-accent hover:underline" onClick={() => open({ kind: 'daily-review', date: today })}>Do tonight's review</button>
            </Empty>
          )}
        </Panel>
      </div>

      <div className="text-[11px] text-slate-600">Week of {fmtDate(weekStart)} · data stored locally in this browser</div>
    </div>
  );
}
