import { actions, useStore } from '../store/store';
import { Badge, Empty, PageHeader, Panel, StatTile } from '../components/ui';
import { useModal } from '../components/ModalHost';
import { LEARNING_SUBJECTS, fmtHours } from '../lib/format';
import { addDays, fmtDate, startOfWeek, todayKey } from '../lib/dates';
import { ConfirmDelete } from './shared';

export function LearningPage() {
  const state = useStore((s) => s);
  const { open } = useModal();
  const today = todayKey();
  const weekStart = startOfWeek(today);
  const monthStart = today.slice(0, 8) + '01';

  const minutesInRange = (from: string, to: string) =>
    state.learning.filter((l) => l.date >= from && l.date <= to).reduce((sum, l) => sum + l.durationMinutes, 0);

  const weekMinutes = minutesInRange(weekStart, today);
  const monthMinutes = minutesInRange(monthStart, today);

  // Learning streak: consecutive days with a session, ending today/yesterday.
  let streak = 0;
  let cursor = state.learning.some((l) => l.date === today) ? today : addDays(today, -1);
  for (let i = 0; i < 366; i++) {
    if (!state.learning.some((l) => l.date === cursor)) break;
    streak++;
    cursor = addDays(cursor, -1);
  }

  const bySubject = LEARNING_SUBJECTS.map((subject) => {
    const sessions = state.learning.filter((l) => l.subject === subject);
    const minutes = sessions.reduce((sum, l) => sum + l.durationMinutes, 0);
    return { subject, count: sessions.length, minutes };
  }).concat(
    // Subjects outside the defaults
    Object.keys(
      state.learning.reduce<Record<string, true>>((acc, l) => {
        if (!LEARNING_SUBJECTS.includes(l.subject)) acc[l.subject] = true;
        return acc;
      }, {}),
    ).map((subject) => {
      const sessions = state.learning.filter((l) => l.subject === subject);
      return { subject, count: sessions.length, minutes: sessions.reduce((sum, l) => sum + l.durationMinutes, 0) };
    }),
  );

  const sessions = [...state.learning].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <PageHeader
        title="Learning"
        sub="Track study sessions and build the learning habit."
        right={<button className="btn btn-primary" onClick={() => open({ kind: 'learning' })}>+ Add Session</button>}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="This week" value={fmtHours(weekMinutes)} sub="logged" accent />
        <StatTile label="This month" value={fmtHours(monthMinutes)} sub="logged" />
        <StatTile label="Streak" value={`${streak}d`} sub="consecutive days" />
        <StatTile label="Sessions" value={state.learning.length} sub="all-time" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Panel title="By subject" className="lg:col-span-1">
          <ul className="divide-y divide-hollow-line">
            {bySubject.map((s) => (
              <li key={s.subject} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-slate-300">{s.subject}</span>
                <span className="tabular-nums text-slate-500">{s.count} · {fmtHours(s.minutes)}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Session log" className="lg:col-span-2">
          {sessions.length === 0 ? (
            <Empty>No sessions yet. Log the first one.</Empty>
          ) : (
            <ul className="max-h-[460px] divide-y divide-hollow-line overflow-y-auto">
              {sessions.map((l) => (
                <li key={l.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-slate-200">{l.subject}</span>
                      <Badge className="border-accent/30 bg-accent/10 text-accent">{fmtHours(l.durationMinutes)}</Badge>
                      {!l.completed && <Badge className="border-warn/40 bg-warn/10 text-warn">planned</Badge>}
                    </div>
                    {l.topic && <div className="mt-0.5 text-xs text-slate-400">{l.topic}</div>}
                    <div className="mt-0.5 text-[11px] text-slate-600">{fmtDate(l.date)}</div>
                    {l.notes && <p className="mt-1 text-xs text-slate-500">{l.notes}</p>}
                  </div>
                  <button
                    className="btn !py-1 text-xs"
                    onClick={() => actions.toggleLearning(l.id)}
                    title={l.completed ? 'Mark as planned' : 'Mark complete'}
                  >
                    {l.completed ? '✓' : '○'}
                  </button>
                <ConfirmDelete onConfirm={() => actions.deleteLearning(l.id)} label="✕" />
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
