import { useEffect, useState } from 'react'
import type { Dashboard } from '../../../data/dashboards'
import { WORKSTREAMS } from '../../../data/dashboards'
import type { DashboardDraft } from '../../../data/DashboardsStore'
import { Button } from '../../../ui/Button'
import { Dialog } from '../../../ui/Dialog'

type DashboardFormDialogProps = {
  open: boolean
  dashboard?: Dashboard
  onClose: () => void
  onSubmit: (draft: DashboardDraft) => void
}

const fieldClass =
  'h-9 w-full rounded-lg border border-white/10 bg-tlai-3 px-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/25'

/** Create / Edit dashboard modal — same fields as `CreateDashboardForm`. */
export function DashboardFormDialog({ open, dashboard, onClose, onSubmit }: DashboardFormDialogProps) {
  const [draft, setDraft] = useState<DashboardDraft>({ name: '', description: '', workstream: '' })

  useEffect(() => {
    if (!open) return
    setDraft({
      name: dashboard?.name ?? '',
      description: dashboard?.description ?? '',
      workstream: dashboard?.workstream ?? '',
    })
  }, [open, dashboard])

  const editing = dashboard != null
  const canSubmit = draft.name.trim().length > 0

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? 'Edit dashboard' : 'Create dashboard'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!canSubmit} onClick={() => onSubmit({ ...draft, name: draft.name.trim() })}>
            {editing ? 'Save' : 'Create'}
          </Button>
        </>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          if (canSubmit) onSubmit({ ...draft, name: draft.name.trim() })
        }}
      >
        <label className="flex flex-col gap-1.5 text-sm text-white/80">
          <span>
            Name <span className="text-red-400">*</span>
          </span>
          <input
            autoFocus
            className={fieldClass}
            value={draft.name}
            onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            placeholder="e.g. Vendor Master Data"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm text-white/80">
          Description
          <textarea
            rows={3}
            className={`${fieldClass} h-auto py-2`}
            value={draft.description}
            onChange={(event) => setDraft({ ...draft, description: event.target.value })}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm text-white/80">
          Workstream
          <input
            list="workstream-options"
            className={fieldClass}
            value={draft.workstream}
            onChange={(event) => setDraft({ ...draft, workstream: event.target.value })}
            placeholder="Pick or type a workstream"
          />
          <datalist id="workstream-options">
            {WORKSTREAMS.map((workstream) => (
              <option key={workstream} value={workstream} />
            ))}
          </datalist>
        </label>
        <button type="submit" hidden />
      </form>
    </Dialog>
  )
}
