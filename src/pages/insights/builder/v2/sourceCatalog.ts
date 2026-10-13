import { DATA_OBJECTS, type DataObject, type SourceOrigin } from '../../../../data/dataSources'
import { externalTables, FOUNDRY_CATALOG, WORKFLOWS } from '../../../../data/externalSources'
import { formatDateTime } from '../../../../lib/format'

export type CatalogKind = SourceOrigin | 'catalog' | 'schema' | 'run'

/** A folder or a table in the unified source browser. Folders carry `children`, tables carry `table`. */
export type CatalogNode = { key: string; label: string; kind: CatalogKind; meta?: string; children?: CatalogNode[]; table?: DataObject }

export const UPLOADS_KEY = 'uploads'

const leaf = (table: DataObject): CatalogNode => ({ key: table.name, label: table.label, kind: table.origin ?? 'mosaic', table })

/** Every table the tenant can chart, by where it lives. Rebuilt on render so fresh uploads show up. */
export function buildSourceCatalog(): CatalogNode[] {
  return [
    { key: 'mosaic', label: 'Mosaic objects', kind: 'mosaic', children: DATA_OBJECTS.map(leaf) },
    {
      key: 'foundry',
      label: 'Foundry',
      kind: 'foundry',
      children: FOUNDRY_CATALOG.map((catalog) => ({
        key: `foundry.${catalog.name}`,
        label: catalog.name,
        kind: 'catalog',
        children: catalog.schemas.map((schema) => ({
          key: `foundry.${catalog.name}.${schema.name}`,
          label: schema.name,
          kind: 'schema',
          children: schema.tables.map(leaf),
        })),
      })),
    },
    {
      key: 'workflow',
      label: 'Workflow outputs',
      kind: 'workflow',
      children: WORKFLOWS.map((workflow) => ({
        key: `workflow.${workflow.id}`,
        label: workflow.name,
        kind: 'run',
        meta: `Latest run ${formatDateTime(workflow.lastRun)}`,
        children: workflow.outputs.map(leaf),
      })),
    },
    { key: UPLOADS_KEY, label: 'Uploads', kind: 'upload', children: externalTables().filter((table) => table.origin === 'upload').map(leaf) },
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
