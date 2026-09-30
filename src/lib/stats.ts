import type { AppState, Task } from '../types';
import { addDays, daysBetween, startOfWeek, todayKey } from './dates';
import { pct } from './format';
import { DEFAULT_PHASES, getArcInfo } from './commandArc';

/** Tasks due today or earlier that are not done (overdue included). */
export function todaysTasks(s: AppState): Task[] {
  const today = todayKey();
  return s.tasks.filter((t) => t.dueDate !== null && t.dueDate <= today && t.status !== 'done');
}

export function tasksCompletedOn(s: AppState, date: string): Task[] {
  return s.tasks.filter((t) => t.completedAt?.slice(0, 10) === date);
}

export function weekRange(date = todayKey()): { start: string; end: string } {
  const start = startOfWeek(date);
  return { start, end: addDays(start, 6) };
}

export interface QuickStats {
  savings: number;
  weightNow: number | null;
  weightStart: number | null;
  weightChange: number | null;
  workoutsThisWeek: number;
  workoutsThisMonth: number;
  activeProjects: number;
  tasksCompletedThisWeek: number;
  learningMinutesThisWeek: number;
  tasksDoneToday: number;
  tasksTotalToday: number;
  streak: number;
}

export function getQuickStats(s: AppState): QuickStats {
  const today = todayKey();
  const { start: weekStart } = weekRange(today);
  const monthStart = today.slice(0, 8) + '01';

  const weightNow = s.weights.length ? s.weights[s.weights.length - 1].weight : null;
  const weightStart = s.weights.length ? s.weights[0].weight : null;
  const weightChange = weightNow !== null && weightStart !== null ? weightNow - weightStart : null;

  const workoutsThisWeek = s.workouts.filter((w) => w.date >= weekStart && w.date <= today).length;
  const workoutsThisMonth = s.workouts.filter((w) => w.date >= monthStart && w.date <= today).length;

  const tasksCompletedThisWeek = s.tasks.filter(
    (t) => t.completedAt && t.completedAt.slice(0, 10) >= weekStart && t.completedAt.slice(0, 10) <= today,
  ).length;

  const learningMinutesThisWeek = s.learning
    .filter((l) => l.date >= weekStart && l.date <= today)
    .reduce((sum, l) => sum + l.durationMinutes, 0);

  const tasksDoneToday = s.tasks.filter((t) => t.completedAt?.slice(0, 10) === today).length;
  const open = s.tasks.filter((t) => t.status !== 'done' && t.dueDate !== null && t.dueDate <= today).length;
  const tasksTotalToday = tasksDoneToday + open;

  // Streak: consecutive days (ending today or yesterday) with at least one
  // completed task, workout, learning session or habit check.
  let streak = 0;
  let cursor = today;
  const activeToday =
    tasksDoneToday > 0 ||
    s.workouts.some((w) => w.date === today) ||
    s.learning.some((l) => l.date === today) ||
    s.habitLogs.some((l) => l.date === today);
  if (activeToday) {
    streak++;
    cursor = addDays(today, -1);
  } else {
    cursor = addDays(today, -1);
  }
  for (let i = 0; i < 366; i++) {
    const dayActive =
      s.tasks.some((t) => t.completedAt?.slice(0, 10) === cursor) ||
      s.workouts.some((w) => w.date === cursor) ||
      s.learning.some((l) => l.date === cursor) ||
      s.habitLogs.some((l) => l.date === cursor);
    if (!dayActive) break;
    streak++;
    cursor = addDays(cursor, -1);
  }

  return {
    savings: s.savings.current,
    weightNow,
    weightStart,
    weightChange,
    workoutsThisWeek,
    workoutsThisMonth,
    activeProjects: s.projects.filter((p) => p.status === 'active').length,
    tasksCompletedThisWeek,
    learningMinutesThisWeek,
    tasksDoneToday,
    tasksTotalToday,
    streak,
  };
}

// ─── Progress: measurable completion, transparently broken down ───────────────

export interface ProgressPart {
  label: string;
  pct: number;
  detail: string;
}

export interface ProgressBreakdown {
  total: number;
  parts: ProgressPart[];
}

export function getProgress(s: AppState): ProgressBreakdown {
  const today = todayKey();
  const { start: weekStart } = weekRange(today);
  const arc = getArcInfo(DEFAULT_PHASES);
  const daysElapsed = Math.max(arc.daysCompleted, 1);

  // Daily execution — done tasks vs tasks that have been due so far.
  const dueSoFar = s.tasks.filter((t) => t.dueDate !== null && t.dueDate <= today);
  const doneOfDue = dueSoFar.filter((t) => t.status === 'done').length;
  const dailyPct = pct(doneOfDue, dueSoFar.length);

  // Projects — mean progress of non-archived projects.
  const tracked = s.projects.filter((p) => p.status !== 'archived');
  const projectsPct = tracked.length
    ? Math.round(tracked.reduce((sum, p) => sum + Math.min(100, Math.max(0, p.progress)), 0) / tracked.length)
    : 0;

  // Money — savings against goal (0 if no goal set; marked as such).
  const moneyPct = s.savings.goal > 0 ? pct(s.savings.current, s.savings.goal) : 0;

  // Fitness — workouts per week vs 4/week target, averaged over elapsed arc days.
  const arcStart = s.settings.arcStart;
  const workoutsInArc = s.workouts.filter((w) => w.date >= arcStart && w.date <= today).length;
  const fitnessTarget = (daysElapsed * 4) / 7;
  const fitnessPct = arc.started && fitnessTarget > 0 ? Math.min(100, Math.round((workoutsInArc / fitnessTarget) * 100)) : 0;

  // Learning — hours vs 1h/day target.
  const learningMinutesInArc = s.learning
    .filter((l) => l.date >= arcStart && l.date <= today)
    .reduce((sum, l) => sum + l.durationMinutes, 0);
  const learningPct = arc.started ? Math.min(100, Math.round((learningMinutesInArc / (daysElapsed * 60)) * 100)) : 0;

  // Habits — share of possible habit checks since each habit's creation (capped 60d).
  const habitChecks = s.habits.reduce((sum, h) => {
    const from = h.createdAt.slice(0, 10) > weekStart ? h.createdAt.slice(0, 10) : weekStart;
    const possible = daysBetween(from, today) + 1;
    const done = s.habitLogs.filter((l) => l.habitId === h.id && l.date >= from && l.date <= today).length;
    return sum + (possible > 0 ? Math.min(1, done / possible) : 0);
  }, 0);
  const habitsPct = s.habits.length ? Math.round((habitChecks / s.habits.length) * 100) : 0;

  return {
    total: Math.round((dailyPct + projectsPct + moneyPct + fitnessPct + learningPct + habitsPct) / 6),
    parts: [
      { label: 'Daily execution', pct: dailyPct, detail: `${doneOfDue}/${dueSoFar.length} due tasks done` },
      { label: 'Projects', pct: projectsPct, detail: `${tracked.length} tracked` },
      { label: 'Money', pct: moneyPct, detail: s.savings.goal > 0 ? 'savings vs goal' : 'no goal set' },
      { label: 'Fitness', pct: fitnessPct, detail: `${workoutsInArc} workouts · 4/wk pace` },
      { label: 'Learning', pct: learningPct, detail: `${Math.round(learningMinutesInArc / 60)}h · 1h/day pace` },
      { label: 'Habits', pct: habitsPct, detail: 'this week\u2019s consistency' },
    ],
  };
}
