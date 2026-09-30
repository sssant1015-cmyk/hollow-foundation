import { useMemo, useState } from 'react';
import { actions, useStore } from '../store/store';
import { Badge, Empty, PageHeader, Panel, cx } from '../components/ui';
import { useModal } from '../components/ModalHost';
import { CATEGORY_LABEL, PRIORITY_CLASS, PRIORITY_LABEL, PRIORITY_ORDER, TASK_STATUS_LABEL } from '../lib/format';
import { fmtDate, todayKey } from '../lib/dates';
import type { Task, TaskCategory, TaskPriority, TaskStatus } from '../types';

type SortKey = 'due' | 'priority' | 'created' | 'status';

function ConfirmDelete({ onConfirm }: { onConfirm: () => void }) {
  const [armed, setArmed] = useState(false);
  return (
    <button
      className={cx('btn !py-1 text-xs', armed && 'btn-danger')}
      onClick={() => {
        if (armed) onConfirm();
        else {
          setArmed(true);
          setTimeout(() => setArmed(false), 2500);
        }
      }}
    >
      {armed ? 'Sure?' : 'Delete'}
    </button>
  );
}

function TaskCard({ task, onEdit }: { task: Task; onEdit: (t: Task) => void }) {
  const overdue = task.dueDate && task.dueDate < todayKey() && task.status !== 'done';
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <button
        onClick={() => actions.toggleTask(task.id)}
        aria-label={task.status === 'done' ? 'Reopen task' : 'Complete task'}
        className={cx(
          'mt-0.5 h-[18px] w-[18px] shrink-0 rounded border transition-colors',
          task.status === 'done' ? 'border-good bg-good/20 text-good' : 'border-hollow-line hover:border-accent',
        )}
      >
        {task.status === 'done' && <span className="block text-center text-[10px] leading-[16px]">✓</span>}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cx('text-sm font-medium', task.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-200')}>
            {task.title}
          </span>
          <Badge className={PRIORITY_CLASS[task.priority]}>{PRIORITY_LABEL[task.priority]}</Badge>
          {overdue && <Badge className="border-bad/40 bg-bad/10 text-bad">Overdue</Badge>}
        </div>
        {task.description && <p className="mt-1 text-xs text-slate-500">{task.description}</p>}
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
          <span>{CATEGORY_LABEL[task.category]}</span>
          <span>·</span>
          <span>{TASK_STATUS_LABEL[task.status]}</span>
          {task.dueDate && <><span>·</span><span className={overdue ? 'text-bad' : ''}>due {fmtDate(task.dueDate)}</span></>}
          {task.estimatedMinutes != null && <><span>·</span><span>~{task.estimatedMinutes}m</span></>}
          {task.status === 'done' && task.completedAt && (
            <><span>·</span><span className="text-good">done {fmtDate(task.completedAt.slice(0, 10))}</span></>
          )}
        </div>
      </div>
      {task.status !== 'done' && (
        <button
          className="btn !py-1 text-xs"
          onClick={() => actions.updateTask(task.id, { status: task.status === 'in_progress' ? 'todo' : 'in_progress' })}
        >
          {task.status === 'in_progress' ? 'Pause' : 'Start'}
        </button>
      )}
      <button className="btn !py-1 text-xs" onClick={() => onEdit(task)}>Edit</button>
      <ConfirmDelete onConfirm={() => actions.deleteTask(task.id)} />
    </div>
  );
}

export function Tasks() {
  const tasks = useStore((s) => s.tasks);
  const { open } = useModal();
  const [filterStatus, setFilterStatus] = useState<'all' | TaskStatus>('all');
  const [filterPriority, setFilterPriority] = useState<'all' | TaskPriority>('all');
  const [filterCategory, setFilterCategory] = useState<'all' | TaskCategory>('all');
  const [sort, setSort] = useState<SortKey>('due');
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    let list = tasks.filter((t) => {
      if (filterStatus === 'all') return true;
      return t.status === filterStatus;
    });
    if (filterPriority !== 'all') list = list.filter((t) => t.priority === filterPriority);
    if (filterCategory !== 'all') list = list.filter((t) => t.category === filterCategory);
    if (query) {
      const q = query.toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      switch (sort) {
        case 'due': {
          if (!a.dueDate && !b.dueDate) return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.localeCompare(b.dueDate) || PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        }
        case 'priority':
          return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
        case 'created':
          return b.createdAt.localeCompare(a.createdAt);
        case 'status':
          return a.status.localeCompare(b.status);
      }
    });
  }, [tasks, filterStatus, filterPriority, filterCategory, sort, query]);

  const counts = {
    open: tasks.filter((t) => t.status !== 'done').length,
    today: tasks.filter((t) => t.dueDate !== null && t.dueDate <= todayKey() && t.status !== 'done').length,
    done: tasks.filter((t) => t.status === 'done').length,
  };

  return (
    <div>
      <PageHeader
        title="Tasks"
        sub={`${counts.open} open · ${counts.today} due today · ${counts.done} done all-time`}
        right={
          <button className="btn btn-primary" onClick={() => open({ kind: 'task' })}>+ Add Task</button>
        }
      />
      <Panel>
        <div className="flex flex-wrap items-center gap-2 border-b border-hollow-line p-3">
          <select className="field !w-auto" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as 'all' | TaskStatus)}>
            <option value="all">All statuses</option>
            {(Object.keys(TASK_STATUS_LABEL) as TaskStatus[]).map((s) => (
              <option key={s} value={s}>{TASK_STATUS_LABEL[s]}</option>
            ))}
          </select>
          <select className="field !w-auto" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value as 'all' | TaskPriority)}>
            <option value="all">All priorities</option>
            {(Object.keys(PRIORITY_LABEL) as TaskPriority[]).map((s) => (
              <option key={s} value={s}>{PRIORITY_LABEL[s]}</option>
            ))}
          </select>
          <select className="field !w-auto" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value as 'all' | TaskCategory)}>
            <option value="all">All categories</option>
            {(Object.keys(CATEGORY_LABEL) as TaskCategory[]).map((c) => (
              <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
            ))}
          </select>
          <select className="field !w-auto" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
            <option value="due">Sort: due date</option>
            <option value="priority">Sort: priority</option>
            <option value="created">Sort: newest</option>
            <option value="status">Sort: status</option>
          </select>
          <input className="field !w-auto flex-1" placeholder="Filter by title…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <ul className="divide-y divide-hollow-line">
          {visible.length === 0 && <Empty>No tasks match. Add one or relax the filters.</Empty>}
          {visible.map((t) => (
            <li key={t.id}>
              <TaskCard task={t} onEdit={(task) => open({ kind: 'task', task })} />
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
