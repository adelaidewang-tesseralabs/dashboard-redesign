import type { Dashboard } from '../../../../../data/dashboards'
import { runSql } from '../../../../../data/dataSources'
import { applyTransforms, graphResult, type DatasetTransforms, type GraphQuery } from '../../../../../data/transforms'
import type { CanvasItem } from '../../../../../data/widgets'
import { displayTitle, itemLabel, resolveObjectItem } from '../../canvasItems'
import { dashboardRowFilters } from '../../dashboardFilters'
import { objectGraphQuery } from '../../graphColors'
import { sqlKey, tableKey } from '../datasets'

export type GraphBreak = { itemId: string; title: string; error: string }

const withPageFilters = (query: GraphQuery, dashboard: Dashboard, datasetKey: string): GraphQuery => ({
  ...query,
  filters: [...(query.filters ?? []), ...dashboardRowFilters(dashboard, datasetKey)],
})

/** The error a graph would render with, computed the way `CanvasWidget` computes it. */
function graphError(item: CanvasItem, dashboard: Dashboard): string | undefined {
  if (item.source === 'object') {
    const resolved = resolveObjectItem(item)
    if (!resolved) return undefined
    const { object, field } = resolved
    const key = tableKey(object.name)
    const rows = applyTransforms(runSql(`SELECT * FROM ${object.name}`), dashboard.datasetTransforms?.[key])
    const result = graphResult(rows, field.key, withPageFilters(objectGraphQuery(item), dashboard, key), field.values)
    return result.ok ? undefined : result.error
  }
  if (item.source !== 'sql' || !item.datasetId) return undefined
  const dataset = dashboard.sqlDatasets?.find((entry) => entry.id === item.datasetId)
  if (!dataset) return undefined
  const key = sqlKey(item.datasetId)
  const rows = applyTransforms(runSql(dataset.sql), dashboard.datasetTransforms?.[key])
  const result = graphResult(rows, undefined, withPageFilters(item.query ?? {}, dashboard, key))
  return result.ok ? undefined : result.error
}

/** Graphs that work today but would fail with `draft` applied, e.g. because it drops a column they chart. */
export function graphsBrokenBy(dashboard: Dashboard, datasetKey: string, draft: DatasetTransforms, graphs: CanvasItem[]): GraphBreak[] {
  const drafted = { ...dashboard, datasetTransforms: { ...dashboard.datasetTransforms, [datasetKey]: draft } }
  return graphs.flatMap((item) => {
    if (graphError(item, dashboard)) return []
    const error = graphError(item, drafted)
    return error ? [{ itemId: item.id, title: displayTitle(item) || itemLabel(item), error }] : []
  })
}
