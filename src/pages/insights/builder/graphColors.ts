import type { Dashboard } from '../../../data/dashboards'
import { resolvePalette } from '../../../lib/colors'
import { runSql, type SqlResult } from '../../../data/dataSources'
import { applyTransforms, graphResult, type GraphQuery, type RowFilter } from '../../../data/transforms'
import { usesColor, usesSingleColor, type CanvasItem } from '../../../data/widgets'
import { resolveObjectItem } from './canvasItems'
import { sqlKey, tableKey } from './v2/datasets'

/** Where a Default-palette graph starts in `DASHBOARD_COLORS`, and the labels that position counts from. */
export type GraphColors = { colorKeys: string[]; offset: number }

/** Graphs that share a key show the same field of the same source, so a value means the same thing in each. */
type ColorScope = { key: string; labels: string[]; perLabel: boolean }

/** Builder V1's equals-only filters ride along with the V2 graph query. */
export function objectGraphQuery(item: Extract<CanvasItem, { source: 'object' }>): GraphQuery {
  const legacy = (item.filters ?? []).map((filter): RowFilter => ({ id: `${filter.fieldKey}=${filter.value}`, key: filter.fieldKey, operator: 'eq', value: filter.value }))
  return { ...item.query, filters: [...legacy, ...(item.query?.filters ?? [])] }
}

/** Every label a graph shows before dashboard filters, so a value keeps its color when others are filtered out. */
export function labelsOf(result: SqlResult) {
  return result.ok ? result.rows.map((row) => String(row[0])) : []
}

/**
 * Hands each group of related graphs its own stretch of `DASHBOARD_COLORS`, in dashboard order, so unrelated
 * graphs never share a color until the 20 run out. Graphs with a picked palette or color keep it and take no colors.
 */
export function dashboardGraphColors(dashboard: Dashboard): Map<string, GraphColors> {
  const groups = new Map<string, { labels: Set<string>; perLabel: boolean; itemIds: string[] }>()
  for (const item of dashboard.widgets ?? []) {
    const scope = colorScope(item, dashboard)
    if (!scope) continue
    const group = groups.get(scope.key) ?? { labels: new Set<string>(), perLabel: false, itemIds: [] }
    scope.labels.forEach((label) => group.labels.add(label))
    group.perLabel ||= scope.perLabel
    group.itemIds.push(item.id)
    groups.set(scope.key, group)
  }
  const colors = new Map<string, GraphColors>()
  let offset = 0
  for (const group of groups.values()) {
    const colorKeys = [...group.labels]
    group.itemIds.forEach((id) => colors.set(id, { colorKeys, offset }))
    // Line, area and gauge graphs draw a single color, so a group of only those uses one slot.
    offset += group.perLabel ? Math.max(1, colorKeys.length) : 1
  }
  return colors
}

function colorScope(item: CanvasItem, dashboard: Dashboard): ColorScope | undefined {
  switch (item.source) {
    case 'media':
    case 'text':
      return undefined
    case 'object': {
      const resolved = resolveObjectItem(item)
      if (!resolved || !autoColored(item)) return undefined
      const { object, field } = resolved
      const datasetKey = tableKey(object.name)
      const rows = applyTransforms(runSql(`SELECT * FROM ${object.name}`), dashboard.datasetTransforms?.[datasetKey])
      const labels = [...new Set([...field.values, ...labelsOf(graphResult(rows, field.key, objectGraphQuery(item)))])]
      return { key: `${datasetKey}:${field.key}`, labels, perLabel: perLabel(item) }
    }
    case 'sql': {
      if (!autoColored(item)) return undefined
      const dataset = item.datasetId ? dashboard.sqlDatasets?.find((entry) => entry.id === item.datasetId) : undefined
      if (item.datasetId && !dataset) return undefined
      const transforms = item.datasetId ? dashboard.datasetTransforms?.[sqlKey(item.datasetId)] : undefined
      const result = graphResult(applyTransforms(runSql(dataset?.sql ?? item.sql), transforms), undefined, item.query)
      if (!result.ok) return undefined
      // Standalone queries have nothing another graph could share.
      const key = item.datasetId ? `${sqlKey(item.datasetId)}:${result.columns[0]}` : `graph:${item.id}`
      return { key, labels: labelsOf(result), perLabel: perLabel(item) }
    }
    default: {
      const unhandled: never = item
      return unhandled
    }
  }
}

type GraphCanvasItem = Extract<CanvasItem, { source: 'object' | 'sql' }>

/** A picked palette, or a picked color on a single-color chart, opts the graph out of auto colors. */
const autoColored = (item: GraphCanvasItem) => {
  if (!usesColor(item.chart)) return false
  return usesSingleColor(item.chart) ? !item.color : resolvePalette(item.palette) === 'default'
}

const perLabel = (item: GraphCanvasItem) => item.chart === 'bar' || item.chart === 'pie'
