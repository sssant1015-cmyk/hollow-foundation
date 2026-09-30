import type { AppState } from '../types';
import { EXPENSE_CATEGORY_LABEL, fmtHours } from '../lib/format';
import { fmtDate, todayKey } from '../lib/dates';
import { fmtCents } from '../lib/money';
import { DEFAULT_PHASES, getArcInfo } from '../lib/commandArc';
import { getProgress, weekRange } from '../lib/stats';

/** Compact, token-efficient snapshot of the user's current state. */
export function buildContext(s: AppState): string {
  const today = todayKey();
  const arc = getArcInfo(DEFAULT_PHASES);
  const progress = getProgress(s);
  const { start: weekStart } = weekRange(today);
  const cur = s.settings.currency;
  const monthStart = today.slice(0, 8) + '01';

  const openToday = s.tasks.filter((t) => t.dueDate !== null && t.dueDate <= today && t.status !== 'done');
  const doneToday = s.tasks.filter((t) => t.completedAt?.slice(0, 10) === today);
  const doneThisWeek = s.tasks.filter((t) => {
    const d = t.completedAt?.slice(0, 10);
    return d && d >= weekStart && d <= today;
  });

  const workoutsWeek = s.workouts.filter((w) => w.date >= weekStart && w.date <= today);
  const learningWeekMin = s.learning
    .filter((l) => l.date >= weekStart && l.date <= today)
    .reduce((sum, l) => sum + l.durationMinutes, 0);
  const savedMonth = s.expenses
    .filter((e) => e.date >= monthStart && e.date <= today && e.category === 'savings')
    .reduce((sum, e) => sum + e.amount, 0);
  const spentWeek = s.expenses
    .filter((e) => e.date >= weekStart && e.date <= today && e.category !== 'savings')
    .reduce((sum, e) => sum + e.amount, 0);

  const byCat = Object.entries(
    s.expenses
      .filter((e) => e.date >= weekStart)
      .reduce<Record<string, number>>((acc, e) => {
        acc[e.category] = (acc[e.category] ?? 0) + e.amount;
        return acc;
      }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([c, cents]) => `${EXPENSE_CATEGORY_LABEL[c as keyof typeof EXPENSE_CATEGORY_LABEL]} ${fmtCents(cents, cur)}`)
    .join(', ');

  const openProjects = s.projects.filter((p) => p.status === 'active' || p.status === 'planned').slice(0, 6);
  const lastReview = [...s.dailyReviews].sort((a, b) => b.date.localeCompare(a.date))[0];
  const weekReview = s.weeklyReviews.find((r) => r.weekStart === weekStart);

  const lines: string[] = [
    `TODAY: ${fmtDate(today)} (arc day ${arc.started ? arc.currentDay : 'pre-arc'})`,
    `PHASE: ${arc.currentPhase ? `Phase ${arc.currentPhase.n} ${arc.currentPhase.name}` : arc.started ? 'between phases' : `starts ${fmtDate(DEFAULT_PHASES[0].start)}`}`,
    `PROGRESS: ${progress.total}% overall (${progress.parts.map((p) => `${p.label} ${p.pct}%`).join(', ')})`,
    `TASKS TODAY: ${doneToday.length} done, ${openToday.length} open${openToday.length ? ` — ${openToday.slice(0, 6).map((t) => `"${t.title}" (${t.priority})`).join('; ')}` : ''}`,
    `WEEK: ${doneThisWeek.length} tasks done, ${workoutsWeek.length} workouts, ${fmtHours(learningWeekMin)} learning`,
    `MONEY: savings ${fmtCents(s.savings.current, cur)}${s.savings.goal > 0 ? ` of ${fmtCents(s.savings.goal, cur)} goal` : ' (no goal)'}; spent this week ${fmtCents(spentWeek, cur)}; saved this month ${fmtCents(savedMonth, cur)}${byCat ? `; top categories: ${byCat}` : ''}`,
    `WEIGHT: ${s.weights.length ? `${s.weights[s.weights.length - 1].weight}kg latest of ${s.weights.length} entries` : 'no data'}`,
    `PROJECTS: ${openProjects.map((p) => `${p.name} (${p.status}${p.progress ? `, ${p.progress}%` : ''})`).join('; ') || 'none'}`,
    `HABITS: ${s.habits.map((h) => `${h.name}${s.habitLogs.some((l) => l.habitId === h.id && l.date === today) ? ' ✓today' : ''}`).join('; ') || 'none'}`,
  ];

  if (lastReview) lines.push(`LAST REVIEW (${fmtDate(lastReview.date)}): day ${lastReview.dayRating}/5, "${lastReview.accomplished.slice(0, 120)}"`);
  if (weekReview) lines.push(`WEEK REVIEW: objectives — ${weekReview.topObjectives.filter(Boolean).join(' | ')}`);

  return lines.join('\n');
}
