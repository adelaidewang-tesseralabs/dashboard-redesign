import type { ReactNode } from 'react'
import { CaseSensitive, Check, ChevronRight, Database, FolderClosed, FolderOpen, PlayCircle, Plus, Table2, TriangleAlert } from 'lucide-react'
import type { DataObject } from '../../../../data/dataSources'
import { cn } from '../../../../lib/cn'
import { ORIGIN_META } from '../sourceKinds'
import { countTables, type CatalogNode } from './sourceCatalog'

type SourceTreeProps = {
  nodes: CatalogNode[]
  /** Open folders and tables (a table opens to its columns). */
  expanded: Set<string>
  /** Search is on: every folder shows open. */
  forceOpen: boolean
  /** Tables already on this dashboard: they show a check instead of the add action. */
  added: Set<string>
  /** The table in the console's active tab. */
  activeTable: string | null
  onToggle: (key: string) => void
  onAdd: (table: DataObject) => void
  onOpenTable: (table: DataObject) => void
  /** Set while a console tab is open: clicking a column inserts its name. */
  onInsertColumn?: (name: string) => void
  /** Extra content rendered at the end of a folder, e.g. the Uploads folder's upload action. */
  folderFooter?: (node: CatalogNode) => ReactNode
  /** A control beside a folder's row, e.g. a workflow's run picker. Replaces the folder's meta text. */
  folderAction?: (node: CatalogNode) => ReactNode
}

const ROW = 'flex h-7 w-full items-center gap-1.5 rounded pr-1 text-left hover:bg-white/5'

/** One tree for every source, from Mosaic objects, Foundry catalogs, workflow runs and uploads down to columns. */
export function SourceTree(props: SourceTreeProps) {
  return (
    <ul role="tree" aria-label="Sources" className="flex flex-col text-sm">
      {props.nodes.map((node) => (
        <TreeNode key={node.key} node={node} depth={0} {...props} />
      ))}
    </ul>
  )
}

function TreeNode({ node, depth, ...props }: SourceTreeProps & { node: CatalogNode; depth: number }) {
  const { expanded, forceOpen, onToggle, folderFooter, folderAction } = props
  if (node.table) return <TableNode node={node} table={node.table} depth={depth} {...props} />

  const open = forceOpen || expanded.has(node.key)
  const action = folderAction?.(node)
  const row = (
    <button type="button" onClick={() => onToggle(node.key)} style={{ paddingLeft: 4 + depth * 16 }} className={cn(ROW, 'cursor-pointer', action && 'min-w-0 flex-1')}>
      <ChevronRight className={cn('size-3.5 shrink-0 text-white/40 transition-transform', open && 'rotate-90')} />
      <FolderIcon node={node} open={open} />
      <span className={cn('min-w-0 truncate text-[13px]', depth === 0 ? 'font-medium text-white' : 'text-white/85')}>{node.label}</span>
      <span className="text-xs text-white/35">{countTables(node)}</span>
      {node.meta && !action && <span className="ml-auto truncate pl-2 text-[11px] text-white/35">{node.meta}</span>}
    </button>
  )
  return (
    <li role="treeitem" aria-expanded={open}>
      {action ? (
        <div className="flex items-center gap-1 pr-1">
          {row}
          {action}
        </div>
      ) : (
        row
      )}
      {open && (
        <ul role="group">
          {node.children?.map((child) => (
            <TreeNode key={child.key} node={child} depth={depth + 1} {...props} />
          ))}
          {folderFooter?.(node)}
        </ul>
      )}
    </li>
  )
}

function TableNode({ node, table, depth, expanded, added, activeTable, onToggle, onAdd, onOpenTable, onInsertColumn }: SourceTreeProps & { node: CatalogNode; table: DataObject; depth: number }) {
  const open = expanded.has(node.key)
  const isAdded = added.has(table.name)
  return (
    <li role="treeitem" aria-expanded={open} aria-selected={activeTable === table.name}>
      <div style={{ paddingLeft: 4 + depth * 16 }} className={cn(ROW, 'group', activeTable === table.name && 'bg-white/10 hover:bg-white/10')}>
        <button type="button" aria-label={open ? `Hide ${table.label} columns` : `Show ${table.label} columns`} onClick={() => onToggle(node.key)} className="flex size-3.5 shrink-0 cursor-pointer items-center justify-center">
          <ChevronRight className={cn('size-3.5 text-white/40 transition-transform', open && 'rotate-90')} />
        </button>
        <button
          type="button"
          title={`Open ${table.name}`}
          onClick={() => onOpenTable(table)}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 text-left"
        >
          <Table2 className="size-3.5 shrink-0 text-white/45" />
          <span className="min-w-0 truncate text-[13px] text-white/85">{node.label}</span>
          {node.warning && (
            <span title={node.warning} aria-label={node.warning} className="flex shrink-0">
              <TriangleAlert className="size-3.5 text-amber-400" />
            </span>
          )}
          {node.meta && (
            <span title={node.meta} className="min-w-0 shrink-[3] truncate text-[11px] text-white/35">
              {node.meta}
            </span>
          )}
        </button>
        {isAdded ? (
          <span title="Already a dataset on this dashboard" className="flex size-6 shrink-0 items-center justify-center text-tlai-mint">
            <Check className="size-3.5" />
          </span>
        ) : (
          <button
            type="button"
            aria-label={`Add ${table.label} as a dataset`}
            title="Add as dataset"
            onClick={() => onAdd(table)}
            className="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded text-white/60 opacity-0 group-hover:opacity-100 hover:bg-white/10 hover:text-white focus-visible:opacity-100"
          >
            <Plus className="size-3.5" />
          </button>
        )}
      </div>
      {open && (
        <ul role="group" style={{ marginLeft: 11 + depth * 16 }} className="border-l border-white/15">
          {table.fields.map((field) => (
            <ColumnRow key={field.key} name={field.key} onInsert={onInsertColumn} />
          ))}
        </ul>
      )}
    </li>
  )
}

function ColumnRow({ name, onInsert }: { name: string; onInsert?: (name: string) => void }) {
  const content = (
    <>
      <CaseSensitive className="size-3.5 shrink-0 text-white/40" />
      <span className="min-w-0 truncate font-mono text-xs text-white/70">{name}</span>
    </>
  )
  return (
    <li role="treeitem">
      {onInsert ? (
        <button type="button" title={`Insert ${name} into the query`} onClick={() => onInsert(name)} className={cn(ROW, 'cursor-pointer pl-3')}>
          {content}
        </button>
      ) : (
        <div className="flex h-7 items-center gap-1.5 pl-3">{content}</div>
      )}
    </li>
  )
}

function FolderIcon({ node, open }: { node: CatalogNode; open: boolean }) {
  switch (node.kind) {
    case 'mosaic':
    case 'foundry':
    case 'workflow':
    case 'upload': {
      const { Icon, tile } = ORIGIN_META[node.kind]
      return (
        <span className={cn('flex size-5 shrink-0 items-center justify-center rounded', tile)}>
          <Icon className="size-3" />
        </span>
      )
    }
    case 'catalog':
      return <Database className="size-3.5 shrink-0 text-sky-300" />
    case 'schema':
      return open ? <FolderOpen className="size-3.5 shrink-0 text-amber-300" /> : <FolderClosed className="size-3.5 shrink-0 text-amber-300" />
    case 'run':
      return <PlayCircle className="size-3.5 shrink-0 text-fuchsia-300" />
    default: {
      const unhandled: never = node.kind
      return unhandled
    }
  }
}
