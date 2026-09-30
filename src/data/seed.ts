import type { AppState, Habit, Project } from '../types';
import { nowISO, todayKey } from '../lib/dates';

export const STORAGE_KEY = 'hollow-foundation-v1';
export const STATE_VERSION = 1;

export const DEFAULT_SETTINGS: AppState['settings'] = {
  name: 'Operator',
  currency: 'JMD',
  weightUnit: 'kg',
  theme: 'dark',
  arcStart: '2026-10-01',
  arcEnd: '2026-12-31',
  notifyDailyReview: true,
  notifyWeeklyReview: true,
  aiModel: 'llm7-mistral',
  aiGroqKey: '',
  aiGeminiKey: '',
  aiOpenRouterKey: '',
};

export function seedProjects(): Project[] {
  const now = nowISO();
  const base = {
    status: 'planned' as const,
    priority: 'high' as const,
    startDate: null,
    targetDate: null,
    progress: 0,
    currentMilestone: '',
    nextAction: '',
    notes: '',
    createdAt: now,
    updatedAt: now,
  };
  return [
    {
      ...base,
      id: 'p-foundation',
      name: 'Hollow Foundation',
      description: 'Personal operating system and command dashboard for the Winter Arc 2026.',
      status: 'active',
      priority: 'critical',
      startDate: todayKey(),
      targetDate: '2026-10-14',
      progress: 5,
      currentMilestone: 'Phase One — v1 usable daily',
      nextAction: 'Daily use: plan tasks, log execution, complete reviews',
      notes: 'Phase One scope: tasks, projects, winter arc, money, fitness, learning, habits, reviews, calendar, search.',
    },
  ];
}

export function seedHabits(): Habit[] {
  const now = nowISO();
  const names = [
    'Complete daily plan',
    'Complete important task',
    'Exercise',
    'Learning',
    'Track spending',
    'Daily review',
    'Sleep routine',
  ];
  return names.map((name, i) => ({ id: `habit-${i + 1}`, name, createdAt: now }));
}

export function emptyState(): AppState {
  return {
    version: STATE_VERSION,
    settings: { ...DEFAULT_SETTINGS },
    tasks: [],
    projects: seedProjects(),
    goals: [],
    income: [],
    expenses: [],
    savings: { current: 0, goal: 0, currency: DEFAULT_SETTINGS.currency, updatedAt: nowISO() },
    weights: [],
    workouts: [],
    learning: [],
    habits: seedHabits(),
    habitLogs: [],
    dailyReviews: [],
    weeklyReviews: [],
    notes: [],
  };
}
