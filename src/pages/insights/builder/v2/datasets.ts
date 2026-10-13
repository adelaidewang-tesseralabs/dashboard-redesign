import type { LucideIcon } from 'lucide-react'
import { FileCode2 } from 'lucide-react'
import type { Dashboard, DatasetRef, SqlDataset } from '../../../../data/dashboards'
import { findObject, runSql, type DataObject, type SourceOrigin, type SqlResult } from '../../../../data/dataSources'
import { objectItem, sqlDatasetItem, type CanvasItem } from '../../../../data/widgets'
import { applyTransforms, columnTypes } from '../../../../data/transforms'
import { ORIGIN_META } from '../sourceKinds'

/** Everything a dashboard reads: an attached or charted table, or a saved SQL query. */
export type Dataset =
  | { key: string; kind: 'table'; label: string; origin: SourceOrigin; object: DataObject }
  | { key: string; kind: 'sql'; label: string; dataset: SqlDataset }

export const tableKey = (table: string) => `table:${table}`
export const sqlKey = (id: string) => `sql:${id}`

export function datasetIcon(dataset: Dataset): LucideIcon {
  return dataset.kind === 'table' ? ORIGIN_META[dataset.origin].Icon : FileCode2
}

export function datasetOriginLabel(dataset: Dataset) {
  return dataset.kind === 'table' ? ORIGIN_META[dataset.origin].label : 'SQL query'
}

/** Attached sources, then tables only reached through a graph (Mosaic objects picked inline), then SQL datasets. */
export function listDatasets(dashboard: Dashboard): Dataset[] {
  const tables = new Map<string, string>()
  for (const source of dashboard.sources ?? []) tables.set(source.table, source.label)
  for (const item of dashboard.widgets ?? []) {
    if (item.source === 'object' && !tables.has(item.objectName)) tables.set(item.objectName, '')
  }
  const tableDatasets = [...tables].flatMap(([table, label]): Dataset[] => {
    const object = findObject(table)
    if (!object) return []
    return [{ key: tableKey(table), kind: 'table', label: label || object.label, origin: object.origin ?? 'mosaic', object }]
  })
  const sqlDatasets = (dashboard.sqlDatasets ?? []).map((dataset): Dataset => ({ key: sqlKey(dataset.id), kind: 'sql', label: dataset.label, dataset }))
  return [...tableDatasets, ...sqlDatasets]
}

/** The dataset a graph reads, or null for standalone SQL graphs. */
export function itemDatasetKey(item: CanvasItem) {
  if (item.source === 'object') return tableKey(item.objectName)
  if (item.source === 'sql' && item.datasetId) return sqlKey(item.datasetId)
  return null
}

export function datasetUsage(widgets: CanvasItem[], key: string) {
  return widgets.filter((item) => itemDatasetKey(item) === key)
}

export function datasetRef(dataset: Dataset): DatasetRef {
  return dataset.kind === 'table' ? { kind: 'table', table: dataset.object.name } : { kind: 'sql', id: dataset.dataset.id }
}

/** The query a dataset runs: its saved SQL, or every row of the table. */
export function datasetSql(dataset: Dataset) {
  return dataset.kind === 'sql' ? dataset.dataset.sql : `SELECT *\nFROM ${dataset.object.name}`
}

/** The rows every graph on the dataset reads: its query with the dataset's calculations, filters and result shape applied. */
export function datasetResult(dataset: Dataset, dashboard: Pick<Dashboard, 'datasetTransforms'>) {
  return applyTransforms(runSql(datasetSql(dataset)), dashboard.datasetTransforms?.[dataset.key])
}

export function datasetPath(dataset: Dataset) {
  return dataset.kind === 'table' ? dataset.object.name : 'SQL query'
}

/** A first graph for the dataset: a table grouped by its first field, or a bar chart of the query. */
export function graphFor(dataset: Dataset): CanvasItem {
  if (dataset.kind === 'sql') {
    const result = runSql(dataset.dataset.sql)
    return sqlDatasetItem(dataset.dataset, result.ok && !result.grouped ? 'table' : 'bar')
  }
  const field = dataset.object.fields[0]
  return { ...objectItem(dataset.object.name, field.key), title: `${dataset.label} by ${field.label}` }
}

export type GraphColumn = { key: string; label: string }

/**
 * What a new graph can group by: a table's fields, or a query's text columns that repeat, either way only those left
 * after the dataset's transforms. A column unique on every row (an id) would chart one bar per row.
 */
export function graphColumns(dataset: Dataset, result: SqlResult): GraphColumn[] {
  if (!result.ok) return []
  if (dataset.kind === 'table') return dataset.object.fields.filter((field) => result.columns.includes(field.key)).map(({ key, label }) => ({ key, label }))
  const types = columnTypes(result)
  return result.columns
    .filter((column, index) => types.get(column) !== 'number' && new Set(result.rows.map((row) => row[index])).size < result.rows.length)
    .map((column) => ({ key: column, label: column }))
}

export function graphForColumn(dataset: Dataset, column: GraphColumn): CanvasItem {
  const title = `${dataset.label} by ${column.label}`
  if (dataset.kind === 'table') return { ...objectItem(dataset.object.name, column.key), title }
  const { id, sql } = dataset.dataset
  return { id: `sql-${crypto.randomUUID()}`, source: 'sql', title, sql, chart: 'bar', datasetId: id, query: { groupBy: column.key } }
}

/** Whether a graph on this dataset already groups by `column`. */
export function graphsColumn(item: CanvasItem, column: string) {
  if (item.source === 'object') return item.fieldKey === column
  return item.source === 'sql' && item.query?.groupBy === column
}

/** The dataset's groupable columns, each with whether a graph on the dashboard already groups by it. */
export function datasetGraphColumns(dataset: Dataset, dashboard: Dashboard) {
  const graphs = datasetUsage(dashboard.widgets ?? [], dataset.key)
  return graphColumns(dataset, datasetResult(dataset, dashboard)).map((column) => ({ ...column, graphed: graphs.some((item) => graphsColumn(item, column.key)) }))
}
