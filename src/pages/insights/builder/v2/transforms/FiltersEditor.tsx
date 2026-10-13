import type { ReactNode } from 'react'
import { FILTER_OPERATOR_LABELS, isListOperator, isNullOperator, operatorsFor, type FilterOperator, type RowFilter } from '../../../../../data/transforms'
import { cn } from '../../../../../lib/cn'
import { Select } from '../../../../../ui/Select'
import { AddRowButton, RemoveButton, Slot, TransformRow, columnOptions, fieldInputClass, withCurrent, type TransformColumn } from './controls'

type FiltersEditorProps = {
  filters: RowFilter[]
  columns: TransformColumn[]
  onChange: (filters: RowFilter[]) => void
  /** Narrow widget-panel layout: each control takes the full row. */
  compact?: boolean
  /** Extra control at the end of a row, e.g. moving a graph condition up to its dataset. */
  rowAction?: (filter: RowFilter) => ReactNode
  addLabel?: string
}

/** Row conditions; list operators take comma-separated values and the empty checks take none. */
export function FiltersEditor({ filters, columns, onChange, compact = false, rowAction, addLabel = 'Add filter' }: FiltersEditorProps) {
  const typeOf = (key: string) => columns.find((column) => column.key === key)?.type
  const update = (index: number, patch: Partial<RowFilter>) =>
    onChange(
      filters.map((filter, at) => {
        if (at !== index) return filter
        const next = { ...filter, ...patch }
        // A new column can make the operator inapplicable (e.g. `contains` on a number); equals works for every type.
        if (patch.key !== undefined && !operatorsFor(typeOf(next.key)).includes(next.operator)) next.operator = 'eq'
        return next
      }),
    )
  const add = () => onChange([...filters, { id: crypto.randomUUID(), key: columns[0].key, operator: 'eq', value: '' }])

  return (
    <>
      {filters.map((filter, index) => {
        const operators = operatorsFor(typeOf(filter.key))
        return (
          <TransformRow key={filter.id}>
            <Slot className={compact ? 'w-[calc(100%-2.25rem)]' : 'w-44'}>
              <Select
                aria-label={`Filter ${index + 1} column`}
                value={filter.key}
                options={withCurrent(columnOptions(columns), filter.key)}
                onChange={(key) => update(index, { key })}
              />
            </Slot>
            {compact && <RemoveButton label={`Remove filter ${index + 1}`} onClick={() => onChange(filters.filter((_, at) => at !== index))} />}
            <Slot className={compact ? 'w-full' : 'w-36'}>
              <Select
                aria-label={`Filter ${index + 1} operator`}
                value={filter.operator}
                options={(operators.includes(filter.operator) ? operators : [filter.operator, ...operators]).map((operator) => ({
                  value: operator,
                  label: FILTER_OPERATOR_LABELS[operator],
                }))}
                onChange={(operator) => update(index, { operator: operator as FilterOperator })}
              />
            </Slot>
            {!isNullOperator(filter.operator) && (
              <input
                aria-label={`Filter ${index + 1} value`}
                value={filter.value}
                placeholder={isListOperator(filter.operator) ? 'Values, comma-separated' : 'Value'}
                onChange={(event) => update(index, { value: event.target.value })}
                className={cn(fieldInputClass, compact ? 'w-full' : isListOperator(filter.operator) ? 'w-64' : 'w-44')}
              />
            )}
            {!compact && <RemoveButton label={`Remove filter ${index + 1}`} onClick={() => onChange(filters.filter((_, at) => at !== index))} />}
            {rowAction?.(filter)}
          </TransformRow>
        )
      })}
      <AddRowButton label={addLabel} disabled={columns.length === 0} onClick={add} />
    </>
  )
}
