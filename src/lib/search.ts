import type { AppState } from '../types';
import { CATEGORY_LABEL, EXPENSE_CATEGORY_LABEL } from './format';
import { fmtDate } from './dates';

export interface SearchHit {
  type: string;
  label: string;
  sub: string;
  date: string | null;
  route: string;
}

function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function subsequence(needle: string, hay: string): boolean {
  let i = 0;
  for (const ch of hay) {
    if (ch === needle[i]) i++;
    if (i === needle.length) return true;
  }
  return false;
}

export function globalSearch(s: AppState, query: string): SearchHit[] {
  const q = normalize(query.trim());
  if (q.length < 2) return [];
  const words = q.split(/\s+/);
  const hits: SearchHit[] = [];

  const push = (type: string, label: string, sub: string, date: string | null, route: string, fields: (string | undefined | null)[]) => {
    const hay = fields.filter(Boolean).map((f) => normalize(String(f))).join(' ');
    const exact = words.every((w) => hay.includes(w));
    // Forgiving mode: 4+ char queries fall back to subsequence (typo tolerance).
    const fuzzy = !exact && q.length >= 4 && subsequence(q, hay);
    if (!exact && !fuzzy) return;
    hits.push({ type, label, sub, date, route });
  };

  for (const t of s.tasks) {
    push(
      'Task',
      t.title,
      `${CATEGORY_LABEL[t.category]} · ${t.priority}`,
      t.dueDate,
      'tasks',
      [t.title, t.description, t.category, t.priority],
    );
  }

  for (const p of s.projects) {
    push('Project', p.name, p.status, p.targetDate, 'projects', [p.name, p.description, p.currentMilestone, p.nextAction, p.notes]);
  }

  for (const n of s.notes) {
    push('Note', n.title, n.body.slice(0, 80), n.updatedAt.slice(0, 10), 'notes', [n.title, n.body]);
  }

  for (const i of s.income) {
    push('Income', `${i.source} — ${i.amount}`, i.notes, i.date, 'money', [i.source, i.notes, String(i.amount)]);
  }

  for (const e of s.expenses) {
    push('Expense', `${e.category} — ${e.amount}`, e.notes, e.date, 'money', [
      e.category,
      EXPENSE_CATEGORY_LABEL[e.category],
      e.notes,
      String(e.amount),
    ]);
  }

  for (const w of s.workouts) {
    push('Workout', w.type, w.exercises || w.notes, w.date, 'fitness', [w.type, w.exercises, w.notes]);
  }

  for (const l of s.learning) {
    push('Learning', l.subject, l.topic || l.notes, l.date, 'learning', [l.subject, l.topic, l.notes]);
  }

  for (const r of s.dailyReviews) {
    push('Daily review', fmtDate(r.date), r.accomplished.slice(0, 80), r.date, 'reviews', [r.accomplished, r.failed, r.learned, r.tomorrow]);
  }

  for (const r of s.weeklyReviews) {
    push('Weekly review', `Week of ${fmtDate(r.weekStart)}`, r.wins.slice(0, 80), r.weekStart, 'reviews', [
      r.wins,
      r.problems,
      r.lessons,
      r.topObjectives.join(' '),
      r.mainProject,
    ]);
  }

  return hits.slice(0, 40);
}
