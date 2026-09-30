import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { actions, useStore } from '../store/store';
import { Field, NumberInput, cx } from './ui';
import { CATEGORY_LABEL, LEARNING_SUBJECTS, PRIORITY_LABEL } from '../lib/format';
import { fmtDate, todayKey } from '../lib/dates';
import { toCents, centsToNumber } from '../lib/money';
import type { ExpenseCategory, Task, TaskCategory, TaskPriority } from '../types';

function FormShell({ children, onSubmit, onCancel, submitLabel = 'Save' }: {
  children: ReactNode;
  onSubmit: (e: FormEvent) => void;
  onCancel: () => void;
  submitLabel?: string;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(e);
      }}
      className="space-y-3"
    >
      {children}
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary">{submitLabel}</button>
      </div>
    </form>
  );
}

// ─── Task ─────────────────────────────────────────────────────────────────────

export function TaskForm({ task, onDone }: { task?: Task; onDone: () => void }) {
  const currency = useStore((s) => s.settings.currency);
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? 'medium');
  const [category, setCategory] = useState<TaskCategory>(task?.category ?? 'personal');
  const [dueDate, setDueDate] = useState(task?.dueDate ?? todayKey());
  const [hasDue, setHasDue] = useState(task ? task.dueDate !== null : true);
  const [est, setEst] = useState(task?.estimatedMinutes != null ? String(task.estimatedMinutes) : '');

  const submit = () => {
    if (!title.trim()) return;
    const minutes = est === '' ? null : Math.max(0, Math.round(Number(est)));
    if (task) {
      actions.updateTask(task.id, {
        title, description, priority, category,
        dueDate: hasDue ? dueDate : null,
        estimatedMinutes: minutes,
      });
    } else {
      actions.addTask({ title, description, priority, category, dueDate: hasDue ? dueDate : null, estimatedMinutes: minutes });
    }
    onDone();
  };

  return (
    <FormShell onSubmit={submit} onCancel={onDone} submitLabel={task ? 'Save changes' : 'Add task'}>
      <Field label="Title">
        <input className="field" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs to be done?" />
      </Field>
      <Field label="Description (optional)">
        <textarea className="field min-h-[60px]" value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Priority">
          <select className="field" value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
            {(Object.keys(PRIORITY_LABEL) as TaskPriority[]).map((p) => (
              <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>
            ))}
          </select>
        </Field>
        <Field label="Category">
          <select className="field" value={category} onChange={(e) => setCategory(e.target.value as TaskCategory)}>
            {(Object.keys(CATEGORY_LABEL) as TaskCategory[]).map((c) => (
              <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Due date">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={hasDue}
              onChange={(e) => setHasDue(e.target.checked)}
              className="h-4 w-4 accent-[#59c2ff]"
            />
            <input type="date" className="field" value={dueDate} disabled={!hasDue} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </Field>
        <Field label="Est. minutes (optional)">
          <NumberInput value={est} onChange={setEst} min={0} placeholder="e.g. 45" />
        </Field>
      </div>
      <input type="hidden" value={currency} />
    </FormShell>
  );
}

// ─── Money ────────────────────────────────────────────────────────────────────

const EXPENSE_CATS: ExpenseCategory[] = ['food', 'transport', 'bills', 'debt', 'shopping', 'entertainment', 'technology', 'business', 'savings', 'other'];
const EXPENSE_LABEL: Record<ExpenseCategory, string> = {
  food: 'Food', transport: 'Transport', bills: 'Bills', debt: 'Debt', shopping: 'Shopping',
  entertainment: 'Entertainment', technology: 'Technology', business: 'Business', savings: 'Savings', other: 'Other',
};

export function IncomeForm({ onDone }: { onDone: () => void }) {
  const currency = useStore((s) => s.settings.currency);
  const [date, setDate] = useState(todayKey());
  const [source, setSource] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const submit = () => {
    const cents = toCents(amount);
    if (!source.trim() || Number.isNaN(cents) || cents <= 0) return;
    actions.addIncome({ date, source, amount: cents, currency, notes });
    onDone();
  };

  return (
    <FormShell onSubmit={submit} onCancel={onDone} submitLabel="Add income">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date"><input type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label={`Amount (${currency})`}><NumberInput value={amount} onChange={setAmount} min={0} step="0.01" placeholder="0.00" /></Field>
      </div>
      <Field label="Source"><input className="field" autoFocus value={source} onChange={(e) => setSource(e.target.value)} placeholder="Salary, freelance, sale…" /></Field>
      <Field label="Notes (optional)"><input className="field" value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
    </FormShell>
  );
}

export function ExpenseForm({ onDone }: { onDone: () => void }) {
  const currency = useStore((s) => s.settings.currency);
  const [date, setDate] = useState(todayKey());
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const submit = () => {
    const cents = toCents(amount);
    if (Number.isNaN(cents) || cents <= 0) return;
    actions.addExpense({ date, category, amount: cents, currency, notes });
    onDone();
  };

  return (
    <FormShell onSubmit={submit} onCancel={onDone} submitLabel="Add expense">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date"><input type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label={`Amount (${currency})`}><NumberInput value={amount} onChange={setAmount} min={0} step="0.01" placeholder="0.00" /></Field>
      </div>
      <Field label="Category">
        <select className="field" value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
          {EXPENSE_CATS.map((c) => <option key={c} value={c}>{EXPENSE_LABEL[c]}</option>)}
        </select>
      </Field>
      <Field label="Notes (optional)"><input className="field" autoFocus value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What was it for?" /></Field>
    </FormShell>
  );
}

export function SavingsForm({ onDone }: { onDone: () => void }) {
  const { current, goal, currency } = useStore((s) => s.savings);
  const [cur, setCur] = useState(centsToNumber(current) === 0 ? '' : String(centsToNumber(current)));
  const [g, setG] = useState(goal === 0 ? '' : String(centsToNumber(goal)));

  const submit = () => {
    const c = toCents(cur);
    const gg = toCents(g);
    actions.updateSavings(Number.isNaN(c) ? 0 : c, Number.isNaN(gg) ? 0 : gg);
    onDone();
  };

  return (
    <FormShell onSubmit={submit} onCancel={onDone} submitLabel="Save">
      <div className="grid grid-cols-2 gap-3">
        <Field label={`Current savings (${currency})`}><NumberInput value={cur} onChange={setCur} min={0} step="0.01" placeholder="0.00" /></Field>
        <Field label={`Savings goal (${currency})`}><NumberInput value={g} onChange={setG} min={0} step="0.01" placeholder="0.00" /></Field>
      </div>
    </FormShell>
  );
}

// ─── Fitness ──────────────────────────────────────────────────────────────────

export function WeightForm({ onDone }: { onDone: () => void }) {
  const unit = useStore((s) => s.settings.weightUnit);
  const [date, setDate] = useState(todayKey());
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');

  const submit = () => {
    const w = Number(weight);
    if (!weight || Number.isNaN(w) || w <= 0) return;
    // Store canonically in kg.
    const kg = unit === 'kg' ? w : w / 2.20462;
    actions.addWeight({ date, weight: Math.round(kg * 10) / 10, unit, note });
    onDone();
  };

  return (
    <FormShell onSubmit={submit} onCancel={onDone} submitLabel="Log weight">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date"><input type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label={`Weight (${unit})`}><NumberInput value={weight} onChange={setWeight} min={0} step="0.1" placeholder={unit === 'kg' ? 'e.g. 82.5' : 'e.g. 182'} /></Field>
      </div>
      <Field label="Note (optional)"><input className="field" value={note} onChange={(e) => setNote(e.target.value)} /></Field>
    </FormShell>
  );
}

export function WorkoutForm({ onDone }: { onDone: () => void }) {
  const [date, setDate] = useState(todayKey());
  const [type, setType] = useState('Gym');
  const [duration, setDuration] = useState('');
  const [exercises, setExercises] = useState('');
  const [notes, setNotes] = useState('');

  const submit = () => {
    const d = Number(duration);
    if (!type.trim() || Number.isNaN(d) || d <= 0) return;
    actions.addWorkout({ date, type, durationMinutes: Math.round(d), exercises, notes });
    onDone();
  };

  return (
    <FormShell onSubmit={submit} onCancel={onDone} submitLabel="Log workout">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date"><input type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Duration (min)"><NumberInput value={duration} onChange={setDuration} min={1} placeholder="60" /></Field>
      </div>
      <Field label="Workout type">
        <input className="field" value={type} onChange={(e) => setType(e.target.value)} list="workout-types" placeholder="Gym, run, push day…" />
        <datalist id="workout-types">
          {['Gym', 'Push', 'Pull', 'Legs', 'Full body', 'Run', 'Swim', 'Sport', 'Home workout'].map((t) => <option key={t} value={t} />)}
        </datalist>
      </Field>
      <Field label="Exercises (optional)"><textarea className="field min-h-[60px]" value={exercises} onChange={(e) => setExercises(e.target.value)} placeholder="Bench 4x8, Squat 3x5…" /></Field>
      <Field label="Notes (optional)"><input className="field" value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
    </FormShell>
  );
}

// ─── Learning ─────────────────────────────────────────────────────────────────

export function LearningForm({ onDone }: { onDone: () => void }) {
  const [subject, setSubject] = useState(LEARNING_SUBJECTS[0]);
  const [date, setDate] = useState(todayKey());
  const [duration, setDuration] = useState('');
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');

  const submit = () => {
    const d = Number(duration);
    if (!subject.trim() || Number.isNaN(d) || d <= 0) return;
    actions.addLearning({ subject: subject.trim(), date, durationMinutes: Math.round(d), topic, notes, completed: true });
    onDone();
  };

  return (
    <FormShell onSubmit={submit} onCancel={onDone} submitLabel="Add session">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Subject">
          <input className="field" value={subject} onChange={(e) => setSubject(e.target.value)} list="learning-subjects" />
          <datalist id="learning-subjects">
            {LEARNING_SUBJECTS.map((s) => <option key={s} value={s} />)}
          </datalist>
        </Field>
        <Field label="Duration (min)"><NumberInput value={duration} onChange={setDuration} min={1} placeholder="60" /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date"><input type="date" className="field" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Topic"><input className="field" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="What did you study?" /></Field>
      </div>
      <Field label="Notes (optional)"><input className="field" value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
    </FormShell>
  );
}

// ─── Project ──────────────────────────────────────────────────────────────────

const STATUSES = ['planned', 'active', 'paused', 'completed', 'archived'] as const;
const STATUS_LABEL: Record<(typeof STATUSES)[number], string> = {
  planned: 'Planned', active: 'Active', paused: 'Paused', completed: 'Completed', archived: 'Archived',
};

export function ProjectForm({ projectId, onDone }: { projectId?: string; onDone: () => void }) {
  const project = useStore((s) => s.projects.find((p) => p.id === projectId));
  const [name, setName] = useState(project?.name ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [status, setStatus] = useState<(typeof STATUSES)[number]>(project?.status ?? 'planned');
  const [priority, setPriority] = useState<TaskPriority>(project?.priority ?? 'medium');
  const [startDate, setStartDate] = useState(project?.startDate ?? todayKey());
  const [targetDate, setTargetDate] = useState(project?.targetDate ?? '');
  const [progress, setProgress] = useState(project?.progress ?? 0);
  const [milestone, setMilestone] = useState(project?.currentMilestone ?? '');
  const [nextAction, setNextAction] = useState(project?.nextAction ?? '');
  const [notes, setNotes] = useState(project?.notes ?? '');

  if (projectId && !project) {
    return <p className="text-sm text-bad">Project not found.</p>;
  }

  const submit = () => {
    if (!name.trim()) return;
    if (project) {
      actions.updateProject(project.id, {
        name, description, status, priority,
        startDate: startDate || null,
        targetDate: targetDate || null,
        progress: Math.min(100, Math.max(0, Math.round(progress))),
        currentMilestone: milestone,
        nextAction,
        notes,
      });
    } else {
      actions.addProject({ name, description, status, priority });
    }
    onDone();
  };

  return (
    <FormShell onSubmit={submit} onCancel={onDone} submitLabel={project ? 'Save changes' : 'Add project'}>
      <Field label="Name"><input className="field" autoFocus value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label="Description"><textarea className="field min-h-[60px]" value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Status">
          <select className="field" value={status} onChange={(e) => setStatus(e.target.value as (typeof STATUSES)[number])}>
            {STATUSES.map((st) => <option key={st} value={st}>{STATUS_LABEL[st]}</option>)}
          </select>
        </Field>
        <Field label="Priority">
          <select className="field" value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
            {(Object.keys(PRIORITY_LABEL) as TaskPriority[]).map((p) => <option key={p} value={p}>{PRIORITY_LABEL[p]}</option>)}
          </select>
        </Field>
      </div>
      {project && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date"><input type="date" className="field" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></Field>
            <Field label="Target date"><input type="date" className="field" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} /></Field>
          </div>
          <Field label={`Progress — ${progress}%`}>
            <input type="range" min={0} max={100} step={5} value={progress} onChange={(e) => setProgress(Number(e.target.value))} className="w-full accent-[#59c2ff]" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Current milestone"><input className="field" value={milestone} onChange={(e) => setMilestone(e.target.value)} /></Field>
            <Field label="Next action"><input className="field" value={nextAction} onChange={(e) => setNextAction(e.target.value)} /></Field>
          </div>
          <Field label="Notes"><textarea className="field min-h-[60px]" value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
        </>
      )}
      {!project && (
        <p className="text-xs text-slate-500">Created today · dates, progress and milestones can be set after creating.</p>
      )}
    </FormShell>
  );
}

// ─── Note ─────────────────────────────────────────────────────────────────────

export function NoteForm({ noteId, onDone }: { noteId?: string; onDone: () => void }) {
  const note = useStore((s) => s.notes.find((n) => n.id === noteId));
  const [title, setTitle] = useState(note?.title ?? '');
  const [body, setBody] = useState(note?.body ?? '');

  const submit = () => {
    if (note) actions.updateNote(note.id, title, body);
    else actions.addNote(title, body);
    onDone();
  };

  return (
    <FormShell onSubmit={submit} onCancel={onDone} submitLabel={note ? 'Save' : 'Add note'}>
      <Field label="Title"><input className="field" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
      <Field label="Body"><textarea className="field min-h-[120px]" value={body} onChange={(e) => setBody(e.target.value)} /></Field>
    </FormShell>
  );
}

// ─── Habit ────────────────────────────────────────────────────────────────────

export function HabitForm({ habitId, onDone }: { habitId?: string; onDone: () => void }) {
  const habit = useStore((s) => s.habits.find((h) => h.id === habitId));
  const [name, setName] = useState(habit?.name ?? '');
  const submit = () => {
    if (!name.trim()) return;
    if (habit) actions.updateHabit(habit.id, name);
    else actions.addHabit(name);
    onDone();
  };
  return (
    <FormShell onSubmit={submit} onCancel={onDone} submitLabel={habit ? 'Save' : 'Add habit'}>
      <Field label="Habit">
        <input className="field" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Read 20 pages" />
      </Field>
    </FormShell>
  );
}

// ─── Daily review ─────────────────────────────────────────────────────────────

export function DailyReviewForm({ date, onDone }: { date: string; onDone: () => void }) {
  const existing = useStore((s) => s.dailyReviews.find((r) => r.date === date));
  const [accomplished, setAccomplished] = useState(existing?.accomplished ?? '');
  const [failed, setFailed] = useState(existing?.failed ?? '');
  const [learned, setLearned] = useState(existing?.learned ?? '');
  const [tomorrow, setTomorrow] = useState(existing?.tomorrow ?? '');
  const [dayRating, setDayRating] = useState(existing?.dayRating ?? 3);
  const [energy, setEnergy] = useState(existing?.energy ?? 3);
  const [focus, setFocus] = useState(existing?.focus ?? 3);

  useEffect(() => {
    // Re-sync if the date changes while open.
    setAccomplished(existing?.accomplished ?? '');
    setFailed(existing?.failed ?? '');
    setLearned(existing?.learned ?? '');
    setTomorrow(existing?.tomorrow ?? '');
    setDayRating(existing?.dayRating ?? 3);
    setEnergy(existing?.energy ?? 3);
    setFocus(existing?.focus ?? 3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const submit = () => {
    actions.saveDailyReview({
      date, accomplished, failed, learned, tomorrow, dayRating, energy, focus,
    });
    onDone();
  };

  const Scale = ({ label, value, set }: { label: string; value: number; set: (n: number) => void }) => (
    <div>
      <span className="label">{label}</span>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => set(n)}
            className={cx(
              'h-9 flex-1 rounded-lg border text-sm font-semibold',
              n <= value ? 'border-accent/50 bg-accent/15 text-accent' : 'border-hollow-line bg-hollow-panel2 text-slate-500',
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <FormShell onSubmit={submit} onCancel={onDone} submitLabel="Save review">
      <p className="text-xs text-slate-500">
        {fmtDate(date)}{existing ? ' · editing existing review' : ''}
      </p>
      <Field label="What did I accomplish today?"><textarea className="field min-h-[60px]" value={accomplished} onChange={(e) => setAccomplished(e.target.value)} /></Field>
      <Field label="What did I fail to complete?"><textarea className="field min-h-[60px]" value={failed} onChange={(e) => setFailed(e.target.value)} /></Field>
      <Field label="What did I learn?"><textarea className="field min-h-[60px]" value={learned} onChange={(e) => setLearned(e.target.value)} /></Field>
      <Field label="What needs to happen tomorrow?"><textarea className="field min-h-[60px]" value={tomorrow} onChange={(e) => setTomorrow(e.target.value)} /></Field>
      <div className="grid grid-cols-3 gap-3">
        <Scale label="Day" value={dayRating} set={setDayRating} />
        <Scale label="Energy" value={energy} set={setEnergy} />
        <Scale label="Focus" value={focus} set={setFocus} />
      </div>
    </FormShell>
  );
}
