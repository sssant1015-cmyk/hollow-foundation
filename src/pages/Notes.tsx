import { actions, useStore } from '../store/store';
import { Empty, PageHeader, Panel } from '../components/ui';
import { useModal } from '../components/ModalHost';
import { fmtDate } from '../lib/dates';
import { ConfirmDelete } from './shared';

export function NotesPage() {
  const notes = useStore((s) => s.notes);
  const { open } = useModal();

  return (
    <div>
      <PageHeader
        title="Notes"
        sub="Loose thoughts, ideas and reference text — searchable from anywhere."
        right={<button className="btn btn-primary" onClick={() => open({ kind: 'note' })}>+ Add Note</button>}
      />
      {notes.length === 0 ? (
        <Panel>
          <Empty>No notes yet.</Empty>
        </Panel>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {notes.map((n) => (
            <Panel key={n.id}>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="min-w-0 truncate text-sm font-semibold text-white">{n.title}</h3>
                  <div className="flex shrink-0 gap-1.5">
                    <button className="btn !py-1 text-xs" onClick={() => open({ kind: 'note', noteId: n.id })}>Edit</button>
                    <ConfirmDelete onConfirm={() => actions.deleteNote(n.id)} label="✕" />
                  </div>
                </div>
                <p className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap text-xs text-slate-400">{n.body}</p>
                <div className="mt-2 text-[11px] text-slate-600">Updated {fmtDate(n.updatedAt.slice(0, 10))}</div>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
