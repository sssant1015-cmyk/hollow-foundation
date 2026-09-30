import type { ExpenseCategory, ProjectStatus, TaskCategory, TaskPriority, TaskStatus } from '../types';

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

export const PRIORITY_ORDER: Record<TaskPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export const PRIORITY_CLASS: Record<TaskPriority, string> = {
  critical: 'border-bad/40 bg-bad/10 text-bad',
  high: 'border-warn/40 bg-warn/10 text-warn',
  medium: 'border-accent/40 bg-accent/10 text-accent',
  low: 'border-hollow-line bg-hollow-panel2 text-slate-400',
};

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
};

export const CATEGORY_LABEL: Record<TaskCategory, string> = {
  work: 'Work',
  money: 'Money',
  health: 'Health',
  learning: 'Learning',
  personal: 'Personal',
};

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  planned: 'Planned',
  active: 'Active',
  paused: 'Paused',
  completed: 'Completed',
  archived: 'Archived',
};

export const PROJECT_STATUS_CLASS: Record<ProjectStatus, string> = {
  planned: 'border-hollow-line bg-hollow-panel2 text-slate-400',
  active: 'border-good/40 bg-good/10 text-good',
  paused: 'border-warn/40 bg-warn/10 text-warn',
  completed: 'border-accent/40 bg-accent/10 text-accent',
  archived: 'border-hollow-line bg-transparent text-slate-600',
};

export const EXPENSE_CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  food: 'Food',
  transport: 'Transport',
  bills: 'Bills',
  debt: 'Debt',
  shopping: 'Shopping',
  entertainment: 'Entertainment',
  technology: 'Technology',
  business: 'Business',
  savings: 'Savings',
  other: 'Other',
};

export const LEARNING_SUBJECTS = ['Python', 'AI', 'Software Engineering', 'Business', 'Trading/Economics'];

export function fmtHours(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function fmtWeight(kg: number, unit: 'kg' | 'lb'): string {
  return `${unit === 'kg' ? kg.toFixed(1) : (kg * 2.20462).toFixed(1)} ${unit}`;
}

export function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((part / total) * 100));
}

export function fmtSigned(n: number, digits = 1): string {
  const s = n > 0 ? '+' : n < 0 ? '−' : '';
  return `${s}${Math.abs(n).toFixed(digits)}`;
}
