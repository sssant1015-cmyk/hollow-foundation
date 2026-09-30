import { useSyncExternalStore } from 'react';
import type {
  AppState,
  DailyReview,
  ExpenseCategory,
  Habit,
  Project,
  ProjectStatus,
  Task,
  TaskCategory,
  TaskPriority,
  WeeklyReview,
} from '../types';
import { emptyState, STORAGE_KEY, STATE_VERSION } from '../data/seed';
import { nowISO, todayKey } from '../lib/dates';

// ─── Persistence ────────────────────────────────────────────────────────────

// Placeholder projects seeded before v0.1.1 — purged from already-saved state on load.
const PLACEHOLDER_PROJECT_IDS = new Set(['p-nix', 'p-rafael', 'p-hollow-tech']);

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as AppState;
    if (parsed.version !== STATE_VERSION || !parsed.settings) return emptyState();
    const base = emptyState();
    return {
      ...base,
      ...parsed,
      settings: { ...base.settings, ...parsed.settings },
      savings: { ...base.savings, ...parsed.savings },
      // Purge the pre-v0.1.1 placeholder projects from already-saved state.
      projects: (parsed.projects ?? []).filter((p) => !PLACEHOLDER_PROJECT_IDS.has(p.id)),
    };
  } catch {
    return emptyState();
  }
}

let state: AppState = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked — the app keeps running in memory.
  }
}

function set(next: AppState) {
  state = next;
  persist();
  listeners.forEach((l) => l());
}

function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function getState(): AppState {
  return state;
}

export function useStore<T>(selector: (s: AppState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state));
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export const actions = {
  // Tasks
  addTask(t: {
    title: string;
    description?: string;
    priority: TaskPriority;
    dueDate: string | null;
    category: TaskCategory;
    estimatedMinutes: number | null;
  }) {
    const now = nowISO();
    const task: Task = {
      id: uid(),
      title: t.title.trim(),
      description: t.description?.trim() || '',
      priority: t.priority,
      dueDate: t.dueDate,
      category: t.category,
      status: 'todo',
      estimatedMinutes: t.estimatedMinutes,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    set({ ...state, tasks: [task, ...state.tasks] });
  },
  updateTask(id: string, patch: Partial<Task>) {
    set({
      ...state,
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: nowISO() } : t)),
    });
  },
  toggleTask(id: string) {
    set({
      ...state,
      tasks: state.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              status: t.status === 'done' ? 'todo' : 'done',
              completedAt: t.status === 'done' ? null : nowISO(),
              updatedAt: nowISO(),
            }
          : t,
      ),
    });
  },
  deleteTask(id: string) {
    set({ ...state, tasks: state.tasks.filter((t) => t.id !== id) });
  },

  // Projects
  addProject(p: { name: string; description?: string; status?: ProjectStatus; priority?: TaskPriority }) {
    const now = nowISO();
    const project: Project = {
      id: uid(),
      name: p.name.trim(),
      description: p.description?.trim() || '',
      status: p.status ?? 'planned',
      priority: p.priority ?? 'medium',
      startDate: todayKey(),
      targetDate: null,
      progress: 0,
      currentMilestone: '',
      nextAction: '',
      notes: '',
      createdAt: now,
      updatedAt: now,
    };
    set({ ...state, projects: [project, ...state.projects] });
  },
  updateProject(id: string, patch: Partial<Project>) {
    set({
      ...state,
      projects: state.projects.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: nowISO() } : p)),
    });
  },
  deleteProject(id: string) {
    set({ ...state, projects: state.projects.filter((p) => p.id !== id) });
  },

  // Goals
  addGoal(title: string, category: TaskCategory, targetDate: string | null) {
    set({
      ...state,
      goals: [
        ...state.goals,
        { id: uid(), title: title.trim(), description: '', category, targetDate, done: false, createdAt: nowISO() },
      ],
    });
  },
  toggleGoal(id: string) {
    set({
      ...state,
      goals: state.goals.map((g) => (g.id === id ? { ...g, done: !g.done } : g)),
    });
  },
  deleteGoal(id: string) {
    set({ ...state, goals: state.goals.filter((g) => g.id !== id) });
  },

  // Money
  addIncome(i: { date: string; source: string; amount: number; currency: string; notes: string }) {
    set({ ...state, income: [{ id: uid(), date: i.date, source: i.source.trim(), amount: i.amount, currency: i.currency, notes: i.notes.trim() }, ...state.income] });
  },
  deleteIncome(id: string) {
    set({ ...state, income: state.income.filter((e) => e.id !== id) });
  },
  addExpense(e: { date: string; category: ExpenseCategory; amount: number; currency: string; notes: string }) {
    set({ ...state, expenses: [{ id: uid(), date: e.date, category: e.category, amount: e.amount, currency: e.currency, notes: e.notes.trim() }, ...state.expenses] });
  },
  deleteExpense(id: string) {
    set({ ...state, expenses: state.expenses.filter((e) => e.id !== id) });
  },
  updateSavings(current: number, goal: number) {
    set({
      ...state,
      savings: { ...state.savings, current, goal, currency: state.settings.currency, updatedAt: nowISO() },
    });
  },

  // Fitness
  addWeight(w: { date: string; weight: number; unit: 'kg' | 'lb'; note: string }) {
    set({
      ...state,
      weights: [...state.weights, { id: uid(), date: w.date, weight: w.weight, unit: w.unit, note: w.note.trim() }].sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
    });
  },
  deleteWeight(id: string) {
    set({ ...state, weights: state.weights.filter((w) => w.id !== id) });
  },
  addWorkout(w: { date: string; type: string; durationMinutes: number; exercises: string; notes: string }) {
    set({
      ...state,
      workouts: [{ id: uid(), date: w.date, type: w.type.trim(), durationMinutes: w.durationMinutes, exercises: w.exercises.trim(), notes: w.notes.trim() }, ...state.workouts],
    });
  },
  deleteWorkout(id: string) {
    set({ ...state, workouts: state.workouts.filter((w) => w.id !== id) });
  },

  // Learning
  addLearning(l: { subject: string; date: string; durationMinutes: number; topic: string; notes: string; completed: boolean }) {
    set({
      ...state,
      learning: [{ id: uid(), subject: l.subject, date: l.date, durationMinutes: l.durationMinutes, topic: l.topic.trim(), notes: l.notes.trim(), completed: l.completed }, ...state.learning],
    });
  },
  toggleLearning(id: string) {
    set({
      ...state,
      learning: state.learning.map((l) => (l.id === id ? { ...l, completed: !l.completed } : l)),
    });
  },
  deleteLearning(id: string) {
    set({ ...state, learning: state.learning.filter((l) => l.id !== id) });
  },

  // Habits
  addHabit(name: string) {
    const habit: Habit = { id: uid(), name: name.trim(), createdAt: nowISO() };
    set({ ...state, habits: [...state.habits, habit] });
  },
  updateHabit(id: string, name: string) {
    set({
      ...state,
      habits: state.habits.map((h) => (h.id === id ? { ...h, name: name.trim() } : h)),
    });
  },
  removeHabit(id: string) {
    set({
      ...state,
      habits: state.habits.filter((h) => h.id !== id),
      habitLogs: state.habitLogs.filter((l) => l.habitId !== id),
    });
  },
  toggleHabitLog(habitId: string, date: string) {
    const exists = state.habitLogs.some((l) => l.habitId === habitId && l.date === date);
    const habitLogs = exists
      ? state.habitLogs.filter((l) => !(l.habitId === habitId && l.date === date))
      : [...state.habitLogs, { id: uid(), habitId, date }];
    set({ ...state, habitLogs });
  },

  // Reviews
  saveDailyReview(r: Omit<DailyReview, 'id' | 'createdAt'>) {
    const existing = state.dailyReviews.find((x) => x.date === r.date);
    const review: DailyReview = existing
      ? { ...existing, ...r, createdAt: nowISO() }
      : { ...r, id: uid(), createdAt: nowISO() };
    set({
      ...state,
      dailyReviews: existing
        ? state.dailyReviews.map((x) => (x.date === r.date ? review : x))
        : [review, ...state.dailyReviews],
    });
  },
  saveWeeklyReview(r: Omit<WeeklyReview, 'id' | 'createdAt'>) {
    const existing = state.weeklyReviews.find((x) => x.weekStart === r.weekStart);
    const review: WeeklyReview = existing ? { ...existing, ...r, createdAt: nowISO() } : { ...r, id: uid(), createdAt: nowISO() };
    set({
      ...state,
      weeklyReviews: existing
        ? state.weeklyReviews.map((x) => (x.weekStart === r.weekStart ? review : x))
        : [review, ...state.weeklyReviews],
    });
  },
  deleteWeeklyReview(id: string) {
    set({ ...state, weeklyReviews: state.weeklyReviews.filter((w) => w.id !== id) });
  },
  deleteDailyReview(id: string) {
    set({ ...state, dailyReviews: state.dailyReviews.filter((r) => r.id !== id) });
  },

  // Notes
  addNote(title: string, body: string) {
    set({ ...state, notes: [{ id: uid(), title: title.trim() || 'Untitled', body, updatedAt: nowISO() }, ...state.notes] });
  },
  updateNote(id: string, title: string, body: string) {
    set({
      ...state,
      notes: state.notes.map((n) =>
        n.id === id ? { ...n, title: title.trim() || 'Untitled', body, updatedAt: nowISO() } : n,
      ),
    });
  },
  deleteNote(id: string) {
    set({ ...state, notes: state.notes.filter((n) => n.id !== id) });
  },

  // Settings / data
  updateSettings(patch: Partial<AppState['settings']>) {
    set({ ...state, settings: { ...state.settings, ...patch } });
  },
  resetAll() {
    set(emptyState());
  },
  clearPersonalData() {
    set({
      ...emptyState(),
      settings: state.settings,
      projects: state.projects.filter((p) => p.id !== 'p-foundation'),
      habits: [],
    });
  },
};
