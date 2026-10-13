import { useState, type ReactNode } from 'react'
import { Check, ChevronRight, Database, FolderClosed, FolderOpen, Table2 } from 'lucide-react'
import type { DataObject } from '../../../data/dataSources'
import { FOUNDRY_CATALOG } from '../../../data/externalSources'
import { cn } from '../../../lib/cn'

type CatalogTreeProps = {
  query: string
  selected: Set<string>
  /** Tables already on this dashboard — shown checked and locked. */
  attached: Set<string>
  focused: string | null
  onToggle: (table: DataObject) => void
}

const DEFAULT_EXPANDED = ['dh', 'dh.dash_07801955']

/** Catalog → schema → table browser modeled on the main app's Foundry "Table Catalog". */
export function CatalogTree({ query, selected, attached, focused, onToggle }: CatalogTreeProps) {
  const [expanded, setExpanded] = useState(() => new Set(DEFAULT_EXPANDED))
  const needle = query.trim().toLowerCase()
  const toggleExpanded = (key: string) =>
    setExpanded((current) => {
      const next = new Set(current)
      if (!next.delete(key)) next.add(key)
      return next
    })

  const catalogs = FOUNDRY_CATALOG.map((catalog) => ({
    ...catalog,
    schemas: catalog.schemas
      .map((schema) => ({ ...schema, tables: schema.tables.filter((table) => !needle || table.name.includes(needle)) }))
      .filter((schema) => schema.tables.length > 0),
  })).filter((catalog) => catalog.schemas.length > 0)

  if (catalogs.length === 0) return <p className="px-2 py-6 text-center text-xs text-white/45">No tables match “{query}”</p>

  return (
    <ul role="tree" aria-label="Table catalog" className="flex flex-col text-sm">
      {catalogs.map((catalog) => {
        const catalogOpen = !!needle || expanded.has(catalog.name)
        const tableCount = catalog.schemas.reduce((total, schema) => total + schema.tables.length, 0)
        return (
          <TreeBranch
            key={catalog.name}
            open={catalogOpen}
            onToggle={() => toggleExpanded(catalog.name)}
            icon={<Database className="size-3.5 text-sky-300" />}
            label={<span className="font-medium text-white">{catalog.name}</span>}
            count={tableCount}
          >
            {catalog.schemas.map((schema) => {
              const key = `${catalog.name}.${schema.name}`
              const schemaOpen = !!needle || expanded.has(key)
              const FolderIcon = schemaOpen ? FolderOpen : FolderClosed
              return (
                <TreeBranch
                  key={key}
                  depth={1}
                  open={schemaOpen}
                  onToggle={() => toggleExpanded(key)}
                  icon={<FolderIcon className="size-3.5 text-amber-300" />}
                  label={<span className="text-white/85">{schema.name}</span>}
                  count={schema.tables.length}
                >
                  {schema.tables.map((table) => (
                    <TableRow
                      key={table.name}
                      table={table}
                      checked={selected.has(table.name) || attached.has(table.name)}
                      locked={attached.has(table.name)}
                      focused={focused === table.name}
                      onToggle={() => onToggle(table)}
                    />
                  ))}
                </TreeBranch>
              )
            })}
          </TreeBranch>
        )
      })}
    </ul>
  )
}

type TreeBranchProps = {
  open: boolean
  onToggle: () => void
  icon: ReactNode
  label: ReactNode
  count: number
  depth?: 0 | 1
  children: ReactNode
}

function TreeBranch({ open, onToggle, icon, label, count, depth = 0, children }: TreeBranchProps) {
  return (
    <li role="treeitem" aria-expanded={open}>
      <button
        type="button"
        onClick={onToggle}
        className={cn('flex h-7 w-full cursor-pointer items-center gap-1.5 rounded pr-2 text-left hover:bg-white/5', depth === 0 ? 'pl-1' : 'pl-5')}
      >
        <ChevronRight className={cn('size-3.5 shrink-0 text-white/40 transition-transform', open && 'rotate-90')} />
        {icon}
        <span className="min-w-0 truncate font-mono text-xs">{label}</span>
        <span className="text-xs text-white/35">{count}</span>
      </button>
      {open && <ul role="group">{children}</ul>}
    </li>
  )
}

type TableRowProps = { table: DataObject; checked: boolean; locked: boolean; focused: boolean; onToggle: () => void }

function TableRow({ table, checked, locked, focused, onToggle }: TableRowProps) {
  return (
    <li role="treeitem" aria-selected={checked}>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={locked}
        title={locked ? 'Already a source on this dashboard' : table.name}
        onClick={onToggle}
        className={cn(
          'flex h-7 w-full cursor-pointer items-center gap-2 rounded pr-2 pl-10 text-left hover:bg-white/5 disabled:cursor-default disabled:opacity-50',
          focused && 'bg-white/10',
        )}
      >
        <span
          aria-hidden
          className={cn(
            'flex size-3.5 shrink-0 items-center justify-center rounded-sm border border-white/30',
            checked && 'border-tlai-mint bg-tlai-mint text-black',
          )}
        >
          {checked && <Check className="size-2.5" strokeWidth={3} />}
        </span>
        <Table2 className="size-3.5 shrink-0 text-white/45" />
        <span className="min-w-0 truncate font-mono text-xs text-white/80">{table.label}</span>
      </button>
    </li>
  )
}
