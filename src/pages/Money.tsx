import { actions, useStore } from '../store/store';
import { Bar, Empty, PageHeader, Panel, StatTile, cx } from '../components/ui';
import { useModal } from '../components/ModalHost';
import { EXPENSE_CATEGORY_LABEL } from '../lib/format';
import { fmtCents } from '../lib/money';
import { fmtDate, todayKey, startOfWeek } from '../lib/dates';
import { ConfirmDelete } from './shared';

export function MoneyPage() {
  const state = useStore((s) => s);
  const { open } = useModal();
  const currency = state.settings.currency;
  const today = todayKey();
  const monthStart = today.slice(0, 8) + '01';
  const weekStart = startOfWeek(today);

  const incomeCents = state.income.reduce((sum, i) => sum + i.amount, 0);
  const expenseCents = state.expenses.filter((e) => e.category !== 'savings').reduce((sum, e) => sum + e.amount, 0);
  const savedThisMonth = state.expenses
    .filter((e) => e.date >= monthStart && e.date <= today && e.category === 'savings')
    .reduce((sum, e) => sum + e.amount, 0);
  const spentThisWeek = state.expenses
    .filter((e) => e.date >= weekStart && e.date <= today && e.category !== 'savings')
    .reduce((sum, e) => sum + e.amount, 0);

  const byCategory = Object.entries(
    state.expenses
      .filter((e) => e.category !== 'savings')
      .reduce<Record<string, number>>((acc, e) => {
        acc[e.category] = (acc[e.category] ?? 0) + e.amount;
        return acc;
      }, {}),
  ).sort((a, b) => b[1] - a[1]);

  const savingsPct = state.savings.goal > 0 ? Math.min(100, Math.round((state.savings.current / state.savings.goal) * 100)) : 0;

  const txns: { id: string; date: string; label: string; sub: string; cents: number; kind: 'income' | 'expense'; onRemove: () => void }[] = [
    ...state.income.map((i) => ({ id: i.id, date: i.date, label: i.source, sub: 'Income', cents: i.amount, kind: 'income' as const, onRemove: () => actions.deleteIncome(i.id) })),
    ...state.expenses.map((e) => ({ id: e.id, date: e.date, label: EXPENSE_CATEGORY_LABEL[e.category], sub: e.notes || 'Expense', cents: e.amount, kind: 'expense' as const, onRemove: () => actions.deleteExpense(e.id) })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div>
      <PageHeader
        title="Money"
        sub="Income, expenses and savings — JMD-first, exact cents."
        right={
          <div className="flex gap-2">
            <button className="btn" onClick={() => open({ kind: 'income' })}>+ Income</button>
            <button className="btn btn-primary" onClick={() => open({ kind: 'expense' })}>+ Expense</button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Savings" value={fmtCents(state.savings.current, currency)} accent sub={state.savings.goal > 0 ? `${savingsPct}% of goal` : 'set a goal'} />
        <StatTile label="Saved this month" value={fmtCents(savedThisMonth, currency)} sub="via Savings expenses" />
        <StatTile label="Spent this week" value={fmtCents(spentThisWeek, currency)} sub="excl. savings transfers" />
        <StatTile label="All-time net" value={fmtCents(incomeCents - expenseCents, currency)} sub="income − expenses" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <Panel
          title="Savings Goal"
          className="lg:col-span-1"
          right={<button className="text-xs text-accent hover:underline" onClick={() => open({ kind: 'savings' })}>Edit</button>}
        >
          <div className="space-y-3 p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-semibold tabular-nums text-white">{fmtCents(state.savings.current, currency)}</span>
              <span className="text-sm text-slate-500">of {fmtCents(state.savings.goal, currency)}</span>
            </div>
            <Bar pct={savingsPct} className="h-2" barClass={savingsPct >= 100 ? 'bg-good' : undefined} />
            <div className="flex justify-between text-xs text-slate-500">
              <span>{savingsPct}%</span>
              <span>{state.savings.goal > 0 ? (state.savings.goal > state.savings.current ? `${fmtCents(state.savings.goal - state.savings.current, currency)} to go` : 'goal reached') : 'no goal set'}</span>
            </div>
          </div>
        </Panel>

        <Panel title="Where money goes" className="lg:col-span-2">
          {byCategory.length === 0 ? (
            <Empty>No expenses yet.</Empty>
          ) : (
            <div className="space-y-2.5 p-4">
              {byCategory.map(([cat, cents]) => {
                const share = Math.round((cents / Math.max(1, expenseCents)) * 100);
                return (
                  <div key={cat}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-slate-300">{EXPENSE_CATEGORY_LABEL[cat as keyof typeof EXPENSE_CATEGORY_LABEL] ?? cat}</span>
                      <span className="tabular-nums text-slate-500">{fmtCents(cents, currency)} · {share}%</span>
                    </div>
                    <Bar pct={share} className="h-1" barClass="bg-slate-500" />
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Transactions" className="mt-5">
        <div className="max-h-[420px] overflow-y-auto">
          {txns.length === 0 ? (
            <Empty>No transactions yet. Log income and expenses with the buttons above.</Empty>
          ) : (
            <ul className="divide-y divide-hollow-line">
              {txns.map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <span className={cx('w-20 shrink-0 tabular-nums text-xs', t.kind === 'income' ? 'text-good' : 'text-slate-500')}>
                    {fmtDate(t.date).replace(/^\w{3} /, '')}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-slate-200">{t.label}</span>
                    {t.sub && t.sub !== 'Expense' && t.sub !== 'Income' && <span className="block text-xs text-slate-500">{t.sub}</span>}
                  </span>
                  <span className={cx('tabular-nums', t.kind === 'income' ? 'text-good' : 'text-slate-300')}>
                    {t.kind === 'income' ? '+' : '−'}
                    {fmtCents(t.cents, currency)}
                  </span>
                  <ConfirmDelete onConfirm={t.onRemove} label="✕" />
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>
    </div>
  );
}
