import { useEffect, useState } from 'react'
import type { Dashboard } from '../../../data/dashboards'
import { workstreamNames } from '../../../data/dashboards'
import { useDashboards, type DashboardDraft } from '../../../data/DashboardsStore'
import { Button } from '../../../ui/Button'
import { Dialog } from '../../../ui/Dialog'
import { Select, type SelectOption } from '../../../ui/Select'

type DashboardFormDialogProps = {
  open: boolean
  dashboard?: Dashboard
  onClose: () => void
  onSubmit: (draft: DashboardDraft) => void
}

const fieldClass =
  'h-9 w-full rounded-lg border border-white/10 bg-tlai-3 px-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/25'

/** Every known workstream, plus one just added here that no saved dashboard uses yet. */
const workstreamOptions = (names: string[]): SelectOption[] => [{ value: '', label: 'None' }, ...names.map((name) => ({ value: name, label: name }))]

/** Create / Edit dashboard modal — same fields as `CreateDashboardForm`. */
export function DashboardFormDialog({ open, dashboard, onClose, onSubmit }: DashboardFormDialogProps) {
  const { dashboards } = useDashboards()
  const [draft, setDraft] = useState<DashboardDraft>({ name: '', description: '', workstream: '' })

  useEffect(() => {
    if (!open) return
    setDraft({
      name: dashboard?.name ?? '',
      description: dashboard?.description ?? '',
      workstream: dashboard?.workstream ?? '',
    })
  }, [open, dashboard])

  const workstreams = workstreamNames(dashboards, [draft.workstream])

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
        <div className="flex flex-col gap-1.5 text-sm text-white/80">
          Workstream
          <Select
            aria-label="Workstream"
            size="form"
            value={draft.workstream}
            options={workstreamOptions(workstreams)}
            onChange={(workstream) => setDraft({ ...draft, workstream })}
            searchable
            searchPlaceholder="Search workstreams…"
            onCreate={(workstream) => setDraft({ ...draft, workstream })}
          />
        </div>
        <button type="submit" hidden />
      </form>
    </Dialog>
  )
}
