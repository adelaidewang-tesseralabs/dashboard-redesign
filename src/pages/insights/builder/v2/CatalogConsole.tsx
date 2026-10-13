import type { ReactNode } from 'react'
import { AlignLeft, CircleAlert, Copy, FileCode2, Play, Plus, Table2 } from 'lucide-react'
import type { DataObject, SqlResult } from '../../../../data/dataSources'
import { cn } from '../../../../lib/cn'
import { Button } from '../../../../ui/Button'
import { ResultTable } from '../SourceChart'
import { ConsoleTabBar } from './ConsoleTabBar'
import { sqlKey, tableKey } from './datasets'
import { SqlConsoleEditor } from './SqlConsoleEditor'
import type { ConsoleTab, ConsoleTabs } from './useConsoleTabs'

type CatalogConsoleProps = {
  consoleTabs: ConsoleTabs
  /** Tables already on this dashboard. */
  added: Set<string>
  onAddTable: (table: DataObject) => void
  onSaveQuery: (tab: ConsoleTab) => void
  onOpenDataset: (key: string) => void
  /** False in builder V6: tabs are read-only table previews, with no SQL editor or free queries. */
  editable?: boolean
}

const ICON_BUTTON = 'flex size-7 cursor-pointer items-center justify-center rounded text-white/60 hover:bg-white/10 hover:text-white disabled:pointer-events-none disabled:opacity-35'

/** Right side of the Data tab in Catalog view: a Foundry-style console where tables open as preview tabs next to free queries. */
export function CatalogConsole({ consoleTabs, added, onAddTable, onSaveQuery, onOpenDataset, editable = true }: CatalogConsoleProps) {
  const { tabs, active } = consoleTabs
  const newQuery = editable ? consoleTabs.newQuery : undefined
  return (
    <section aria-label="Console" className="flex min-w-0 flex-1 flex-col bg-tlai-1">
      <ConsoleTabBar tabs={tabs} activeId={active?.id ?? null} onSelect={consoleTabs.select} onClose={consoleTabs.close} onNewQuery={newQuery} />
      {active ? (
        <>
          <div className="flex h-10 shrink-0 items-center gap-0.5 border-b border-white/10 px-2">
            {editable && (
              <>
                <button type="button" aria-label="Run" title="Run (⌘↵)" onClick={consoleTabs.run} disabled={!active.sql.trim()} className={ICON_BUTTON}>
                  <Play className="size-4 fill-emerald-400 text-emerald-400" />
                </button>
                <button type="button" aria-label="Format SQL" title="Format SQL" onClick={consoleTabs.format} className={ICON_BUTTON}>
                  <AlignLeft className="size-4" />
                </button>
                <button type="button" aria-label="Copy SQL" title="Copy SQL" onClick={() => void navigator.clipboard?.writeText(active.sql)} className={ICON_BUTTON}>
                  <Copy className="size-3.5" />
                </button>
              </>
            )}
            <span className="min-w-0 flex-1 truncate px-2 font-mono text-[11px] text-white/35">{active.table?.name}</span>
            <DatasetAction tab={active} added={added} onAddTable={onAddTable} onSaveQuery={onSaveQuery} onOpenDataset={onOpenDataset} />
          </div>
          {editable && (
            <div className="flex h-44 shrink-0 flex-col border-b border-white/10">
              <SqlConsoleEditor key={active.id} value={active.sql} onChange={consoleTabs.setSql} onRun={consoleTabs.run} textareaRef={consoleTabs.editorRef} />
            </div>
          )}
          <Output result={active.result} />
        </>
      ) : (
        <EmptyConsole onNewQuery={newQuery} />
      )}
    </section>
  )
}

/** A tab still showing its table as opened adds that table; anything edited or typed is saved as a SQL dataset. */
function DatasetAction({ tab, added, onAddTable, onSaveQuery, onOpenDataset }: { tab: ConsoleTab } & Omit<CatalogConsoleProps, 'consoleTabs'>) {
  const plainTable = tab.table && tab.sql.trim() === `SELECT *\nFROM ${tab.table.name}` ? tab.table : null
  const existing = plainTable ? (added.has(plainTable.name) ? tableKey(plainTable.name) : null) : tab.datasetId ? sqlKey(tab.datasetId) : null
  if (existing) {
    return (
      <Button variant="outline" size="sm" onClick={() => onOpenDataset(existing)}>
        Open dataset
      </Button>
    )
  }
  return (
    <Button size="sm" disabled={tab.result?.ok !== true} onClick={() => (plainTable ? onAddTable(plainTable) : onSaveQuery(tab))}>
      <Plus className="size-3.5" />
      Add as dataset
    </Button>
  )
}

function Output({ result }: { result: SqlResult | null }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-white/10 px-4 text-xs text-white/70">
        Output
        {result && <StatusBadge failed={!result.ok} />}
        {result?.ok && <span className="ml-auto text-white/40">{result.rows.length === 1 ? '1 row' : `${result.rows.length} rows`}</span>}
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-3">
        {!result && <Hint>Run the query to see results (⌘ Enter)</Hint>}
        {result && !result.ok && (
          <div className="flex h-full flex-col items-center justify-center gap-1.5 text-center">
            <CircleAlert className="size-4 text-red-400" />
            <p className="text-xs text-white/85">Query failed</p>
            <p className="max-w-md text-[11px] text-white/45">{result.error}</p>
          </div>
        )}
        {result?.ok && <ResultTable columns={result.columns} rows={result.rows} />}
      </div>
    </div>
  )
}

function StatusBadge({ failed }: { failed: boolean }) {
  return <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', failed ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/15 text-emerald-300')}>{failed ? 'Failed' : 'Succeeded'}</span>
}

function Hint({ children }: { children: ReactNode }) {
  return <p className="flex h-full items-center justify-center text-xs text-white/40">{children}</p>
}

function EmptyConsole({ onNewQuery }: { onNewQuery?: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex gap-2 text-white/40">
        <Table2 className="size-5" />
        {onNewQuery && <FileCode2 className="size-5" />}
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-medium text-white">{onNewQuery ? 'Preview tables and write queries' : 'Preview tables'}</h2>
        <p className="max-w-xs text-xs text-white/50">Click a table in the catalog to open it in a tab. Each tab can be added to the dashboard as a dataset.</p>
      </div>
      {onNewQuery && (
        <Button variant="outline" size="sm" onClick={onNewQuery}>
          <Plus className="size-3.5" />
          New query
        </Button>
      )}
    </div>
  )
}
