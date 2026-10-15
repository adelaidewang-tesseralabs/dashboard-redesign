import { DATA_OBJECTS, type DataObject, type SourceOrigin } from '../../../../data/dataSources'
import { externalTables, FOUNDRY_CATALOG, WORKFLOWS, type PublishedDataset, type Workflow } from '../../../../data/externalSources'
import type { Dashboard } from '../../../../data/dashboards'
import { formatDateTime } from '../../../../lib/format'
import { onItsDashboard, publishedLabel } from './publishDatasets'

export type CatalogKind = SourceOrigin | 'catalog' | 'schema' | 'run'

/** A folder or a table in the unified source browser. Folders carry `children`, tables carry `table`, run folders carry `workflow`. */
export type CatalogNode = { key: string; label: string; kind: CatalogKind; meta?: string; children?: CatalogNode[]; table?: DataObject; workflow?: Workflow }

export const UPLOADS_KEY = 'uploads'

const leaf = (table: DataObject): CatalogNode => ({ key: table.name, label: table.label, kind: table.origin ?? 'mosaic', table })

/** Final builder: datasets published from dashboards, one folder per dashboard under the name it was published with. */
export type FinalCatalog = { published: PublishedDataset[]; dashboards: Dashboard[] }

function publishedLeaf(entry: PublishedDataset, { published, dashboards }: FinalCatalog): CatalogNode {
  const source = entry.builtOn && published.find((candidate) => candidate.table.name === entry.builtOn)
  const meta = !onItsDashboard(entry, dashboards) ? 'No longer on the dashboard' : source ? `Built on ${publishedLabel(source)}` : undefined
  return { ...leaf(entry.table), meta }
}

function dashboardsCatalog(final: FinalCatalog): CatalogNode[] {
  if (final.published.length === 0) return []
  const folders = new Map<string, PublishedDataset[]>()
  for (const entry of final.published) folders.set(entry.dashboardId, [...(folders.get(entry.dashboardId) ?? []), entry])
  return [
    {
      key: 'foundry.dashboards',
      label: 'Dashboards',
      kind: 'catalog',
      children: [...folders].map(([id, entries]) => ({
        key: `foundry.dashboards.${id}`,
        label: entries[0].folder,
        kind: 'schema',
        children: entries.map((entry) => publishedLeaf(entry, final)),
      })),
    },
  ]
}

function foundryCatalogs(final: FinalCatalog | undefined): CatalogNode[] {
  return FOUNDRY_CATALOG.map((catalog) => ({
    key: `foundry.${catalog.name}`,
    label: (final && catalog.label) || catalog.name,
    kind: 'catalog',
    children: catalog.schemas.map((schema) => ({
      key: `foundry.${catalog.name}.${schema.name}`,
      label: schema.name,
      kind: 'schema',
      children: schema.tables.map(leaf),
    })),
  }))
}

/** Every table the tenant can chart, by where it lives. Rebuilt on render so fresh uploads and publishes show up. */
export function buildSourceCatalog(final?: FinalCatalog): CatalogNode[] {
  return [
    { key: 'mosaic', label: 'Mosaic objects', kind: 'mosaic', children: DATA_OBJECTS.map(leaf) },
    { key: 'foundry', label: 'Foundry', kind: 'foundry', children: [...(final ? dashboardsCatalog(final) : []), ...foundryCatalogs(final)] },
    {
      key: 'workflow',
      label: 'Workflow outputs',
      kind: 'workflow',
      children: WORKFLOWS.map((workflow) => ({
        key: `workflow.${workflow.id}`,
        label: workflow.name,
        kind: 'run',
        meta: `Latest run ${formatDateTime(workflow.lastRun)}`,
        workflow,
        children: workflow.outputs.map(leaf),
      })),
    },
    ...(final
      ? []
      : [{ key: UPLOADS_KEY, label: 'Uploads', kind: 'upload' as const, children: externalTables().filter((table) => table.origin === 'upload').map(leaf) }]),
  ]
}

/** Keeps tables whose label or path matches, plus the folders leading to them. Uploads stays so its upload action is reachable. */
export function filterCatalog(nodes: CatalogNode[], needle: string): CatalogNode[] {
  if (!needle) return nodes
  return nodes.flatMap((node) => {
    if (node.table) return node.table.name.toLowerCase().includes(needle) || node.label.toLowerCase().includes(needle) ? [node] : []
    const children = filterCatalog(node.children ?? [], needle)
    return children.length > 0 || node.key === UPLOADS_KEY ? [{ ...node, children }] : []
  })
}

export function countTables(node: CatalogNode): number {
  return node.table ? 1 : (node.children ?? []).reduce((total, child) => total + countTables(child), 0)
}
