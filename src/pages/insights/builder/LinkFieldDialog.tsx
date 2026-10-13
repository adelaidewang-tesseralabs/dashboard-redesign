import { useState } from 'react'
import type { FieldLink, FieldRef } from '../../../data/dashboards'
import { Button } from '../../../ui/Button'
import { Dialog } from '../../../ui/Dialog'
import { Select } from '../../../ui/Select'
import { findFilterColumn, type FilterColumn } from './dashboardFilters'

type LinkFieldDialogProps = {
  from: FieldRef
  columns: FilterColumn[]
  /** Only offer this dataset's columns, e.g. a graph a filter couldn't reach. */
  datasetKey?: string
  /** Fields `from` is already linked to, directly or not; linking them again changes nothing. */
  linked: FieldRef[]
  onClose: () => void
  onLink: (link: FieldLink) => void
}

const fieldKey = (field: FieldRef) => `${field.datasetKey}::${field.column}`

/** Say that a column in another dataset means the same thing, so one filter narrows both. Values match by exact text. */
export function LinkFieldDialog({ from, columns, datasetKey, linked, onClose, onLink }: LinkFieldDialogProps) {
  const source = findFilterColumn(columns, from)
  const taken = new Set(linked.map(fieldKey))
  const candidates = columns.filter((column) => column.datasetKey !== from.datasetKey && (!datasetKey || column.datasetKey === datasetKey))
  const [pickedKey, setPickedKey] = useState(() => {
    const sameName = candidates.find((column) => !taken.has(fieldKey(column)) && column.column === from.column)
    return sameName ? fieldKey(sameName) : ''
  })
  const picked = candidates.find((column) => fieldKey(column) === pickedKey)
  const shared = picked && source ? source.values.filter((value) => picked.values.includes(value)) : []
  const link = () => picked && onLink({ id: crypto.randomUUID(), fields: [from, { datasetKey: picked.datasetKey, column: picked.column }] })

  return (
    <Dialog
      open
      onClose={onClose}
      title="Link field"
      description={source ? `Which column means the same as ${source.datasetLabel} · ${source.label}? Filters on either one will narrow both.` : undefined}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!picked} onClick={link}>
            Link
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {candidates.length === 0 ? (
          <p className="text-sm text-white/60">No other dataset on this dashboard has a text column to link to.</p>
        ) : (
          <Select
            aria-label="Column to link"
            size="form"
            value={pickedKey}
            placeholder="Pick a column"
            options={candidates.map((column) => ({
              value: fieldKey(column),
              label: column.label,
              group: column.datasetLabel,
              disabled: taken.has(fieldKey(column)),
            }))}
            onChange={setPickedKey}
          />
        )}
        {picked && source && (
          <p className="text-xs text-white/55">
            {shared.length === 0
              ? `No values in common with ${source.label}, so a filter would hide every row of ${picked.datasetLabel}.`
              : `${shared.length} of ${source.values.length} values match: ${shared.join(', ')}.`}
          </p>
        )}
      </div>
    </Dialog>
  )
}
