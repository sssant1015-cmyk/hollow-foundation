import { useState } from 'react';
import { actions, useStore } from '../store/store';
import { Field, NumberInput } from './ui';
import { weekRange } from '../lib/stats';
import { fmtDate } from '../lib/dates';
import { toCents, centsToNumber } from '../lib/money';

export function WeeklyReviewForm({ weekStart, onDone }: { weekStart?: string; onDone: () => void }) {
  const state = useStore((s) => s);
  const range = weekRange(weekStart);
  const existing = state.weeklyReviews.find((r) => r.weekStart === range.start);

  // Prefill numbers from real data so the review is quick to complete.
  const tasksCompleted = state.tasks.filter(
    (t) => t.completedAt && t.completedAt.slice(0, 10) >= range.start && t.completedAt.slice(0, 10) <= range.end,
  ).length;
  const workouts = state.workouts.filter((w) => w.date >= range.start && w.date <= range.end).length;
  const learningHours = Math.round(
    state.learning.filter((l) => l.date >= range.start && l.date <= range.end).reduce((sum, l) => sum + l.durationMinutes, 0) / 6,
  ) / 10;
  const saved = state.expenses
    .filter((e) => e.date >= range.start && e.date <= range.end && e.category === 'savings')
    .reduce((sum, e) => sum + e.amount, 0);
  const spent = state.expenses
    .filter((e) => e.date >= range.start && e.date <= range.end && e.category !== 'savings')
    .reduce((sum, e) => sum + e.amount, 0);

  const [wins, setWins] = useState(existing?.wins ?? '');
  const [problems, setProblems] = useState(existing?.problems ?? '');
  const [lessons, setLessons] = useState(existing?.lessons ?? '');
  const [moneySaved, setMoneySaved] = useState(existing ? String(centsToNumber(existing.moneySaved)) : String(centsToNumber(saved)));
  const [moneySpent, setMoneySpent] = useState(existing ? String(centsToNumber(existing.moneySpent)) : String(centsToNumber(spent)));
  const [wCount, setWCount] = useState(String(existing?.workouts ?? workouts));
  const [lHours, setLHours] = useState(String(existing?.learningHours ?? learningHours));
  const [tCount, setTCount] = useState(String(existing?.tasksCompleted ?? tasksCompleted));
  const [obj1, setObj1] = useState(existing?.topObjectives[0] ?? '');
  const [obj2, setObj2] = useState(existing?.topObjectives[1] ?? '');
  const [obj3, setObj3] = useState(existing?.topObjectives[2] ?? '');
  const [importantTasks, setImportantTasks] = useState(existing?.importantTasks ?? '');
  const [mainProject, setMainProject] = useState(existing?.mainProject ?? '');
  const [mainObstacle, setMainObstacle] = useState(existing?.mainObstacle ?? '');

  const num = (v: string): number => {
    const n = Number(v);
    return Number.isNaN(n) ? 0 : n;
  };

  const submit = () => {
    actions.saveWeeklyReview({
      weekStart: range.start,
      weekEnd: range.end,
      wins,
      problems,
      lessons,
      moneySaved: toCents(moneySaved) || 0,
      moneySpent: toCents(moneySpent) || 0,
      workouts: Math.round(num(wCount)),
      learningHours: Math.round(num(lHours) * 10) / 10,
      tasksCompleted: Math.round(num(tCount)),
      topObjectives: [obj1, obj2, obj3],
      importantTasks,
      mainProject,
      mainObstacle,
    });
    onDone();
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-3"
    >
      <p className="text-xs text-slate-500">
        Week of {fmtDate(range.start)} → {fmtDate(range.end)} · numbers prefilled from your logs
      </p>
      <Field label="Wins — what did I accomplish?"><textarea className="field min-h-[54px]" value={wins} onChange={(e) => setWins(e.target.value)} /></Field>
      <Field label="Problems — what went wrong?"><textarea className="field min-h-[54px]" value={problems} onChange={(e) => setProblems(e.target.value)} /></Field>
      <Field label="Lessons — what did I learn?"><textarea className="field min-h-[54px]" value={lessons} onChange={(e) => setLessons(e.target.value)} /></Field>

      <div className="panel bg-hollow-panel2 p-3">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500">Numbers</div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="Money saved"><NumberInput value={moneySaved} onChange={setMoneySaved} min={0} step="0.01" /></Field>
          <Field label="Money spent"><NumberInput value={moneySpent} onChange={setMoneySpent} min={0} step="0.01" /></Field>
          <Field label="Workouts"><NumberInput value={wCount} onChange={setWCount} min={0} /></Field>
          <Field label="Learning hours"><NumberInput value={lHours} onChange={setLHours} min={0} step="0.1" /></Field>
          <Field label="Tasks completed"><NumberInput value={tCount} onChange={setTCount} min={0} /></Field>
        </div>
      </div>

      <div className="panel bg-hollow-panel2 p-3">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-500">Next week</div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Objective 1"><input className="field" value={obj1} onChange={(e) => setObj1(e.target.value)} /></Field>
          <Field label="Objective 2"><input className="field" value={obj2} onChange={(e) => setObj2(e.target.value)} /></Field>
          <Field label="Objective 3"><input className="field" value={obj3} onChange={(e) => setObj3(e.target.value)} /></Field>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Field label="Important tasks"><input className="field" value={importantTasks} onChange={(e) => setImportantTasks(e.target.value)} /></Field>
          <Field label="Main project"><input className="field" value={mainProject} onChange={(e) => setMainProject(e.target.value)} /></Field>
          <Field label="Main obstacle"><input className="field" value={mainObstacle} onChange={(e) => setMainObstacle(e.target.value)} /></Field>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" className="btn" onClick={onDone}>Cancel</button>
        <button type="submit" className="btn btn-primary">{existing ? 'Save changes' : 'Save review'}</button>
      </div>
    </form>
  );
}
