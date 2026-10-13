import type { Dashboard } from '../../../../data/dashboards'
import { catalogEntry, type Pipeline, type PipelineStatus } from '../../../../data/catalogLineage'
import { findObject, type SourceOrigin } from '../../../../data/dataSources'
import { isGraph, type ChartStyle } from '../../../../data/widgets'
import { itemDatasetKey, listDatasets } from '../v2/datasets'
import { dashboardNode, datasetNode, graphNode, pipelineNode, sourceNode, upstreamNode } from './lineageNodes'

export type LineageTarget = { kind: 'dashboard' } | { kind: 'graph'; itemId: string }

export const LINEAGE_KINDS = ['upstream', 'pipeline', 'source', 'dataset', 'graph', 'dashboard'] as const
export type LineageKind = (typeof LINEAGE_KINDS)[number]

export const LINEAGE_KIND_LABELS: Record<LineageKind, string> = {
  upstream: 'Upstream tables',
  pipeline: 'Pipelines',
  source: 'Sources',
  dataset: 'Datasets',
  graph: 'Graphs',
  dashboard: 'Dashboard',
}

export type ColumnRole = 'Grouped by' | 'Value' | 'Graph filter' | 'Dashboard filter'

export type LineageNode = {
  id: string
  kind: LineageKind
  label: string
  caption: string
  /** Sources: where the table lives; unset when it no longer resolves. */
  origin?: SourceOrigin
  /** Datasets: a saved query rather than a table. */
  query?: boolean
  chart?: ChartStyle
  /** Pipelines: how the last run went. */
  status?: PipelineStatus
  /** Not upstream of any graph, e.g. a dataset added to the Data tab but never charted. */
  unused?: boolean
  details: { label: string; value: string }[]
  columns: string[]
  /** Graphs: the dataset columns they read, and for what. */
  columnRoles?: { column: string; roles: ColumnRole[] }[]
  /** Datasets and sources: the graphs reading each column, matched by column name. */
  columnUsers?: Record<string, string[]>
  sql?: string
}

export type LineageEdge = { from: string; to: string }
export type Lineage = { nodes: LineageNode[]; edges: LineageEdge[] }

export const DASHBOARD_NODE_ID = 'dashboard'
export const graphNodeId = (itemId: string) => `graph:${itemId}`

/** Every table a query reads. Plain FROM/JOIN only: CTE names and subqueries can be missed or show up as tables. */
function tablesIn(sql: string) {
  return [...new Set([...sql.matchAll(/\b(?:from|join)\s+([\w.]+)/gi)].map((match) => match[1].toLowerCase()))]
}

/**
 * Upstream tables → pipelines → sources → datasets → graphs → the dashboard, for every graph on every page.
 * Datasets no graph reads are included, marked `unused`.
 */
function dashboardLineage(dashboard: Dashboard): Lineage {
  const graphs = (dashboard.widgets ?? []).filter(isGraph)
  const allDatasets = listDatasets(dashboard)
  const datasets = new Map(allDatasets.map((dataset) => [dataset.key, dataset]))
  const nodes = new Map<string, LineageNode>()
  const pipelines = new Map<string, Pipeline>()
  const edges: LineageEdge[] = []
  const link = (from: string, to: string) => {
    if (!edges.some((edge) => edge.from === from && edge.to === to)) edges.push({ from, to })
  }
  const addSources = (tables: string[], to: string) => {
    for (const table of tables) {
      const id = `source:${table}`
      if (!nodes.has(id)) {
        const entry = catalogEntry(table)
        if (entry) {
          const pipelineId = `pipeline:${entry.pipeline.id}`
          for (const input of entry.inputs) {
            const upstream = upstreamNode(input)
            if (!nodes.has(upstream.id)) nodes.set(upstream.id, upstream)
            link(upstream.id, pipelineId)
          }
          // Placeholder for column order; the real node needs every table the pipeline writes.
          if (!pipelines.has(pipelineId)) nodes.set(pipelineId, pipelineNode(entry.pipeline, 0))
          pipelines.set(pipelineId, entry.pipeline)
          link(pipelineId, id)
        }
        nodes.set(id, sourceNode(table, findObject(table), entry?.pipeline))
      }
      link(id, to)
    }
  }
  const addDataset = (key: string, graphCount: number) => {
    const dataset = datasets.get(key)
    if (!dataset) return
    const id = `dataset:${key}`
    if (nodes.has(id)) return id
    nodes.set(id, datasetNode(dataset, dashboard, graphCount))
    addSources(dataset.kind === 'table' ? [dataset.object.name] : tablesIn(dataset.dataset.sql), id)
    return id
  }
  // Insertion order sets each column's order, so graphs, their datasets and their sources line up top to bottom.
  const graphNodes = graphs.map((item) => {
    const key = itemDatasetKey(item)
    const node = graphNode(item, dashboard, key ? datasets.get(key)?.label : undefined)
    const datasetId = key && addDataset(key, graphs.filter((graph) => itemDatasetKey(graph) === key).length)
    if (datasetId) link(datasetId, node.id)
    else if (item.source === 'sql') addSources(tablesIn(item.sql), node.id)
    link(node.id, DASHBOARD_NODE_ID)
    return node
  })
  for (const dataset of allDatasets) addDataset(dataset.key, 0)
  for (const [id, pipeline] of pipelines) nodes.set(id, pipelineNode(pipeline, edges.filter((edge) => edge.from === id).length))
  for (const graph of graphNodes) noteColumnUse(graph, nodes, edges)

  const lineage = { nodes: [...nodes.values(), ...graphNodes, dashboardNode(dashboard, graphs.length)], edges }
  const used = upstreamOf(edges, DASHBOARD_NODE_ID)
  for (const node of lineage.nodes) if (!used.has(node.id)) node.unused = true
  return lineage
}

/** Marks the columns `graph` reads on its dataset and on the sources that dataset reads, matched by name. */
function noteColumnUse(graph: LineageNode, nodes: Map<string, LineageNode>, edges: LineageEdge[]) {
  const parents = (id: string) => edges.filter((edge) => edge.to === id).map((edge) => nodes.get(edge.from))
  const direct = parents(graph.id)
  const reached = [...direct, ...direct.flatMap((node) => (node?.kind === 'dataset' ? parents(node.id) : []))]
  for (const node of reached) {
    if (node?.kind !== 'dataset' && node?.kind !== 'source') continue
    for (const { column } of graph.columnRoles ?? []) {
      if (!node.columns.includes(column)) continue
      node.columnUsers ??= {}
      node.columnUsers[column] = [...(node.columnUsers[column] ?? []), graph.label]
    }
  }
}

/** Every node `id` is built from, walking edges backwards. */
export function upstreamOf(edges: LineageEdge[], id: string): Set<string> {
  const found = new Set([id])
  const queue = [id]
  while (queue.length) {
    const current = queue.shift() as string
    for (const edge of edges) {
      if (edge.to === current && !found.has(edge.from)) {
        found.add(edge.from)
        queue.push(edge.from)
      }
    }
  }
  return found
}

/** Every node built from `id`, walking edges forwards. */
export function downstreamOf(edges: LineageEdge[], id: string): Set<string> {
  const reversed = edges.map(({ from, to }) => ({ from: to, to: from }))
  return upstreamOf(reversed, id)
}

function keep(lineage: Lineage, kept: (node: LineageNode) => boolean): Lineage {
  const ids = new Set(lineage.nodes.filter(kept).map((node) => node.id))
  return { nodes: lineage.nodes.filter((node) => ids.has(node.id)), edges: lineage.edges.filter((edge) => ids.has(edge.from) && ids.has(edge.to)) }
}

/** The whole dashboard, or just what one graph is built from plus the dashboard it sits on. */
export function buildLineage(dashboard: Dashboard, target: LineageTarget): Lineage {
  const full = dashboardLineage(dashboard)
  if (target.kind === 'dashboard') return full
  const upstream = upstreamOf(full.edges, graphNodeId(target.itemId))
  return keep(full, (node) => upstream.has(node.id) || node.id === DASHBOARD_NODE_ID)
}

export const withoutUnused = (lineage: Lineage) => keep(lineage, (node) => !node.unused)
