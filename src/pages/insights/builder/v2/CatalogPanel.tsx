import { useRef, useState, type DragEvent, type ReactNode } from 'react'
import { FilePlus2, Search, Upload } from 'lucide-react'
import type { DataObject } from '../../../../data/dataSources'
import { uploadTable } from '../../../../data/externalSources'
import { cn } from '../../../../lib/cn'
import { CollapseListButton } from './CollapseListButton'
import { buildSourceCatalog, filterCatalog, UPLOADS_KEY } from './sourceCatalog'
import { SourceTree } from './SourceTree'

const ACCEPT = '.csv,.tsv,.json,.jsonl,.parquet,.xlsx,.xlsm'

type CatalogPanelProps = {
  /** Tables already on this dashboard. */
  added: Set<string>
  activeTable: string | null
  onAddTable: (table: DataObject) => void
  onOpenTable: (table: DataObject) => void
  /** Omitted when SQL authoring is off (builder V6). */
  onNewSql?: () => void
  onInsertColumn?: (name: string) => void
  onCollapse?: () => void
}

/** The Data tab's Catalog view: browse every source the tenant can read, open tables in the console, or add them as datasets. */
export function CatalogPanel({ added, activeTable, onAddTable, onOpenTable, onNewSql, onInsertColumn, onCollapse }: CatalogPanelProps) {
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(() => new Set(['mosaic']))
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const needle = query.trim().toLowerCase()

  const toggle = (key: string) =>
    setExpanded((current) => {
      const next = new Set(current)
      if (!next.delete(key)) next.add(key)
      return next
    })
  const upload = (files: FileList | null) => {
    const tables = Array.from(files ?? []).map((file) => uploadTable(file.name))
    if (tables.length === 0) return
    setExpanded((current) => new Set([...current, UPLOADS_KEY]))
    tables.forEach(onAddTable)
    onOpenTable(tables[0])
  }
  const onDrop = (event: DragEvent) => {
    event.preventDefault()
    setDragging(false)
    upload(event.dataTransfer.files)
  }

  return (
    <nav
      aria-label="Catalog"
      onDragOver={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false)
      }}
      onDrop={onDrop}
      className={cn('relative flex w-72 shrink-0 flex-col border-r border-white/10 bg-tlai-1', dragging && 'outline-2 -outline-offset-2 outline-sky-300/60 outline-dashed')}
    >
      <div className="flex h-11 shrink-0 items-center gap-1 border-b border-white/10 pr-2 pl-4">
        <span className="flex-1 text-sm font-medium text-white">Catalog</span>
        {onNewSql && (
          <HeaderAction label="New SQL query" onClick={onNewSql}>
            <FilePlus2 className="size-4" />
          </HeaderAction>
        )}
        <HeaderAction label="Upload file" onClick={() => fileRef.current?.click()}>
          <Upload className="size-4" />
        </HeaderAction>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="sr-only"
          onChange={(event) => {
            upload(event.target.files)
            event.target.value = ''
          }}
        />
        {onCollapse && <CollapseListButton onClick={onCollapse} />}
      </div>
      <div className="px-2 pt-2">
        <label className="flex h-8 items-center gap-2 rounded-md border border-white/10 bg-white/5 px-2 text-sm focus-within:border-white/30">
          <Search className="size-3.5 text-white/40" />
          <input
            aria-label="Search catalog"
            value={query}
            placeholder="Search tables…"
            onChange={(event) => setQuery(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-white/40"
          />
        </label>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
        <SourceTree
          nodes={filterCatalog(buildSourceCatalog(), needle)}
          expanded={expanded}
          forceOpen={!!needle}
          added={added}
          activeTable={activeTable}
          onToggle={toggle}
          onAdd={onAddTable}
          onOpenTable={onOpenTable}
          onInsertColumn={onInsertColumn}
        />
      </div>
      {dragging && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-tlai-1/80 text-sm text-sky-200">
          <Upload className="mr-2 size-4" />
          Drop files to upload them
        </div>
      )}
    </nav>
  )
}

function HeaderAction({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="flex size-7 cursor-pointer items-center justify-center rounded text-white/60 hover:bg-white/10 hover:text-white">
      {children}
    </button>
  )
}
