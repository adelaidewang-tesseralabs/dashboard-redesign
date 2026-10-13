import type { Dashboard } from '../../../../data/dashboards'
import { PIPELINE_STATUS_LABELS, type Pipeline, type UpstreamTable } from '../../../../data/catalogLineage'
import { objectColumns, runSql, type DataObject } from '../../../../data/dataSources'
import { dashboardPages, resolvePageId } from '../../../../data/pages'
import { aggregateLabel, applyTransforms, defaultGraphValue, graphResult, transformCount } from '../../../../data/transforms'
import type { GraphItem } from '../../../../data/widgets'
import { formatDateTime, formatNumber } from '../../../../lib/format'
import { nameOf } from '../../../../lib/people'
import { displayTitle, itemLabel, resolveObjectItem } from '../canvasItems'
import { CHART_STYLE_META } from '../chartStyles'
import { filterColumnIn } from '../dashboardFilters'
import { objectGraphQuery } from '../graphColors'
import { ORIGIN_META } from '../sourceKinds'
import { datasetResult, datasetSql, itemDatasetKey, type Dataset } from '../v2/datasets'
import { datasetHistory, graphHistory, historyDetails } from './changeHistory'
import { DASHBOARD_NODE_ID, graphNodeId, type ColumnRole, type LineageNode } from './lineageGraph'

const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`

export function upstreamNode({ table, system }: UpstreamTable): LineageNode {
  return {
    id: `upstream:${table}`,
    kind: 'upstream',
    label: table.split('.').pop() ?? table,
    caption: system,
    details: [
      { label: 'System', value: system },
      { label: 'Table', value: table },
      { label: 'Lineage from', value: 'Foundry catalog' },
    ],
    columns: [],
  }
}

export function pipelineNode(pipeline: Pipeline, outputs: number): LineageNode {
  return {
    id: `pipeline:${pipeline.id}`,
    kind: 'pipeline',
    label: pipeline.name,
    caption: `${pipeline.schedule} · ${PIPELINE_STATUS_LABELS[pipeline.status]}`,
    status: pipeline.status,
    details: [
      { label: 'Type', value: pipeline.kind },
      { label: 'Schedule', value: pipeline.schedule },
      { label: 'Last run', value: `${formatDateTime(pipeline.lastRun)} · ${PIPELINE_STATUS_LABELS[pipeline.status]}` },
      { label: 'Owner', value: nameOf(pipeline.owner) },
      { label: 'Writes', value: plural(outputs, 'table') },
    ],
    columns: [],
  }
}

export function sourceNode(table: string, object: DataObject | undefined, pipeline: Pipeline | undefined): LineageNode {
  if (!object) return { id: `source:${table}`, kind: 'source', label: table, caption: 'Unavailable', details: [{ label: 'Table', value: table }], columns: [] }
  const origin = object.origin ?? 'mosaic'
  return {
    id: `source:${table}`,
    kind: 'source',
    label: object.label,
    caption: ORIGIN_META[origin].label,
    origin,
    details: [
      { label: 'Origin', value: ORIGIN_META[origin].label },
      { label: 'Table', value: object.name },
      { label: 'Records', value: formatNumber(object.total) },
      { label: 'Written by', value: pipeline?.name ?? 'Not in the catalog' },
    ],
    columns: objectColumns(object),
  }
}

export function datasetNode(dataset: Dataset, dashboard: Dashboard, graphCount: number): LineageNode {
  const result = datasetResult(dataset, dashboard)
  const transforms = transformCount(dashboard.datasetTransforms?.[dataset.key])
  const steps = transforms ? plural(transforms, 'transform') : 'No transforms'
  return {
    id: `dataset:${dataset.key}`,
    kind: 'dataset',
    label: dataset.label,
    caption: graphCount ? `${dataset.kind === 'sql' ? 'SQL query' : 'Table'} · ${steps}` : 'Not used by any graph',
    query: dataset.kind === 'sql',
    details: [
      { label: 'Type', value: dataset.kind === 'sql' ? 'SQL query' : 'Table' },
      { label: 'Transforms', value: String(transforms) },
      { label: 'Rows', value: result.ok ? formatNumber(result.rows.length) : 'Unavailable' },
      { label: 'Used by', value: plural(graphCount, 'graph') },
      ...historyDetails(datasetHistory(dashboard, dataset)),
    ],
    columns: result.ok ? result.columns : [],
    sql: dataset.kind === 'sql' ? datasetSql(dataset) : undefined,
  }
}

/** The graph's own shape: what it groups by and measures, before dashboard filters. `groupColumn` is the dataset column. */
function graphShape(item: GraphItem, dashboard: Dashboard) {
  if (item.source === 'object') {
    const resolved = resolveObjectItem(item)
    if (!resolved) return { groupBy: item.fieldKey, groupColumn: item.fieldKey, value: '—' }
    const rows = applyTransforms(runSql(`SELECT * FROM ${resolved.object.name}`), dashboard.datasetTransforms?.[itemDatasetKey(item) ?? ''])
    const query = objectGraphQuery(item)
    return { groupBy: resolved.field.label, groupColumn: resolved.field.key, value: aggregateLabel(query.value ?? defaultGraphValue(rows, resolved.field.key)) }
  }
  const sql = (item.datasetId && dashboard.sqlDatasets?.find((entry) => entry.id === item.datasetId)?.sql) || item.sql
  const transforms = item.datasetId ? dashboard.datasetTransforms?.[itemDatasetKey(item) ?? ''] : undefined
  const result = graphResult(applyTransforms(runSql(sql), transforms), undefined, item.query)
  const groupColumn = result.ok ? result.columns[0] : undefined
  return { groupBy: groupColumn ?? '—', groupColumn, value: result.ok ? (result.columns[1] ?? '—') : '—' }
}

/** Which dataset columns the graph reads, and for what. Dashboard filters count only on the graph's own page. */
export function graphColumnRoles(item: GraphItem, dashboard: Dashboard): { column: string; roles: ColumnRole[] }[] {
  const roles = new Map<string, ColumnRole[]>()
  const note = (column: string | undefined, role: ColumnRole) => {
    if (!column) return
    const current = roles.get(column) ?? []
    if (!current.includes(role)) roles.set(column, [...current, role])
  }
  const datasetKey = itemDatasetKey(item)
  const page = resolvePageId(dashboard, item.pageId)
  note(graphShape(item, dashboard).groupColumn, 'Grouped by')
  note(item.query?.value?.field, 'Value')
  for (const filter of item.query?.filters ?? []) note(filter.key, 'Graph filter')
  for (const filter of dashboard.filters ?? []) {
    if (datasetKey && (filter.allPages || resolvePageId(dashboard, filter.pageId) === page)) {
      note(filterColumnIn(dashboard, filter, datasetKey), filter.fixed ? 'Fixed filter' : 'Dashboard filter')
    }
  }
  return [...roles].map(([column, list]) => ({ column, roles: list }))
}

export function graphNode(item: GraphItem, dashboard: Dashboard, datasetLabel: string | undefined): LineageNode {
  const pages = dashboardPages(dashboard)
  const page = pages.find((entry) => entry.id === resolvePageId(dashboard, item.pageId))
  const datasetKey = itemDatasetKey(item)
  const dashboardFilters = (dashboard.filters ?? []).filter((filter) => filter.datasetKey === datasetKey).map((filter) => filter.label)
  const { groupBy, value } = graphShape(item, dashboard)
  const chartLabel = CHART_STYLE_META[item.chart].label
  return {
    id: graphNodeId(item.id),
    kind: 'graph',
    label: displayTitle(item) || itemLabel(item),
    caption: pages.length > 1 && page ? `${chartLabel} · ${page.name}` : chartLabel,
    chart: item.chart,
    details: [
      { label: 'Chart', value: chartLabel },
      ...(page ? [{ label: 'Page', value: page.name }] : []),
      { label: 'Dataset', value: datasetLabel ?? 'Own SQL query' },
      { label: 'Grouped by', value: groupBy },
      { label: 'Value', value },
      { label: 'Graph filters', value: String(item.query?.filters?.length ?? 0) },
      { label: 'Dashboard filters', value: dashboardFilters.length ? dashboardFilters.join(', ') : 'None' },
      { label: 'Show', value: item.query?.limit ? `Top ${item.query.limit}` : 'All' },
      ...historyDetails(graphHistory(dashboard, item.id)),
    ],
    columns: [],
    columnRoles: graphColumnRoles(item, dashboard),
    sql: item.source === 'sql' && !item.datasetId ? item.sql : undefined,
  }
}

export function dashboardNode(dashboard: Dashboard, graphCount: number): LineageNode {
  const created = dashboard.versions.reduce<string | undefined>((oldest, version) => {
    const at = version.startedAt ?? version.savedAt
    return !oldest || at < oldest ? at : oldest
  }, undefined)
  const pageCount = dashboardPages(dashboard).length
  return {
    id: DASHBOARD_NODE_ID,
    kind: 'dashboard',
    label: dashboard.name,
    caption: `${plural(graphCount, 'graph')} · ${plural(pageCount, 'page')}`,
    details: [
      { label: 'Owner', value: dashboard.owner },
      ...(created ? [{ label: 'Created', value: formatDateTime(created) }] : []),
      { label: 'Last updated', value: `${formatDateTime(dashboard.updatedAt)} by ${dashboard.updatedBy}` },
      ...(dashboard.refreshedAt || dashboard.lastExecution ? [{ label: 'Last refreshed', value: formatDateTime((dashboard.refreshedAt ?? dashboard.lastExecution) as string) }] : []),
    ],
    columns: [],
  }
}
