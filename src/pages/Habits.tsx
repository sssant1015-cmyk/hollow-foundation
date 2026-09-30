import { useState } from 'react';
import { actions, useStore } from '../store/store';
import { Empty, PageHeader, Panel, cx } from '../components/ui';
import { useModal } from '../components/ModalHost';
import { addDays, fmtMonth, startOfWeek, todayKey } from '../lib/dates';
import { ConfirmDelete } from './shared';

export function HabitsPage() {
  const state = useStore((s) => s);
  const { open } = useModal();
  const today = todayKey();
  const [monthOffset, setMonthOffset] = useState(0);

  const viewDate = new Date();
  viewDate.setMonth(viewDate.getMonth() + monthOffset);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const doneOn = (habitId: string, date: string) => state.habitLogs.some((l) => l.habitId === habitId && l.date === date);

  // Last-7-day strip for quick context
  const weekStrip = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(today), i));

  const weekRate = state.habits.length
    ? Math.round(
        (state.habits.reduce((sum, h) => sum + weekStrip.filter((d) => doneOn(h.id, d)).length, 0) /
          (state.habits.length * 7)) *
          100,
      )
    : 0;

  return (
    <div>
      <PageHeader
        title="Habits"
        sub={`${state.habits.length} habits · ${weekRate}% consistency this week`}
        right={<button className="btn btn-primary" onClick={() => open({ kind: 'habit' })}>+ Add Habit</button>}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Today" className="lg:col-span-1">
          {state.habits.length === 0 ? (
            <Empty>No habits yet.</Empty>
          ) : (
            <ul className="divide-y divide-hollow-line">
              {state.habits.map((h) => {
                const done = doneOn(h.id, today);
                return (
                  <li key={h.id} className="flex items-center gap-3 px-4 py-3">
                    <button
                      onClick={() => actions.toggleHabitLog(h.id, today)}
                      className={cx(
                        'flex h-8 w-8 items-center justify-center rounded-lg border text-sm font-semibold transition-colors',
                        done ? 'border-good bg-good/20 text-good' : 'border-hollow-line text-slate-600 hover:border-accent',
                      )}
                      aria-label={done ? 'Unmark habit' : 'Mark habit complete'}
                    >
                      {done ? '✓' : ''}
                    </button>
                    <span className={cx('min-w-0 flex-1 truncate text-sm', done ? 'text-slate-400' : 'text-slate-200')}>{h.name}</span>
                    <button className="btn !py-1 text-xs" onClick={() => open({ kind: 'habit', habitId: h.id })}>Edit</button>
                    <ConfirmDelete onConfirm={() => actions.removeHabit(h.id)} label="✕" />
                  </li>
                );
              })}
            </ul>
          )}
          <div className="border-t border-hollow-line px-4 py-2 text-xs text-slate-500">
            {state.habits.filter((h) => doneOn(h.id, today)).length}/{state.habits.length} done today
          </div>
        </Panel>

        <Panel
          className="min-w-0 lg:col-span-2"
          title="Consistency"
          right={
            <div className="flex items-center gap-2 text-xs">
              <button className="btn !px-2 !py-0.5" onClick={() => setMonthOffset((m) => m - 1)}>‹</button>
              <span className="text-slate-400">{fmtMonth(year, month)}</span>
              <button className="btn !px-2 !py-0.5" onClick={() => setMonthOffset((m) => m + 1)}>›</button>
            </div>
          }
        >
          <div className="touch-pan-x overflow-x-auto p-4">
            <div className="min-w-[560px]">
              <div className="mb-2 grid grid-cols-[120px_repeat(31,1fr)] gap-px">
                <div />
                {Array.from({ length: daysInMonth }, (_, i) => (
                  <div key={i} className="text-center text-[9px] text-slate-600">
                    {i + 1}
                  </div>
                ))}
              </div>
              {state.habits.map((h) => (
                <div key={h.id} className="mb-1 grid grid-cols-[120px_repeat(31,1fr)] items-center gap-px">
                  <div className="truncate pr-2 text-xs text-slate-400">{h.name}</div>
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
                    const done = doneOn(h.id, date);
                    const future = date > today;
                    return (
                      <button
                        key={i}
                        onClick={() => !future && actions.toggleHabitLog(h.id, date)}
                        disabled={future}
                        title={`${h.name} · ${date}`}
                        className={cx(
                          'h-5 w-full rounded-sm',
                          done ? 'bg-good/70' : future ? 'bg-hollow-panel opacity-40' : 'bg-hollow-panel2 hover:bg-hollow-line',
                        )}
                        aria-label={`${h.name} on ${date}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-hollow-line px-4 py-2 text-xs text-slate-500">
            Click a square to toggle a day · green = done · future days locked · <span className="sm:hidden">swipe the grid sideways for the full month</span>
          </div>
        </Panel>
      </div>
    </div>
  );
}
