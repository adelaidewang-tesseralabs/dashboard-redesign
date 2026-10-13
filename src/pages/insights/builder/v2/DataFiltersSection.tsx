import type { ReactNode } from 'react'
import { ArrowUpToLine } from 'lucide-react'
import type { Dashboard } from '../../../../data/dashboards'
import { runSql } from '../../../../data/dataSources'
import { EMPTY_TRANSFORMS, applyTransforms, columnTypes, type DatasetTransforms, type RowFilter } from '../../../../data/transforms'
import type { GraphItem } from '../../../../data/widgets'
import type { FilterColumn } from '../dashboardFilters'
import { EditorSection } from '../EditorFields'
import { datasetSql, datasetUsage, type Dataset } from './datasets'
import { FilterCards, isCardFilter } from './FilterCards'
import { ApplyBar } from './transforms/ApplyBar'
import type { TransformColumn } from './transforms/controls'
import { FiltersEditor } from './transforms/FiltersEditor'
import { graphsBrokenBy } from './transforms/graphBreakage'
import { sameTransforms, type TransformDrafts } from './transforms/transformDrafts'

export type ApplyTransforms = (datasetKey: string, datasetLabel: string, transforms: DatasetTransforms) => void

type DataFiltersSectionProps = {
  item: GraphItem
  dataset: Dataset | undefined
  dashboard: Dashboard
  /** Columns of the dataset result this graph reads. */
  columns: TransformColumn[]
  cardColumns: FilterColumn[]
  groupKey: string | undefined
  onGraphFiltersChange: (filters: RowFilter[]) => void
  transformDrafts: TransformDrafts
  onApplyTransforms: ApplyTransforms
}

/** Dataset filters run after calculations and before grouping, so they see source and calculated columns. */
function filterableColumns(dataset: Dataset, transforms: DatasetTransforms): TransformColumn[] {
  const result = applyTransforms(runSql(datasetSql(dataset)), { ...EMPTY_TRANSFORMS, calculations: transforms.calculations })
  if (!result.ok) return []
  const types = columnTypes(result)
  return result.columns.map((key) => ({ key, type: types.get(key) ?? 'text' }))
}

const graphs = (count: number) => (count === 1 ? '1 graph' : `${count} graphs`)

/** Data filters build the numbers: the dataset group shapes every graph on it, the graph group only this one. */
export function DataFiltersSection(props: DataFiltersSectionProps) {
  const { item, dataset, dashboard, columns, cardColumns, groupKey, onGraphFiltersChange, transformDrafts, onApplyTransforms } = props
  const graphFilters = item.query?.filters ?? []
  const applied = dataset ? dashboard.datasetTransforms?.[dataset.key] : undefined
  const draft = dataset ? transformDrafts.drafts[dataset.key] : undefined
  const working = draft ?? applied ?? EMPTY_TRANSFORMS
  const pending = draft && !sameTransforms(draft, applied) ? draft : undefined
  const usedIn = dataset ? datasetUsage(dashboard.widgets ?? [], dataset.key) : []
  const filterable = dataset ? filterableColumns(dataset, working) : []

  const setDatasetFilters = (filters: RowFilter[]) => {
    if (!dataset) return
    const next = { ...working, filters }
    transformDrafts.setDraft(dataset.key, sameTransforms(next, applied) ? null : next)
  }

  const promote = (filter: RowFilter): ReactNode => {
    if (!dataset) return null
    if (working.filters.some((entry) => entry.id === filter.id)) {
      return <span className="w-full text-[11px] text-amber-200/80">Moves to the dataset filters when you apply</span>
    }
    const available = filterable.some((column) => column.key === filter.key)
    return (
      <button
        type="button"
        disabled={!available}
        title={available ? undefined : `${dataset.label} has no ${filter.key} column before grouping`}
        onClick={() => setDatasetFilters([...working.filters, filter])}
        className="flex w-full cursor-pointer items-center gap-1.5 text-[11px] text-white/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-white/50"
      >
        <ArrowUpToLine className="size-3" />
        Use for all {graphs(usedIn.length)} on this dataset
      </button>
    )
  }

  return (
    <EditorSection title="Data filters">
      {dataset && (
        <FilterGroup title="Dataset" detail={`All ${graphs(usedIn.length)} on ${dataset.label}`}>
          <FiltersEditor compact filters={working.filters} columns={filterable} addLabel="Add dataset filter" onChange={setDatasetFilters} />
          {pending && (
            <ApplyBar
              className="-mx-2.5 -mb-2.5 rounded-b-lg"
              breaks={graphsBrokenBy(dashboard, dataset.key, pending, usedIn)}
              graphCount={usedIn.length}
              onDiscard={() => transformDrafts.setDraft(dataset.key, null)}
              onApply={() => onApplyTransforms(dataset.key, dataset.label, pending)}
            />
          )}
        </FilterGroup>
      )}
      <FilterGroup title="This graph" detail={dataset ? 'Runs after the dataset filters' : 'Only this graph'}>
        <FilterCards columns={cardColumns} groupKey={groupKey} filters={graphFilters} onChange={onGraphFiltersChange} />
        <FiltersEditor
          compact
          filters={graphFilters.filter((filter) => !isCardFilter(filter))}
          columns={columns}
          addLabel="Add graph filter"
          rowAction={dataset ? promote : undefined}
          onChange={(conditions) => onGraphFiltersChange([...graphFilters.filter(isCardFilter), ...conditions])}
        />
      </FilterGroup>
      <p className="text-[11px] text-white/40">Shift-click graphs on the canvas to filter several at once.</p>
    </EditorSection>
  )
}

export function FilterGroup({ title, detail, children }: { title: string; detail: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-white/10 p-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="shrink-0 text-xs font-medium whitespace-nowrap text-white">{title}</span>
        <span className="truncate text-[11px] text-white/45">{detail}</span>
      </div>
      {children}
    </div>
  )
}
