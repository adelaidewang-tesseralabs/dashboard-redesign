import { useState } from 'react'
import type { Dashboard, DashboardFilter } from '../../../data/dashboards'
import { Button } from '../../../ui/Button'
import { Dialog } from '../../../ui/Dialog'
import { Select, type SelectOption } from '../../../ui/Select'
import { EditorCheckbox } from './EditorFields'
import { filterReach, findFilterColumn, type FilterColumn } from './dashboardFilters'

type FilterSettingsDialogProps = {
  dashboard: Dashboard
  filter: DashboardFilter
  columns: FilterColumn[]
  onClose: () => void
  onSave: (filter: DashboardFilter) => void
}

const fieldClass =
  'h-9 w-full rounded-lg border border-white/10 bg-tlai-3 px-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/25'

const SELECTION_OPTIONS: SelectOption[] = [
  { value: 'multiple', label: 'Multiple values' },
  { value: 'single', label: 'One value' },
]

const columnKey = (column: Pick<FilterColumn, 'datasetKey' | 'column'>) => `${column.datasetKey}::${column.column}`

/** Mounted only while open, so each opening starts from the saved filter. */
export function FilterSettingsDialog({ dashboard, filter, columns, onClose, onSave }: FilterSettingsDialogProps) {
  const [draft, setDraft] = useState(filter)
  const column = findFilterColumn(columns, draft)
  const taken = new Set((dashboard.filters ?? []).filter((entry) => entry.id !== filter.id).map(columnKey))
  const fieldOptions: SelectOption[] = columns.map((entry) => ({
    value: columnKey(entry),
    label: entry.label,
    group: entry.datasetLabel,
    disabled: taken.has(columnKey(entry)),
  }))
  const reach = filterReach(dashboard, draft)
  const canSave = draft.label.trim().length > 0 && column !== undefined

  const pickField = (key: string) => {
    const next = columns.find((entry) => columnKey(entry) === key)
    if (!next) return
    const renamed = !column || draft.label === column.label ? next.label : draft.label
    setDraft({ ...draft, datasetKey: next.datasetKey, column: next.column, label: renamed, values: [] })
  }
  const save = () => canSave && onSave({ ...draft, label: draft.label.trim() })

  return (
    <Dialog
      open
      onClose={onClose}
      title="Edit filter"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!canSave} onClick={save}>
            Save
          </Button>
        </>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault()
          save()
        }}
      >
        <label className="flex flex-col gap-1.5 text-sm text-white/80">
          Title
          <input autoFocus className={fieldClass} value={draft.label} onChange={(event) => setDraft({ ...draft, label: event.target.value })} />
        </label>
        <div className="flex flex-col gap-1.5 text-sm text-white/80">
          Field
          <Select
            aria-label="Field"
            size="form"
            value={column ? columnKey(column) : ''}
            placeholder="This filter's field is no longer available"
            options={fieldOptions}
            onChange={pickField}
          />
          <span className="text-xs text-white/45">
            {column
              ? `Applies to ${reach.reached.length} of ${reach.total === 1 ? '1 graph' : `${reach.total} graphs`} on this page. Changing the field clears the picked values.`
              : 'Pick a field from one of the dashboard’s datasets.'}
          </span>
        </div>
        <div className="flex flex-col gap-1.5 text-sm text-white/80">
          Selection
          <Select
            aria-label="Selection"
            size="form"
            value={draft.selection ?? 'multiple'}
            options={SELECTION_OPTIONS}
            onChange={(selection) =>
              setDraft({ ...draft, selection: selection === 'single' ? 'single' : 'multiple', values: selection === 'single' ? draft.values.slice(0, 1) : draft.values })
            }
          />
        </div>
        <div className="flex flex-col gap-1">
          <EditorCheckbox label="Lock for viewers" checked={!!draft.locked} onChange={(locked) => setDraft({ ...draft, locked: locked || undefined })} />
          <span className="pl-6 text-xs text-white/45">Viewers see the picked values but can't change them.</span>
        </div>
      </form>
    </Dialog>
  )
}
