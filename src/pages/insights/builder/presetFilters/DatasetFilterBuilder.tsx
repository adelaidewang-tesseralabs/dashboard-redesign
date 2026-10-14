import { useState } from 'react'
import { Layers } from 'lucide-react'
import type { DashboardFilter, PresetOperator } from '../../../../data/dashboards'
import { cn } from '../../../../lib/cn'
import { FieldValuePanel } from './FieldValuePanel'
import { operatorsFor, type PresetField } from './presetFields'
import { curatesViewerFields } from './viewerFilters'

type DatasetFilterBuilderProps = {
  /** Every field for editors; for viewers, the presets, or every field when the dataset has none. */
  fields: PresetField[]
  /** This dataset's filters on the page. */
  filters: DashboardFilter[]
  canEdit: boolean
  /** Viewers only, by filter id: the editors' presets and the viewer's own picks within them. */
  viewer?: { presets: Record<string, string[]>; picks: Record<string, string[]> }
  /** `filter` is unset until the field first gets a value. */
  onValuesChange: (field: PresetField, filter: DashboardFilter | undefined, values: string[], operator: PresetOperator) => void
  onOperatorChange?: (filter: DashboardFilter, operator: PresetOperator) => void
  onClearAll: () => void
  onAllPagesChange?: (filterId: string, allPages: boolean) => void
  datasetLabel: string
}

const listValued = (field: PresetField) => field.type === 'select' || field.type === 'user'

/** Modeled on the main app's FilterBuilder: every field on the left with its pick count, the selected field's editor on the right. A field is a preset once it has a value. */
export function DatasetFilterBuilder({ fields, filters, canEdit, viewer, onValuesChange, onOperatorChange, onClearAll, onAllPagesChange, datasetLabel }: DatasetFilterBuilderProps) {
  const filterFor = (field: PresetField) => filters.find((filter) => filter.column === field.column)
  const valuesOf = (field: PresetField) => filterFor(field)?.values ?? []
  const [selectedColumn, setSelectedColumn] = useState<string | null>(() => fields.find((field) => valuesOf(field).length > 0)?.column ?? null)
  // Operators picked before the field has a value, so there's no filter to hold them yet.
  const [draftOperators, setDraftOperators] = useState<Record<string, PresetOperator>>({})
  const selected = fields.find((field) => field.column === selectedColumn)
  const selectedFilter = selected && filterFor(selected)
  const operatorOf = (field: PresetField) => filterFor(field)?.operator ?? draftOperators[field.column] ?? operatorsFor(field.type)[0]
  const countOf = (field: PresetField) => (listValued(field) ? valuesOf(field).length : Math.min(valuesOf(field).length, 1))
  const anyValues = viewer
    ? filters.some((filter) => !filter.locked && (viewer.picks[filter.id]?.length ?? 0) > 0)
    : filters.some((filter) => filter.values.length > 0)

  return (
    <div data-slot="filter-builder" className="flex max-h-96 min-h-55 w-120 flex-col overflow-hidden rounded-lg border border-white/20 bg-tlai-3 text-white/80">
      <div className="flex min-h-0 flex-1">
        <div className="flex w-44 shrink-0 flex-col gap-2 p-4 text-left text-xs">
          <ul className="-mx-1 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-1">
            {fields.length === 0 && <li className="px-1.5 text-white/50">No filters configured</li>}
            {fields.map((field) => {
              const count = countOf(field)
              return (
                <li key={field.column}>
                  <button
                    type="button"
                    onClick={() => setSelectedColumn(field.column)}
                    aria-pressed={field.column === selectedColumn}
                    aria-label={`${field.label} (${count})`}
                    className={cn(
                      'flex min-h-[30px] w-full cursor-pointer items-center justify-between gap-2 rounded px-1.5 text-left hover:bg-white/10 hover:text-white/70',
                      field.column === selectedColumn && 'bg-white/10 text-white',
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="truncate">{field.label}</span>
                      {count > 0 && filterFor(field)?.allPages && <Layers className="size-3 shrink-0 opacity-50" aria-label="On all pages" />}
                    </span>
                    {count > 0 && <span className="shrink-0 rounded-md bg-white/10 px-1.5 text-[11px] text-white tabular-nums">{count}</span>}
                  </button>
                </li>
              )
            })}
          </ul>
          <button
            type="button"
            disabled={!anyValues}
            onClick={onClearAll}
            className="h-7 shrink-0 cursor-pointer self-start rounded-md px-2 text-xs text-white/80 hover:bg-white/10 hover:text-white disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent"
          >
            Clear All
          </button>
        </div>
        <div aria-hidden className="w-px shrink-0 bg-white/15" />
        <div className={cn('flex min-w-0 flex-1 items-center justify-center overflow-y-auto p-4 text-center text-xs', selected && 'items-stretch')}>
          {selected ? (
            <FieldValuePanel
              key={selected.column}
              field={selected}
              values={viewer && selectedFilter ? (viewer.picks[selectedFilter.id] ?? []) : valuesOf(selected)}
              preset={viewer && selectedFilter ? (viewer.presets[selectedFilter.id] ?? []) : undefined}
              operator={operatorOf(selected)}
              locked={!canEdit && !!selectedFilter?.locked}
              onValuesChange={(values) => onValuesChange(selected, selectedFilter, values, operatorOf(selected))}
              onOperatorChange={
                canEdit
                  ? (operator) => (selectedFilter && onOperatorChange ? onOperatorChange(selectedFilter, operator) : setDraftOperators((current) => ({ ...current, [selected.column]: operator })))
                  : undefined
              }
              allPages={!!selectedFilter?.allPages}
              onAllPagesChange={selectedFilter && selectedFilter.values.length > 0 && onAllPagesChange ? (allPages) => onAllPagesChange(selectedFilter.id, allPages) : undefined}
              datasetLabel={datasetLabel}
            />
          ) : (
            'Select a field to start creating a filter.'
          )}
        </div>
      </div>
      {canEdit && (
        <p className="shrink-0 border-t border-white/15 px-4 py-2 text-left text-[11px] text-white/50">
          {filters.some((filter) => curatesViewerFields(filter, fields)) ? 'Viewers can filter only by fields with a preset.' : 'No presets: viewers can filter by any field.'}
        </p>
      )}
    </div>
  )
}
