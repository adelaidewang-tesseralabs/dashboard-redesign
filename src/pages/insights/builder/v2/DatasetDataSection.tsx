import { ArrowUpRight } from 'lucide-react'
import type { Dashboard } from '../../../../data/dashboards'
import { AGGREGATE_LABELS, aggregateLabel, columnTypes, defaultGraphValue, type Aggregate, type GraphQuery, type GraphSort, type RowFilter } from '../../../../data/transforms'
import type { CanvasItem, GraphItem } from '../../../../data/widgets'
import { Select } from '../../../../ui/Select'
import { filterColumns } from '../dashboardFilters'
import { EditorSection } from '../EditorFields'
import { datasetIcon, datasetResult, graphColumns, graphFor, itemDatasetKey, type Dataset } from './datasets'
import { FieldLabel, type TransformColumn } from './transforms/controls'
import { FilterCards, isCardFilter } from './FilterCards'
import { GraphTransformSteps } from './GraphTransformSteps'
import { TopNField } from './TopNField'
import { CalculationsEditor } from './transforms/CalculationsEditor'
import { FiltersEditor } from './transforms/FiltersEditor'

type DatasetDataSectionProps = {
  item: GraphItem
  datasets: Dataset[]
  dashboard: Dashboard
  onChange: (item: CanvasItem) => void
  onOpenDataset: (key: string) => void
  /** Final builder: calculations on this graph only; the dataset's shared ones are edited in the Data tab. */
  graphCalculations?: boolean
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

const plural = (count: number, one: string, many: string) => (count === 0 ? undefined : `${count} ${count === 1 ? one : many}`)

const valueId = (value: Aggregate) => (value.fn === 'count' ? 'count' : `${value.fn}:${value.field}`)

function parseValue(id: string): Aggregate | undefined {
  if (id === DEFAULT_OPTION) return undefined
  if (id === 'count') return { fn: 'count' }
  const [fn, field] = id.split(':')
  return { fn: fn as Aggregate['fn'], field }
}

/** Widget panel for builder V2: pick the dataset and what to group by, then the graph's own value, filters, sort and Top N. */
export function DatasetDataSection({ item, datasets, dashboard, onChange, onOpenDataset, graphCalculations = false }: DatasetDataSectionProps) {
  const key = itemDatasetKey(item)
  const dataset = datasets.find((candidate) => candidate.key === key)
  const result = dataset ? datasetResult(dataset, dashboard) : undefined
  const types = result ? columnTypes(result) : new Map()
  const datasetColumns: TransformColumn[] = result?.ok ? result.columns.map((column) => ({ key: column, type: types.get(column) ?? 'text' })) : []
  const query = item.query ?? {}
  const calculations = query.calculations ?? []
  const columns: TransformColumn[] = [...datasetColumns, ...calculations.map((calculation) => ({ key: calculation.key, type: 'number' as const }))]
  const groupKey = item.source === 'object' ? item.fieldKey : (query.groupBy ?? datasetColumns[0]?.key)
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

  const groupBy = (
    <>
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
      {item.source === 'sql' && dataset && (
        <>
          <span className="text-xs text-white/50">Group by</span>
          <Select
            aria-label="Group by"
            value={query.groupBy ?? DEFAULT_OPTION}
            options={[
              { value: DEFAULT_OPTION, label: 'Not grouped, the query as is' },
              ...(result ? graphColumns(dataset, result) : []).map((column) => ({ value: column.key, label: column.label })),
            ]}
            onChange={(value) => setQuery({ groupBy: value === DEFAULT_OPTION ? undefined : value })}
          />
        </>
      )}
    </>
  )
  const valueField = (
    <>
      <Select aria-label="Value" value={query.value ? valueId(query.value) : DEFAULT_OPTION} options={valueOptions} onChange={(id) => setQuery({ value: parseValue(id) })} />
      {item.source === 'sql' && query.value && !query.groupBy && <p className="text-xs text-white/45">Grouped by {groupKey}, the query's first column.</p>}
    </>
  )
  const filterControls = (
    <>
      <FilterCards columns={cardColumns} groupKey={groupKey} filters={graphFilters} onChange={setFilters} />
      <span className="mt-1 text-xs text-white/50">Conditions</span>
      <FiltersEditor
        compact
        filters={graphFilters.filter((filter) => !isCardFilter(filter))}
        columns={columns}
        onChange={(conditions) => setFilters([...graphFilters.filter(isCardFilter), ...conditions])}
      />
      <p className="text-[11px] text-white/40">Shift-click graphs on the canvas to filter several at once.</p>
    </>
  )
  const sortField = (label: string) => (
    <>
      <span className="text-xs text-white/50">{label}</span>
      <Select
        aria-label={label}
        value={sortValue}
        options={SORT_OPTIONS.map(({ value, label }) => ({ value, label }))}
        onChange={(value) => setQuery({ sort: SORT_OPTIONS.find((option) => option.value === value)?.sort })}
      />
    </>
  )
  const topN = (label?: string) => (
    <TopNField
      itemId={item.id}
      limit={query.limit}
      label={label}
      onChange={(limit) => {
        const next: Partial<GraphQuery> = { limit }
        // Top N needs an order to mean "largest", so default to value, high to low.
        if (limit && !query.sort) next.sort = { by: 'value', direction: 'desc' }
        setQuery(next)
      }}
    />
  )

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
        {graphCalculations && <p className="text-xs text-white/45">Everything below changes this graph only. Shared dataset settings are in the Data tab.</p>}
        {!graphCalculations && groupBy}
        {item.source === 'sql' && dataset?.kind === 'sql' && (
          <pre className="max-h-32 overflow-auto rounded-md border border-white/10 bg-white/[0.03] p-2 font-mono text-[11px] leading-5 whitespace-pre-wrap text-white/70">
            {dataset.dataset.sql}
          </pre>
        )}
      </EditorSection>

      {graphCalculations ? (
        <GraphTransformSteps
          calculations={
            <CalculationsEditor calculations={calculations} columns={datasetColumns} onChange={(next) => setQuery({ calculations: next.length ? next : undefined })} />
          }
          filters={filterControls}
          shape={
            <>
              <div className="flex flex-col gap-1.5">{groupBy}</div>
              <div className="flex flex-col gap-1.5">
                <FieldLabel>Value</FieldLabel>
                {valueField}
              </div>
              <div className="flex flex-col gap-1.5">{sortField('Order by')}</div>
              <div className="flex flex-col gap-1.5">{topN('Limit')}</div>
            </>
          }
          summaries={{
            calculations: plural(calculations.length, 'calculation', 'calculations'),
            filters: plural(graphFilters.length, 'filter', 'filters'),
            shape: [groupKey && `grouped by ${groupKey}`, query.limit && `top ${query.limit}`].filter(Boolean).join(' · ') || undefined,
          }}
        />
      ) : (
        <>
          <EditorSection title="Value">{valueField}</EditorSection>
          <EditorSection title="Filters">
            <p className="-mt-1 text-xs text-white/45">Only this graph. Fixed, page and dataset filters also apply.</p>
            {filterControls}
          </EditorSection>
          <EditorSection title="Sort and limit">
            {sortField('Sort')}
            {topN()}
          </EditorSection>
        </>
      )}
    </>
  )
}
