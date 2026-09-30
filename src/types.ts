// ─── Core data model ──────────────────────────────────────────────────────────
// Each domain is a separate collection — never one giant object.

export type ID = string;
export type ISODate = string; // 'YYYY-MM-DD'
export type ISODateTime = string; // Date.toISOString()

export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskCategory =
  | 'work'
  | 'money'
  | 'health'
  | 'learning'
  | 'hollow_tech'
  | 'nix'
  | 'rafael'
  | 'personal';

export interface Task {
  id: ID;
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate: ISODate | null;
  category: TaskCategory;
  status: TaskStatus;
  estimatedMinutes: number | null;
  completedAt: ISODateTime | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export type ProjectStatus = 'planned' | 'active' | 'paused' | 'completed' | 'archived';

export interface Project {
  id: ID;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: TaskPriority;
  startDate: ISODate | null;
  targetDate: ISODate | null;
  progress: number; // 0-100
  currentMilestone: string;
  nextAction: string;
  notes: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface Goal {
  id: ID;
  title: string;
  description: string;
  category: TaskCategory;
  targetDate: ISODate | null;
  done: boolean;
  createdAt: ISODateTime;
}

// ─── Money ────────────────────────────────────────────────────────────────────

export type ExpenseCategory =
  | 'food'
  | 'transport'
  | 'bills'
  | 'debt'
  | 'shopping'
  | 'entertainment'
  | 'technology'
  | 'business'
  | 'savings'
  | 'other';

export interface Income {
  id: ID;
  date: ISODate;
  source: string;
  amount: number;
  currency: string;
  notes: string;
}

export interface Expense {
  id: ID;
  date: ISODate;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  notes: string;
}

export interface Savings {
  current: number;
  goal: number;
  currency: string;
  updatedAt: ISODateTime;
}

// ─── Fitness ──────────────────────────────────────────────────────────────────

export interface WeightRecord {
  id: ID;
  date: ISODate;
  weight: number;
  unit: 'kg' | 'lb';
  note: string;
}

export interface Workout {
  id: ID;
  date: ISODate;
  type: string;
  durationMinutes: number;
  exercises: string;
  notes: string;
}

// ─── Learning ─────────────────────────────────────────────────────────────────

export interface LearningSession {
  id: ID;
  subject: string;
  date: ISODate;
  durationMinutes: number;
  topic: string;
  notes: string;
  completed: boolean;
}

// ─── Habits ───────────────────────────────────────────────────────────────────

export interface Habit {
  id: ID;
  name: string;
  createdAt: ISODateTime;
}

export interface HabitLog {
  id: ID;
  habitId: ID;
  date: ISODate;
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

export interface DailyReview {
  id: ID;
  date: ISODate;
  accomplished: string;
  failed: string;
  learned: string;
  tomorrow: string;
  dayRating: number; // 1-5
  energy: number; // 1-5
  focus: number; // 1-5
  createdAt: ISODateTime;
}

export interface WeeklyReview {
  id: ID;
  weekStart: ISODate;
  weekEnd: ISODate;
  wins: string;
  problems: string;
  lessons: string;
  moneySaved: number;
  moneySpent: number;
  workouts: number;
  learningHours: number;
  tasksCompleted: number;
  topObjectives: [string, string, string];
  importantTasks: string;
  mainProject: string;
  mainObstacle: string;
  createdAt: ISODateTime;
}

// ─── Winter Arc ───────────────────────────────────────────────────────────────

export interface ArcPhase {
  n: number;
  name: string;
  start: ISODate;
  end: ISODate;
}

// ─── Settings / Root state ────────────────────────────────────────────────────

export interface Settings {
  name: string;
  currency: string;
  weightUnit: 'kg' | 'lb';
  theme: 'dark' | 'midnight' | 'carbon';
  arcStart: ISODate;
  arcEnd: ISODate;
  notifyDailyReview: boolean;
  notifyWeeklyReview: boolean;
  aiModel: string;
  aiGroqKey: string;
  aiGeminiKey: string;
  aiOpenRouterKey: string;
}

export interface Notes {
  id: ID;
  title: string;
  body: string;
  updatedAt: ISODateTime;
}

export interface AppState {
  version: number;
  settings: Settings;
  tasks: Task[];
  projects: Project[];
  goals: Goal[];
  income: Income[];
  expenses: Expense[];
  savings: Savings;
  weights: WeightRecord[];
  workouts: Workout[];
  learning: LearningSession[];
  habits: Habit[];
  habitLogs: HabitLog[];
  dailyReviews: DailyReview[];
  weeklyReviews: WeeklyReview[];
  notes: Notes[];
}
