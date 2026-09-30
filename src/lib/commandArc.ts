import { addDays, daysBetween, todayKey } from './dates';
import type { ArcPhase } from '../types';

export const DEFAULT_PHASES: ArcPhase[] = [
  { n: 1, name: 'Foundation', start: '2026-10-01', end: '2026-10-14' },
  { n: 2, name: 'Nix', start: '2026-10-15', end: '2026-11-07' },
  { n: 3, name: 'Rafael', start: '2026-11-08', end: '2026-11-21' },
  { n: 4, name: 'Hollow Tech', start: '2026-11-22', end: '2026-12-05' },
  { n: 5, name: 'Money', start: '2026-12-06', end: '2026-12-12' },
  { n: 6, name: 'Physical', start: '2026-12-13', end: '2026-12-19' },
  { n: 7, name: 'Ship', start: '2026-12-20', end: '2026-12-31' },
];

export interface ArcInfo {
  totalDays: number;
  currentDay: number; // 1-based; 0 = not started; totalDays+1.. = finished
  started: boolean;
  finished: boolean;
  daysCompleted: number;
  daysRemaining: number;
  completionPct: number;
  currentPhase: ArcPhase | null;
  nextPhase: ArcPhase | null;
  phaseProgressPct: number;
}

export function getArcInfo(phases: ArcPhase[]): ArcInfo {
  const today = todayKey();
  const sorted = [...phases].sort((a, b) => a.start.localeCompare(b.start));
  const arcStart = sorted[0]?.start ?? today;
  const arcEnd = sorted[sorted.length - 1]?.end ?? today;
  const totalDays = daysBetween(arcStart, arcEnd) + 1;

  if (today < arcStart) {
    return {
      totalDays,
      currentDay: 0,
      started: false,
      finished: false,
      daysCompleted: 0,
      daysRemaining: totalDays,
      completionPct: 0,
      currentPhase: null,
      nextPhase: sorted[0] ?? null,
      phaseProgressPct: 0,
    };
  }

  const currentDay = Math.min(daysBetween(arcStart, today) + 1, totalDays);
  const finished = today > arcEnd;
  const daysCompleted = finished ? totalDays : daysBetween(arcStart, today);
  const daysRemaining = Math.max(totalDays - daysCompleted, 0);

  const currentPhase = finished ? null : sorted.find((p) => today >= p.start && today <= p.end) ?? null;
  const nextPhase = currentPhase ? null : sorted.find((p) => p.start > today) ?? null;
  const refPhase = currentPhase ?? nextPhase;
  const phaseProgressPct = refPhase
    ? Math.min(100, Math.max(0, (daysBetween(refPhase.start, today < refPhase.start ? refPhase.start : today) + 1) / (daysBetween(refPhase.start, refPhase.end) + 1) * 100))
    : 0;

  return {
    totalDays,
    currentDay,
    started: true,
    finished,
    daysCompleted,
    daysRemaining,
    completionPct: Math.round((daysCompleted / totalDays) * 100),
    currentPhase,
    nextPhase,
    phaseProgressPct: Math.round(phaseProgressPct),
  };
}

export function phaseOfDay(phase: ArcPhase): { day: number; of: number } {
  const today = todayKey();
  const total = daysBetween(phase.start, phase.end) + 1;
  const day = Math.min(Math.max(daysBetween(phase.start, today) + 1, 1), total);
  return { day, of: total };
}

/** Next phase start, for the dashboard "up next" line. */
export function daysUntilNextPhase(phases: ArcPhase[]): number | null {
  const today = todayKey();
  const next = [...phases].sort((a, b) => a.start.localeCompare(b.start)).find((p) => p.start > today);
  return next ? daysBetween(today, next.start) : null;
}

export { addDays };
