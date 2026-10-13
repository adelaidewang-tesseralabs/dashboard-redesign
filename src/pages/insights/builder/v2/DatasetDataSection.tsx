import { ArrowUpRight } from 'lucide-react'
import type { Dashboard } from '../../../../data/dashboards'
import { AGGREGATE_LABELS, aggregateLabel, columnTypes, defaultGraphValue, type Aggregate, type GraphQuery, type GraphSort, type RowFilter } from '../../../../data/transforms'
import type { CanvasItem, GraphItem } from '../../../../data/widgets'
import { Select } from '../../../../ui/Select'
import { filterColumns } from '../dashboardFilters'
import { EditorSection } from '../EditorFields'
import { datasetIcon, datasetResult, graphFor, itemDatasetKey, type Dataset } from './datasets'
import type { TransformColumn } from './transforms/controls'
import { FilterCards, isCardFilter } from './FilterCards'
import { TopNField } from './TopNField'
import { FiltersEditor } from './transforms/FiltersEditor'

type DatasetDataSectionProps = {
  item: GraphItem
  datasets: Dataset[]
  dashboard: Dashboard
  onChange: (item: CanvasItem) => void
  onOpenDataset: (key: string) => void
}

const DEFAULT_OPTION = 'default'
const VALUE_FNS = ['sum', 'avg', 'min', 'max'] as const

const SORT_OPTIONS: { value: string; label: string; sort?: GraphSort }[] = [
  { value: DEFAULT_OPTION, label: 'Dataset order' },
  { value: 'value-desc', label: 'Value, high to low', sort: { by: 'value', direction: 'desc' } },
  { value: 'value-asc', label: 'Value, low to high', sort: { by: 'value', direction: 'asc' } },
  { value: 'label-asc', label: 'Label, A to Z', sort: { by: 'label', direction: 'asc' } },
  { value: 'label-desc', label: 'Label, Z to A', sort: { by: 'label', direction: 'desc' } },
]

const valueId = (value: Aggregate) => (value.fn === 'count' ? 'count' : `${value.fn}:${value.field}`)

function parseValue(id: string): Aggregate | undefined {
  if (id === DEFAULT_OPTION) return undefined
  if (id === 'count') return { fn: 'count' }
  const [fn, field] = id.split(':')
  return { fn: fn as Aggregate['fn'], field }
}

/** Widget panel for builder V2: pick the dataset and what to group by, then the graph's own value, filters, sort and Top N. */
export function DatasetDataSection({ item, datasets, dashboard, onChange, onOpenDataset }: DatasetDataSectionProps) {
  const key = itemDatasetKey(item)
  const dataset = datasets.find((candidate) => candidate.key === key)
  const result = dataset ? datasetResult(dataset, dashboard) : undefined
  const types = result ? columnTypes(result) : new Map()
  const columns: TransformColumn[] = result?.ok ? result.columns.map((column) => ({ key: column, type: types.get(column) ?? 'text' })) : []
  const query = item.query ?? {}
  const groupKey = item.source === 'object' ? item.fieldKey : columns[0]?.key
  const setQuery = (patch: Partial<GraphQuery>) => onChange({ ...item, query: { ...query, ...patch } })
  const graphFilters = query.filters ?? []
  const setFilters = (filters: RowFilter[]) => setQuery({ filters: filters.length ? filters : undefined })
  const cardColumns = key ? filterColumns(dashboard).filter((column) => column.datasetKey === key) : []

  const switchDataset = (nextKey: string) => {
    const next = datasets.find((candidate) => candidate.key === nextKey)
    if (!next || nextKey === key) return
    const graph = graphFor(next)
    onChange({ ...graph, id: item.id, showTitle: item.showTitle, showDescription: item.showDescription, description: item.description })
  }

  const fallback = result && groupKey ? defaultGraphValue(result, groupKey) : { fn: 'count' as const }
  const valueOptions = [
    { value: DEFAULT_OPTION, label: `Default (${aggregateLabel(fallback)})` },
    { value: 'count', label: AGGREGATE_LABELS.count },
    ...columns
      .filter((column) => column.type === 'number' && column.key !== groupKey)
      .flatMap((column) => VALUE_FNS.map((fn) => ({ value: `${fn}:${column.key}`, label: aggregateLabel({ fn, field: column.key }), group: column.key }))),
  ]
  const sortValue = SORT_OPTIONS.find((option) => option.sort?.by === query.sort?.by && option.sort?.direction === query.sort?.direction)?.value ?? DEFAULT_OPTION

  return (
    <>
      <EditorSection
        title="Data"
        action={
          dataset && (
            <button type="button" onClick={() => onOpenDataset(dataset.key)} className="flex cursor-pointer items-center gap-1 text-xs text-white/55 hover:text-white">
              Open in Data
              <ArrowUpRight className="size-3.5" />
            </button>
          )
        }
      >
        <span className="text-xs text-white/50">Dataset</span>
        <Select
          aria-label="Dataset"
          value={key ?? ''}
          placeholder="Standalone SQL query"
          options={datasets.map((candidate) => {
            const Icon = datasetIcon(candidate)
            return { value: candidate.key, label: candidate.label, icon: <Icon className="size-4 text-white/55" /> }
          })}
          onChange={switchDataset}
        />
        {item.source === 'object' && dataset?.kind === 'table' && (
          <>
            <span className="text-xs text-white/50">Group by</span>
            <Select
              aria-label="Group by"
              value={item.fieldKey}
              options={dataset.object.fields.map((field) => ({ value: field.key, label: field.label }))}
              onChange={(fieldKey) => onChange({ ...item, fieldKey })}
            />
          </>
        )}
        {item.source === 'sql' && dataset?.kind === 'sql' && (
          <pre className="max-h-32 overflow-auto rounded-md border border-white/10 bg-white/[0.03] p-2 font-mono text-[11px] leading-5 whitespace-pre-wrap text-white/70">
            {dataset.dataset.sql}
          </pre>
        )}
      </EditorSection>

      <EditorSection title="Value">
        <Select
          aria-label="Value"
          value={query.value ? valueId(query.value) : DEFAULT_OPTION}
          options={valueOptions}
          onChange={(id) => setQuery({ value: parseValue(id) })}
        />
        {item.source === 'sql' && query.value && <p className="text-xs text-white/45">Grouped by {groupKey}, the query's first column.</p>}
      </EditorSection>

      <EditorSection title="Filters">
        <p className="-mt-1 text-xs text-white/45">Only this graph. Page filters and dataset filters also apply.</p>
        <FilterCards columns={cardColumns} groupKey={groupKey} filters={graphFilters} onChange={setFilters} />
        <span className="mt-1 text-xs text-white/50">Conditions</span>
        <FiltersEditor
          compact
          filters={graphFilters.filter((filter) => !isCardFilter(filter))}
          columns={columns}
          onChange={(conditions) => setFilters([...graphFilters.filter(isCardFilter), ...conditions])}
        />
      </EditorSection>

      <EditorSection title="Sort and limit">
        <span className="text-xs text-white/50">Sort</span>
        <Select
          aria-label="Sort"
          value={sortValue}
          options={SORT_OPTIONS.map(({ value, label }) => ({ value, label }))}
          onChange={(value) => setQuery({ sort: SORT_OPTIONS.find((option) => option.value === value)?.sort })}
        />
        <TopNField
          itemId={item.id}
          limit={query.limit}
          onChange={(limit) => {
            const next: Partial<GraphQuery> = { limit }
            // Top N needs an order to mean "largest", so default to value, high to low.
            if (limit && !query.sort) next.sort = { by: 'value', direction: 'desc' }
            setQuery(next)
          }}
        />
      </EditorSection>
    </>
  )
}
