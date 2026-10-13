import { useState } from 'react'
import { FileTerminal, Plus, Search, Table2 } from 'lucide-react'
import { runSql, type DataObject } from '../../../../data/dataSources'
import { cn } from '../../../../lib/cn'
import { Button } from '../../../../ui/Button'
import { Dialog } from '../../../../ui/Dialog'
import { CatalogTree } from '../CatalogTree'
import { editorInputClass } from '../EditorFields'
import { SourceIcon } from '../sourceKinds'

export type FoundrySourceMode = 'tables' | 'sql'

type AddFoundrySourceDialogProps = {
  initialMode: FoundrySourceMode
  /** Tables already on this dashboard, shown checked and locked. */
  attached: Set<string>
  onClose: () => void
  onAddTables: (tables: DataObject[], name: string) => void
  onAddQuery: (name: string, sql: string) => void
}

const MODES = [
  { value: 'tables', label: 'Pick tables', Icon: Table2 },
  { value: 'sql', label: 'SQL query', Icon: FileTerminal },
] as const satisfies { value: FoundrySourceMode; label: string; Icon: typeof Table2 }[]

/** The main app's "Add Foundry Source" dialog (AttachFoundryTableModal), with its copy kept verbatim. Mount it only while open, so each opening starts clean. */
export function AddFoundrySourceDialog({ initialMode, attached, onClose, onAddTables, onAddQuery }: AddFoundrySourceDialogProps) {
  const [mode, setMode] = useState<FoundrySourceMode>(initialMode)
  const [selected, setSelected] = useState<DataObject[]>([])
  const [name, setName] = useState('')
  const [sql, setSql] = useState('')
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  const isQuery = mode === 'sql'
  const count = isQuery ? 1 : selected.length
  const canSubmit = isQuery ? Boolean(sql.trim() && name.trim()) : selected.length > 0

  const toggle = (table: DataObject) =>
    setSelected((current) => (current.some((item) => item.name === table.name) ? current.filter((item) => item.name !== table.name) : [...current, table]))
  const submit = () => {
    if (!isQuery) {
      onAddTables(selected, selected.length === 1 ? name.trim() : '')
      return
    }
    const result = runSql(sql)
    if (!result.ok) {
      setError(result.error)
      return
    }
    onAddQuery(name.trim(), sql.trim())
  }

  return (
    <Dialog
      open
      onClose={onClose}
      size="wide"
      icon={<SourceIcon origin="foundry" size="lg" />}
      title="Add Foundry Source"
      description="Pick one or more Data Foundry tables, or write a query, to use in this dashboard's graphs"
      footer={
        <>
          <span className="mr-auto min-w-0 self-center truncate text-xs text-white/50">
            <SelectionSummary isQuery={isQuery} selected={selected} />
          </span>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!canSubmit} onClick={submit}>
            <Plus className="size-4" />
            {count > 1 ? `Add ${count} Sources` : 'Add Source'}
          </Button>
        </>
      }
    >
      <div className="flex h-[52vh] flex-col gap-3">
        <div role="tablist" aria-label="Foundry source" className="flex shrink-0 gap-1 rounded-lg bg-white/5 p-1">
          {MODES.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={mode === value}
              onClick={() => setMode(value)}
              className={cn(
                'flex h-8 flex-1 cursor-pointer items-center justify-center gap-2 rounded-md text-xs text-white/50 hover:text-white/80',
                mode === value && 'bg-white/10 text-white hover:text-white',
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>

        {count > 1 ? (
          <span className="shrink-0 text-xs text-white/50">Each source is named after its table</span>
        ) : (
          <label className="flex shrink-0 flex-col gap-1 text-xs text-white/50">
            Data source name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={isQuery ? 'e.g. Active customers' : 'Defaults to the table name'}
              className={cn(editorInputClass, 'h-8')}
            />
          </label>
        )}

        {isQuery ? (
          <div className="flex min-h-0 flex-1 flex-col gap-2">
            <textarea
              aria-label="SQL query"
              value={sql}
              onChange={(event) => {
                setSql(event.target.value)
                setError(null)
              }}
              placeholder="SELECT * FROM catalog.schema.table WHERE ..."
              className={cn(editorInputClass, 'min-h-0 flex-1 resize-none font-mono')}
            />
            {error && <p className="shrink-0 text-xs text-red-300">{error}</p>}
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-white/10">
            <div className="flex h-9 shrink-0 items-center gap-2 border-b border-white/10 px-3 text-sm">
              <Search className="size-3.5 text-white/40" />
              <input
                aria-label="Search tables"
                value={search}
                placeholder="Search tables…"
                onChange={(event) => setSearch(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-white/40"
              />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
              <CatalogTree
                query={search}
                selected={new Set(selected.map((table) => table.name))}
                attached={attached}
                focused={null}
                onToggle={toggle}
              />
            </div>
          </div>
        )}
      </div>
    </Dialog>
  )
}

function SelectionSummary({ isQuery, selected }: { isQuery: boolean; selected: DataObject[] }) {
  if (isQuery) return 'The query result is materialized as a lake table'
  if (selected.length === 0) return 'Select tables above'
  if (selected.length > 1) return `${selected.length} tables selected`
  return (
    <>
      Selected: <span className="font-mono text-white/80">{selected[0].name}</span>
    </>
  )
}
