import type { Dashboard, DashboardFilter, FieldRef, PresetOperator } from '../../../data/dashboards'
import { columnTypes, FILTER_OPERATOR_LABELS, isNullOperator, type GraphSort, type RowFilter } from '../../../data/transforms'
import { isGraph, type GraphItem } from '../../../data/widgets'
import { objectGraphQuery } from './graphColors'
import { datasetResult, itemDatasetKey, listDatasets } from './v2/datasets'

/** A column a dashboard filter can be built on, with the values its dataset actually contains. */
export type FilterColumn = { datasetKey: string; datasetLabel: string; column: string; label: string; values: string[] }

/** Columns with more distinct values than this (ids, free text) make poor pick lists. */
const MAX_FILTER_VALUES = 50

/** Text columns of every dataset on the dashboard; a filter can only use these columns and their values. */
export function filterColumns(dashboard: Dashboard): FilterColumn[] {
  return listDatasets(dashboard).flatMap((dataset) => {
    const result = datasetResult(dataset, dashboard)
    if (!result.ok) return []
    const types = columnTypes(result)
    return result.columns.flatMap((column, index): FilterColumn[] => {
      if (column === 'id' || types.get(column) !== 'text') return []
      const distinct = [...new Set(result.rows.map((row) => row[index]).filter((cell): cell is string => typeof cell === 'string' && cell !== ''))]
      if (distinct.length === 0 || distinct.length > MAX_FILTER_VALUES) return []
      const field = dataset.kind === 'table' ? dataset.object.fields.find((entry) => entry.key === column) : undefined
      const values = field ? field.values.filter((value) => distinct.includes(value)) : distinct.toSorted((a, b) => a.localeCompare(b))
      return [{ datasetKey: dataset.key, datasetLabel: dataset.label, column, label: field?.label ?? column, values }]
    })
  })
}

export const findFilterColumn = (columns: FilterColumn[], filter: Pick<DashboardFilter, 'datasetKey' | 'column'>) =>
  columns.find((column) => column.datasetKey === filter.datasetKey && column.column === filter.column)

const sameField = (a: FieldRef, b: FieldRef) => a.datasetKey === b.datasetKey && a.column === b.column

/** Every field linked to `field`, directly or through a chain of links, including `field` itself. */
export function linkedFields(dashboard: Pick<Dashboard, 'fieldLinks'>, field: FieldRef): FieldRef[] {
  const found: FieldRef[] = [field]
  for (let index = 0; index < found.length; index++) {
    for (const link of dashboard.fieldLinks ?? []) {
      const [a, b] = link.fields
      const other = sameField(a, found[index]) ? b : sameField(b, found[index]) ? a : undefined
      if (other && !found.some((entry) => sameField(entry, other))) found.push(other)
    }
  }
  return found
}

/** The values a viewer filter may offer: fixed filters on the same or a linked field cap them. Undefined when none does. */
export function fixedValuesFor(dashboard: Pick<Dashboard, 'filters' | 'fieldLinks'>, filter: DashboardFilter): string[] | undefined {
  const fields = linkedFields(dashboard, filter)
  const caps = (dashboard.filters ?? []).filter((entry) => entry.fixed && entry.values.length > 0 && fields.some((field) => sameField(field, entry)))
  if (caps.length === 0) return undefined
  return caps.map((cap) => cap.values).reduce((kept, values) => kept.filter((value) => values.includes(value)))
}

/** The column a filter narrows in `datasetKey`: its own column, a linked one, or none when the dataset can't be reached. */
export function filterColumnIn(dashboard: Pick<Dashboard, 'fieldLinks'>, filter: FieldRef, datasetKey: string): string | undefined {
  return linkedFields(dashboard, filter).find((field) => field.datasetKey === datasetKey)?.column
}

/** The page filters that reach `datasetKey`, as graph-query row filters; a filter with nothing picked keeps every row. */
export function dashboardRowFilters(dashboard: Pick<Dashboard, 'filters' | 'fieldLinks'>, datasetKey: string): RowFilter[] {
  return (dashboard.filters ?? []).flatMap((filter): RowFilter[] => {
    if (filter.values.length === 0) return []
    const column = filterColumnIn(dashboard, filter, datasetKey)
    return column ? presetRowFilters(filter, column) : []
  })
}

function presetRowFilters(filter: DashboardFilter, key: string): RowFilter[] {
  const [first, second = first] = filter.values
  const operator = filter.operator ?? 'in'
  switch (operator) {
    case 'in':
      return [{ id: filter.id, key, operator: 'in', value: filter.values.join(',') }]
    case 'contains':
      return [{ id: filter.id, key, operator: 'like', value: first }]
    case 'between':
      return [
        { id: filter.id, key, operator: 'gte', value: first },
        { id: `${filter.id}:to`, key, operator: 'lte', value: second },
      ]
    case 'eq':
    case 'gt':
    case 'gte':
    case 'lt':
    case 'lte':
      return [{ id: filter.id, key, operator, value: first }]
    default: {
      const unhandled: never = operator
      return unhandled
    }
  }
}

export const PRESET_OPERATOR_LABELS: Record<PresetOperator, string> = {
  in: 'is any of',
  eq: 'is',
  contains: 'contains',
  gt: '>',
  gte: '≥',
  lt: '<',
  lte: '≤',
  between: 'between',
}

/** A page filter's picks as one line, e.g. "≥ 40" or "2026-01-01 – 2026-03-31". */
export function describePresetValues(filter: Pick<DashboardFilter, 'values' | 'operator'>): string {
  const operator = filter.operator ?? 'in'
  if (operator === 'in') return filter.values.join(', ')
  const [first, second = first] = filter.values
  if (operator === 'between') return first === second ? first : `${first} – ${second}`
  return `${PRESET_OPERATOR_LABELS[operator]} ${first}`
}

/** A filter narrowing one graph. `via` names the linked column a page filter reaches this graph through. */
export type AppliedFilter = { id: string; scope: 'fixed' | 'page' | 'dataset' | 'graph'; label: string; detail: string; via?: string }

function describeRowFilter(filter: RowFilter): string {
  const list = filter.value.split(',').map((value) => value.trim()).join(', ')
  switch (filter.operator) {
    case 'is_null':
    case 'is_not_null':
      return FILTER_OPERATOR_LABELS[filter.operator]
    case 'in':
      return list
    case 'not_in':
      return `not ${list}`
    case 'eq':
    case 'ne':
    case 'lt':
    case 'lte':
    case 'gt':
    case 'gte':
    case 'like':
      return `${FILTER_OPERATOR_LABELS[filter.operator]} ${filter.value}`
    default: {
      const unhandled: never = filter.operator
      return unhandled
    }
  }
}

/** Filters with nothing to compare against keep every row, so they aren't applied. */
const isActive = (filter: RowFilter) => isNullOperator(filter.operator) || filter.value.trim() !== ''

/** Every filter narrowing a graph: page filters (directly or via a link), its dataset's filters, then its own. */
export function graphFilters(dashboard: Dashboard, item: GraphItem): AppliedFilter[] {
  const datasetKey = itemDatasetKey(item)
  const page = datasetKey
    ? (dashboard.filters ?? []).flatMap((filter): AppliedFilter[] => {
        const column = filterColumnIn(dashboard, filter, datasetKey)
        if (!column || filter.values.length === 0) return []
        const via = datasetKey === filter.datasetKey ? undefined : column
        return [{ id: filter.id, scope: filter.fixed ? 'fixed' : 'page', label: filter.label, detail: describePresetValues(filter), via }]
      })
    : []
  const transforms = datasetKey ? dashboard.datasetTransforms?.[datasetKey] : undefined
  const dataset = (transforms?.filters ?? [])
    .filter(isActive)
    .map((filter): AppliedFilter => ({ id: filter.id, scope: 'dataset', label: filter.key, detail: describeRowFilter(filter) }))
  // The dataset's row limit runs before page filters, so it can hide rows a filter would otherwise keep.
  const datasetLimit: AppliedFilter[] = transforms?.shape.limit
    ? [{ id: 'dataset-limit', scope: 'dataset', label: 'Rows', detail: `first ${transforms.shape.limit}` }]
    : []
  const query = item.source === 'object' ? objectGraphQuery(item) : item.query
  const own = (query?.filters ?? [])
    .filter(isActive)
    .map((filter): AppliedFilter => ({ id: filter.id, scope: 'graph', label: filter.key, detail: describeRowFilter(filter) }))
  const topN: AppliedFilter[] = query?.limit
    ? [{ id: 'graph-limit', scope: 'graph', label: 'Show', detail: `top ${query.limit} · ${describeSort(query.sort)}` }]
    : []
  return [...page, ...dataset, ...datasetLimit, ...own, ...topN]
}

function describeSort(sort: GraphSort | undefined): string {
  if (!sort) return 'dataset order'
  if (sort.by === 'value') return sort.direction === 'desc' ? 'value, high to low' : 'value, low to high'
  return sort.direction === 'asc' ? 'label, A to Z' : 'label, Z to A'
}

/** A graph a filter narrows: `column` is the column it narrows, `linked` when that comes through a linked field. */
export type FilterTarget = { item: GraphItem; datasetKey: string; column: string; linked: boolean }

/** Which graphs on the page a filter narrows and which it can't reach (no matching or linked column). */
export function filterReach(dashboard: Dashboard, filter: FieldRef) {
  const reached: FilterTarget[] = []
  const missed: GraphItem[] = []
  for (const item of (dashboard.widgets ?? []).filter(isGraph)) {
    const datasetKey = itemDatasetKey(item)
    const column = datasetKey ? filterColumnIn(dashboard, filter, datasetKey) : undefined
    if (datasetKey && column) reached.push({ item, datasetKey, column, linked: datasetKey !== filter.datasetKey })
    else missed.push(item)
  }
  return { reached, missed, total: reached.length + missed.length }
}
