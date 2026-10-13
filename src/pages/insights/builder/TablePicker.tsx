import { useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { findObject, runSql, type DataObject } from '../../../data/dataSources'
import { Button } from '../../../ui/Button'
import { CatalogTree } from './CatalogTree'
import { ResultTable } from './SourceChart'

type TablePickerProps = {
  attached: Set<string>
  onAttach: (tables: DataObject[], name: string) => void
}

/** Foundry "Pick tables" tab: browse the catalog, preview a table, attach the checked ones as sources. */
export function TablePicker({ attached, onAttach }: TablePickerProps) {
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [focused, setFocused] = useState<string | null>(null)
  const [name, setName] = useState('')

  const toggle = (table: DataObject) => {
    setFocused(table.name)
    setSelected((current) => {
      const next = new Set(current)
      if (!next.delete(table.name)) next.add(table.name)
      return next
    })
  }
  const attach = () => {
    onAttach([...selected].flatMap((table) => findObject(table) ?? []), name.trim())
    setSelected(new Set())
    setName('')
  }

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex w-1/2 min-w-0 flex-col border-r border-white/10">
        <div className="flex h-9 shrink-0 items-center gap-2 border-b border-white/10 px-3 text-sm">
          <Search className="size-3.5 text-white/40" />
          <input
            aria-label="Search tables"
            value={query}
            placeholder="Search tables…"
            onChange={(event) => setQuery(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-white/40"
          />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
          <CatalogTree query={query} selected={selected} attached={attached} focused={focused} onToggle={toggle} />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 p-3">
          <TablePreview table={focused} />
        </div>
        <footer className="flex shrink-0 items-center gap-2 border-t border-white/10 px-3 py-2 text-sm">
          <input
            aria-label="Data source name"
            value={name}
            disabled={selected.size > 1}
            placeholder={selected.size > 1 ? 'Each table keeps its name' : 'Data source name — defaults to the table name'}
            onChange={(event) => setName(event.target.value)}
            className="h-8 min-w-0 flex-1 rounded-md border border-white/10 bg-white/5 px-2 text-white outline-none placeholder:text-white/40 focus:border-white/30 disabled:opacity-60"
          />
          <span className="shrink-0 text-xs text-white/50">
            {selected.size ? `${selected.size} selected` : 'Select tables'}
          </span>
          <Button size="sm" disabled={selected.size === 0} onClick={attach}>
            <Plus className="size-3.5" />
            Add dataset
          </Button>
        </footer>
      </div>
    </div>
  )
}

function TablePreview({ table }: { table: string | null }) {
  if (!table) return <p className="flex h-full items-center justify-center text-sm text-white/40">Check a table to preview its rows</p>
  const result = runSql(`SELECT * FROM ${table}`)
  if (!result.ok) return null
  return (
    <div className="flex h-full flex-col gap-2">
      <span className="truncate font-mono text-xs text-white/50">{table}</span>
      <div className="min-h-0 flex-1">
        <ResultTable columns={result.columns} rows={result.rows} />
      </div>
    </div>
  )
}
