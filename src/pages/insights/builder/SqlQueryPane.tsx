import { useState } from 'react'
import { Play } from 'lucide-react'
import { DATA_OBJECTS, DEFAULT_SQL, groupBySql, runSql, type DataObject, type SqlResult } from '../../../data/dataSources'
import { isChartStyle, type CanvasItem, type ChartStyle } from '../../../data/widgets'
import { Button } from '../../../ui/Button'
import { Select } from '../../../ui/Select'
import { CHART_STYLE_OPTIONS } from './chartStyles'
import { ResultTable } from './SourceChart'

type SqlQueryPaneProps = {
  /** Attached lake tables, offered as quick-start chips after the Mosaic objects. */
  sources: DataObject[]
  onAdd: (item: CanvasItem) => void
}

/** Ungrouped rows have no counts to plot, so only a row count or the table applies. */
const UNGROUPED_STYLES = new Set<string>(['metric', 'table'])

/** Foundry "SQL query" tab: write a query, run it, preview rows, then add it to the canvas. */
export function SqlQueryPane({ sources, onAdd }: SqlQueryPaneProps) {
  const [sql, setSql] = useState(DEFAULT_SQL)
  const [result, setResult] = useState<SqlResult | null>(null)
  const [title, setTitle] = useState('')
  const [chart, setChart] = useState<ChartStyle>('bar')

  const run = () => {
    const next = runSql(sql)
    setResult(next)
    if (next.ok && !next.grouped) setChart('table')
  }
  const rowsCanUse = (style: string) => !(result?.ok && !result.grouped) || UNGROUPED_STYLES.has(style)
  const canAdd = result?.ok === true && rowsCanUse(chart)

  const add = () => {
    if (!result?.ok) return
    const fallbackTitle = result.grouped ? `Count by ${result.columns[0]}` : 'Query results'
    onAdd({ id: `sql-${crypto.randomUUID()}`, source: 'sql', title: title.trim() || fallbackTitle, sql, chart })
    setResult(null)
    setTitle('')
  }

  return (
    <div className="flex min-h-0 flex-1">
      <div className="flex w-1/2 min-w-0 flex-col border-r border-white/10">
        <div className="flex h-9 shrink-0 items-center gap-2 border-b border-white/10 pr-2 pl-3">
          <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto font-mono text-[11px] [scrollbar-width:none]">
            {[...DATA_OBJECTS, ...sources].map((object) => (
              <button
                key={object.name}
                type="button"
                title={`Query ${object.name}`}
                onClick={() => {
                  setSql(groupBySql(object, object.fields[0]))
                  setResult(null)
                }}
                className="shrink-0 cursor-pointer rounded px-1.5 py-0.5 text-white/50 hover:bg-white/10 hover:text-white"
              >
                {object.label}
              </button>
            ))}
          </div>
          <Button size="xs" onClick={run}>
            <Play className="size-3" />
            Run
          </Button>
        </div>
        <div className="min-h-0 flex-1 font-mono text-[13px] leading-6">
          <textarea
            aria-label="SQL query"
            value={sql}
            spellCheck={false}
            onChange={(event) => setSql(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                event.preventDefault()
                run()
              }
            }}
            className="h-full w-full resize-none bg-transparent p-4 text-white outline-none"
          />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 p-3">
          <ResultPane result={result} />
        </div>
        <footer className="flex shrink-0 items-center gap-2 border-t border-white/10 px-3 py-2">
          <input
            aria-label="Graph title"
            value={title}
            placeholder="Graph title"
            onChange={(event) => setTitle(event.target.value)}
            className="h-8 min-w-0 flex-1 rounded-md border border-white/10 bg-white/5 px-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-white/30"
          />
          <div className="w-44 shrink-0">
            <Select
              aria-label="Visualization"
              value={chart}
              options={CHART_STYLE_OPTIONS.map((option) => ({ ...option, disabled: !rowsCanUse(option.value) }))}
              onChange={(next) => isChartStyle(next) && setChart(next)}
            />
          </div>
          <Button size="sm" disabled={!canAdd} onClick={add}>
            Add to canvas
          </Button>
        </footer>
      </div>
    </div>
  )
}

function ResultPane({ result }: { result: SqlResult | null }) {
  if (!result) {
    return <p className="flex h-full items-center justify-center text-sm text-white/40">Run the query to preview results (⌘ Enter)</p>
  }
  if (!result.ok) {
    return <p className="rounded-md border border-red-400/20 bg-red-500/10 p-3 font-mono text-xs text-red-200">{result.error}</p>
  }
  return <ResultTable columns={result.columns} rows={result.rows} />
}
