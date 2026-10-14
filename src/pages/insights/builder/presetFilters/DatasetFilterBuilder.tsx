import { useState } from 'react'
import { Layers, Plus } from 'lucide-react'
import type { DashboardFilter } from '../../../../data/dashboards'
import { cn } from '../../../../lib/cn'
import { findFilterColumn, type FilterColumn } from '../dashboardFilters'
import { AddFieldPanel } from './AddFieldPanel'
import { FieldValuePanel } from './FieldValuePanel'

const ADD = 'add'

type DatasetFilterBuilderProps = {
  /** This dataset's preset filters on the page. */
  presets: DashboardFilter[]
  /** This dataset's filterable columns. */
  columns: FilterColumn[]
  canEdit: boolean
  /** Opened from the toolbar's filter tool: start on "Add a field". */
  startAdding: boolean
  onValuesChange: (filterId: string, values: string[]) => void
  onClearAll: () => void
  onAdd?: (column: FilterColumn) => string
  onRemove?: (filterId: string) => void
  onAllPagesChange?: (filterId: string, allPages: boolean) => void
  datasetLabel: string
}

/** Modeled on the main app's FilterBuilder: fields with their pick counts on the left, the selected field's values on the right. */
export function DatasetFilterBuilder({ presets, columns, canEdit, startAdding, onValuesChange, onClearAll, onAdd, onRemove, onAllPagesChange, datasetLabel }: DatasetFilterBuilderProps) {
  const [selectedId, setSelectedId] = useState<string | null>(() => (startAdding || (canEdit && presets.length === 0) ? ADD : (presets[0]?.id ?? null)))
  const selected = presets.find((filter) => filter.id === selectedId)
  const unused = columns.filter((column) => !presets.some((filter) => filter.column === column.column))
  const anyValues = presets.some((filter) => filter.values.length > 0 && (canEdit || !filter.locked))

  return (
    <div data-slot="filter-builder" className="flex min-h-55 w-120 overflow-hidden rounded-lg border border-white/20 bg-tlai-3 text-white/80">
      <div className="flex w-40 shrink-0 flex-col gap-2 p-4 text-left text-xs">
        <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
          {presets.length === 0 && !canEdit && <li className="px-1.5 text-white/50">No filters configured</li>}
          {presets.map((filter) => (
            <li key={filter.id}>
              <button
                type="button"
                onClick={() => setSelectedId(filter.id)}
                aria-pressed={filter.id === selectedId}
                aria-label={`${filter.label} (${filter.values.length})`}
                className={cn(
                  'flex min-h-[30px] w-full cursor-pointer items-center justify-between gap-2 rounded px-1.5 text-left hover:bg-white/10 hover:text-white/70',
                  filter.id === selectedId && 'bg-white/10 text-white',
                )}
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate">{filter.label}</span>
                  {filter.allPages && <Layers className="size-3 shrink-0 opacity-50" aria-label="On all pages" />}
                </span>
                {filter.values.length > 0 && <span className="shrink-0 rounded-md bg-white/10 px-1.5 text-[11px] text-white tabular-nums">{filter.values.length}</span>}
              </button>
            </li>
          ))}
          {canEdit && (
            <li>
              <button
                type="button"
                onClick={() => setSelectedId(ADD)}
                aria-pressed={selectedId === ADD}
                className={cn(
                  'flex min-h-[30px] w-full cursor-pointer items-center gap-1.5 rounded px-1.5 text-left text-white/55 hover:bg-white/10 hover:text-white',
                  selectedId === ADD && 'bg-white/10 text-white',
                )}
              >
                <Plus className="size-3.5" aria-hidden />
                Add field
              </button>
            </li>
          )}
        </ul>
        <button
          type="button"
          disabled={!anyValues}
          onClick={onClearAll}
          className="mt-auto h-7 cursor-pointer self-start rounded-md px-2 text-xs text-white/80 hover:bg-white/10 hover:text-white disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent"
        >
          Clear All
        </button>
      </div>
      <div aria-hidden className="w-px shrink-0 bg-white/15" />
      <div className={cn('flex min-w-0 flex-1 items-center justify-center p-4 text-center text-xs', (selected || selectedId === ADD) && 'items-start')}>
        {selectedId === ADD && onAdd ? (
          <AddFieldPanel columns={unused} onAdd={(column) => setSelectedId(onAdd(column))} />
        ) : selected ? (
          <FieldValuePanel
            key={selected.id}
            filter={selected}
            column={findFilterColumn(columns, selected)}
            readOnly={!canEdit && !!selected.locked}
            onValuesChange={(values) => onValuesChange(selected.id, values)}
            onAllPagesChange={onAllPagesChange && ((allPages) => onAllPagesChange(selected.id, allPages))}
            datasetLabel={datasetLabel}
            onRemove={
              onRemove &&
              (() => {
                onRemove(selected.id)
                setSelectedId(presets.find((filter) => filter.id !== selected.id)?.id ?? (canEdit ? ADD : null))
              })
            }
          />
        ) : (
          'Select a field to start creating a filter.'
        )}
      </div>
    </div>
  )
}
