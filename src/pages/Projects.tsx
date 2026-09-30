import { useState } from 'react';
import { actions, useStore } from '../store/store';
import { Badge, Bar, Empty, PageHeader, Panel, cx } from '../components/ui';
import { useModal } from '../components/ModalHost';
import { PROJECT_STATUS_CLASS, PROJECT_STATUS_LABEL } from '../lib/format';
import { fmtDate } from '../lib/dates';
import { ConfirmDelete } from './shared';
import type { Project } from '../types';

function ProjectCard({ project, onEdit }: { project: Project; onEdit: (p: Project) => void }) {
  return (
    <div className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-white">{project.name}</h3>
            <Badge className={PROJECT_STATUS_CLASS[project.status]}>{PROJECT_STATUS_LABEL[project.status]}</Badge>
          </div>
          {project.description && <p className="mt-1 text-xs text-slate-500">{project.description}</p>}
        </div>
        <div className="flex shrink-0 gap-1.5">
          <button className="btn !py-1 text-xs" onClick={() => onEdit(project)}>Edit</button>
          <ConfirmDelete onConfirm={() => actions.deleteProject(project.id)} />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <Bar pct={project.progress} className="flex-1" barClass={project.progress >= 100 ? 'bg-good' : undefined} />
        <span className="text-xs tabular-nums text-slate-400">{project.progress}%</span>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        {project.currentMilestone && (
          <>
            <dt className="text-slate-600">Milestone</dt>
            <dd className="text-slate-300">{project.currentMilestone}</dd>
          </>
        )}
        {project.nextAction && (
          <>
            <dt className="text-slate-600">Next action</dt>
            <dd className="text-slate-300">{project.nextAction}</dd>
          </>
        )}
        <dt className="text-slate-600">Priority</dt>
        <dd className="capitalize text-slate-400">{project.priority}</dd>
        {project.startDate && (
          <>
            <dt className="text-slate-600">Start</dt>
            <dd className="text-slate-400">{fmtDate(project.startDate)}</dd>
          </>
        )}
        {project.targetDate && (
          <>
            <dt className="text-slate-600">Target</dt>
            <dd className="text-slate-400">{fmtDate(project.targetDate)}</dd>
          </>
        )}
      </dl>

      {project.notes && (
        <p className="mt-3 whitespace-pre-wrap border-t border-hollow-line pt-2 text-xs text-slate-500">{project.notes}</p>
      )}
    </div>
  );
}

export function Projects() {
  const projects = useStore((s) => s.projects);
  const { open } = useModal();
  const [statusFilter, setStatusFilter] = useState<'all' | Project['status']>('all');

  const visible = projects.filter((p) => statusFilter === 'all' || p.status === statusFilter);

  return (
    <div>
      <PageHeader
        title="Projects"
        sub={`${projects.filter((p) => p.status === 'active').length} active · ${projects.filter((p) => p.status === 'planned').length} planned`}
        right={<button className="btn btn-primary" onClick={() => open({ kind: 'project' })}>+ Add Project</button>}
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {(['all', 'active', 'planned', 'paused', 'completed', 'archived'] as const).map((st) => (
          <button
            key={st}
            className={cx('btn !py-1 text-xs capitalize', statusFilter === st && 'btn-primary')}
            onClick={() => setStatusFilter(st)}
          >
            {st}
          </button>
        ))}
      </div>
      {visible.length === 0 ? (
        <Panel><Empty>No projects here yet.</Empty></Panel>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visible.map((p) => (
            <Panel key={p.id}>
              <ProjectCard project={p} onEdit={(proj) => open({ kind: 'project', projectId: proj.id })} />
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
