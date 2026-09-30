import { actions, useStore } from '../store/store';
import { Badge, Empty, PageHeader, Panel, cx } from '../components/ui';
import { addDays, fmtDate, startOfWeek, todayKey } from '../lib/dates';

/** Consecutive held days ending today (or yesterday if today isn't logged yet). */
function seedStreak(dates: Set<string>, today: string): number {
  let streak = 0;
  let cursor = dates.has(today) ? today : addDays(today, -1);
  while (dates.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function SaveSeedPage() {
  const state = useStore((s) => s);
  const today = todayKey();

  const sorted = [...state.seedLogs].map((l) => l.date).sort((a, b) => b.localeCompare(a));
  const dates = new Set(sorted);
  const streak = seedStreak(dates, today);

  // Longest streak across all history.
  let longest = 0;
  let run = 0;
  for (const d of [...dates].sort((a, b) => a.localeCompare(b))) {
    run = dates.has(addDays(d, -1)) ? run + 1 : 1;
    longest = Math.max(longest, run);
  }

  const last30 = Array.from({ length: 30 }, (_, i) => addDays(today, -(29 - i)));
  const held30 = last30.filter((d) => dates.has(d)).length;

  const weekStrip = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(today), i));

  const loggedToday = dates.has(today);
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  const hoursLeft = Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 3600000));

  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  const cleanYear = sorted.filter((d) => d.startsWith(String(now.getFullYear()))).length;

  return (
    <div>
      <PageHeader
        title="Save Seed"
        sub="Daily discipline tracker — hold the line, log the day."
        right={
          <Badge className={loggedToday ? 'border-good/40 bg-good/10 text-good' : 'border-bad/40 bg-bad/10 text-bad'}>
            {loggedToday ? 'Held today' : `${hoursLeft}h left today`}
          </Badge>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel className="lg:col-span-1" title="Today">
          <div className="p-4">
            <button
              onClick={() => actions.toggleSeed(today)}
              className={cx(
                'flex h-24 w-full flex-col items-center justify-center gap-1 rounded-xl border text-center transition-colors',
                loggedToday
                  ? 'border-good/50 bg-good/15 text-good'
                  : 'border-hollow-line bg-hollow-panel2 text-slate-300 hover:border-good/40 hover:bg-good/5',
              )}
              aria-label={loggedToday ? 'Unmark today as held' : 'Mark today as held'}
            >
              <span className="text-3xl font-semibold">{loggedToday ? '✓' : '○'}</span>
              <span className="text-xs uppercase tracking-widest">{loggedToday ? 'Seed held' : 'Tap if you held'}</span>
            </button>
            <p className="mt-3 text-xs text-slate-500">
              One tap a day. No notes, no friction — the calendar and streak tell the story.
            </p>
          </div>
        </Panel>

        <Panel className="lg:col-span-2" title="Streak">
          <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-4">
            {[
              { label: 'Current streak', value: `${streak}`, sub: loggedToday ? 'days held' : 'log today to extend' },
              { label: 'Longest streak', value: `${longest}`, sub: 'days' },
              { label: 'Last 30 days', value: `${held30}/30`, sub: 'days held' },
              { label: `Clean ${now.getFullYear()}`, value: `${cleanYear}`, sub: `day ${dayOfYear} of the year` },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">{s.label}</div>
                <div className="mt-1 text-2xl font-semibold tabular-nums text-white">{s.value}</div>
                <div className="text-xs text-slate-500">{s.sub}</div>
              </div>
            ))}
          </div>
          <div className="px-4 pb-4">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">This week</div>
            <div className="flex gap-1.5">
              {weekStrip.map((d) => {
                const done = dates.has(d);
                const isToday = d === today;
                return (
                  <button
                    key={d}
                    onClick={() => !isToday && actions.toggleSeed(d)}
                    disabled={isToday}
                    title={fmtDate(d)}
                    className={cx(
                      'flex h-9 flex-1 items-center justify-center rounded text-[10px] tabular-nums',
                      done ? 'bg-good/70 text-white' : 'bg-hollow-panel2 text-slate-600 hover:bg-hollow-line',
                      isToday && 'ring-1 ring-accent',
                    )}
                  >
                    {Number(d.slice(8, 10))}
                  </button>
                );
              })}
            </div>
          </div>
        </Panel>
      </div>

      <Panel className="mt-5" title="History">
        {sorted.length === 0 ? (
          <Empty>No days logged yet. The first tap starts the streak.</Empty>
        ) : (
          <div className="flex flex-wrap gap-1.5 p-4">
            {sorted.map((d) => (
              <button
                key={d}
                onClick={() => actions.toggleSeed(d)}
                title={`${fmtDate(d)} — click to remove`}
                className={cx(
                  'flex h-8 w-8 items-center justify-center rounded text-[10px] font-semibold tabular-nums',
                  d === today ? 'bg-good/70 text-white ring-1 ring-accent' : 'bg-good/20 text-good hover:bg-bad/20 hover:text-bad',
                )}
              >
                {Number(d.slice(8, 10))}
              </button>
            ))}
          </div>
        )}
        <div className="border-t border-hollow-line px-4 py-2 text-xs text-slate-500">
          Tap a green day to correct it · {sorted.length} total days held
        </div>
      </Panel>
    </div>
  );
}
