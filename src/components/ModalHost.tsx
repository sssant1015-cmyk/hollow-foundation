import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Modal } from './ui';
import {
  DailyReviewForm,
  ExpenseForm,
  HabitForm,
  IncomeForm,
  LearningForm,
  NoteForm,
  ProjectForm,
  SavingsForm,
  TaskForm,
  WeightForm,
  WorkoutForm,
} from './forms';
import { WeeklyReviewForm } from './WeeklyReviewForm';
import type { Task } from '../types';

export type ModalKind =
  | 'task'
  | 'expense'
  | 'income'
  | 'savings'
  | 'workout'
  | 'weight'
  | 'learning'
  | 'project'
  | 'daily-review'
  | 'weekly-review'
  | 'note'
  | 'habit';

export interface ModalRequest {
  kind: ModalKind;
  task?: Task;
  projectId?: string;
  noteId?: string;
  habitId?: string;
  date?: string;
  weekStart?: string;
}

interface ModalContextValue {
  open: (req: ModalRequest) => void;
  close: () => void;
}

const ModalContext = createContext<ModalContextValue>({ open: () => {}, close: () => {} });

export function useModal(): ModalContextValue {
  return useContext(ModalContext);
}

const TITLES: Record<ModalKind, string> = {
  task: 'Add Task',
  expense: 'Add Expense',
  income: 'Add Income',
  savings: 'Savings',
  workout: 'Log Workout',
  weight: 'Log Weight',
  learning: 'Add Learning Session',
  project: 'Add Project',
  'daily-review': 'Daily Review',
  'weekly-review': 'Weekly Review',
  note: 'Note',
  habit: 'Habit',
};

export function ModalHost({ children }: { children: ReactNode }) {
  const [req, setReq] = useState<ModalRequest | null>(null);
  const open = useCallback((r: ModalRequest) => setReq(r), []);
  const close = useCallback(() => setReq(null), []);

  const renderForm = (onDone: () => void): ReactNode => {
    if (!req) return null;
    switch (req.kind) {
      case 'task': return <TaskForm task={req.task} onDone={onDone} />;
      case 'expense': return <ExpenseForm onDone={onDone} />;
      case 'income': return <IncomeForm onDone={onDone} />;
      case 'savings': return <SavingsForm onDone={onDone} />;
      case 'workout': return <WorkoutForm onDone={onDone} />;
      case 'weight': return <WeightForm onDone={onDone} />;
      case 'learning': return <LearningForm onDone={onDone} />;
      case 'project': return <ProjectForm projectId={req.projectId} onDone={onDone} />;
      case 'daily-review': return <DailyReviewForm date={req.date ?? ''} onDone={onDone} />;
      case 'weekly-review': return <WeeklyReviewForm weekStart={req.weekStart} onDone={onDone} />;
      case 'note': return <NoteForm noteId={req.noteId} onDone={onDone} />;
      case 'habit': return <HabitForm habitId={req.habitId} onDone={onDone} />;
    }
  };

  const title = req
    ? req.kind === 'task' && req.task
      ? 'Edit Task'
      : req.kind === 'project' && req.projectId
        ? 'Edit Project'
        : req.kind === 'note' && req.noteId
          ? 'Edit Note'
          : req.kind === 'habit' && req.habitId
            ? 'Edit Habit'
            : TITLES[req.kind]
    : '';

  return (
    <ModalContext.Provider value={{ open, close }}>
      {children}
      {req && (
        <Modal title={title} onClose={close} wide={req.kind === 'weekly-review'}>
          {renderForm(close)}
        </Modal>
      )}
    </ModalContext.Provider>
  );
}
