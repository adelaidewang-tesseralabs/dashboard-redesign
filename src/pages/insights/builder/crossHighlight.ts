import type { SqlResult } from '../../../data/dataSources'
import { defaultGraphValue, graphResult, type GraphQuery, type RowFilter } from '../../../data/transforms'

/** A part of a graph a viewer clicked: rows of `datasetKey` where `column` equals `value`. Never saved. */
export type CrossHighlight = { datasetKey: string; column: string; columnLabel: string; value: string }

/**
 * How one graph shows the active highlight: `dim` when it reads another dataset (nothing to relate), else `match` with
 * each label's value among the highlighted rows. `additive` values (counts, sums) are a share of the full bar or slice;
 * averages and the like are not, so those graphs only color the labels that have any match.
 */
export type ChartHighlight = { kind: 'dim' } | { kind: 'match'; values: Map<string, number>; additive: boolean }

export const sameHighlight = (left: CrossHighlight | null, right: CrossHighlight) =>
  !!left && left.datasetKey === right.datasetKey && left.column === right.column && left.value === right.value

/** Re-runs the graph's query on only the highlighted rows, on top of its own and the dashboard's filters. */
export function chartHighlight(highlight: CrossHighlight | null | undefined, datasetKey: string, rows: SqlResult, groupKey: string | undefined, query: GraphQuery = {}): ChartHighlight | undefined {
  if (!highlight) return undefined
  if (highlight.datasetKey !== datasetKey || !rows.ok || !rows.columns.includes(highlight.column)) return { kind: 'dim' }
  const filter: RowFilter = { id: 'cross-highlight', key: highlight.column, operator: 'eq', value: highlight.value }
  const matched = graphResult(rows, groupKey, { ...query, filters: [...(query.filters ?? []), filter], limit: undefined })
  if (!matched.ok) return { kind: 'dim' }
  const value = query.value ?? (groupKey ? defaultGraphValue(rows, groupKey) : undefined)
  return {
    kind: 'match',
    values: new Map(matched.rows.map((row) => [String(row[0]), Number(row[row.length - 1])])),
    additive: !value || value.fn === 'count' || value.fn === 'sum',
  }
}
