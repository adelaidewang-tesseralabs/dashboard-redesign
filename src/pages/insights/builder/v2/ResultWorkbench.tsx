import { useState } from 'react'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import type { Dashboard } from '../../../../data/dashboards'
import type { SqlResult } from '../../../../data/dataSources'
import { applyTransforms, transformCount, type DatasetTransforms } from '../../../../data/transforms'
import type { CanvasItem } from '../../../../data/widgets'
import { cn } from '../../../../lib/cn'
import { formatNumber } from '../../../../lib/format'
import { Button } from '../../../../ui/Button'
import { ResultTable } from '../SourceChart'
import { ApplyBar } from './transforms/ApplyBar'
import { graphsBrokenBy } from './transforms/graphBreakage'
import { sameTransforms } from './transforms/transformDrafts'
import { TransformsPanel } from './transforms/TransformsPanel'

type ResultWorkbenchProps = {
  dashboard: Dashboard
  datasetKey: string
  /** The dataset's untransformed query result. */
  source: SqlResult
  /** What the graphs read. */
  applied: DatasetTransforms | undefined
  /** Unapplied edits, previewed in the table only. */
  draft: DatasetTransforms | undefined
  onDraftChange: (draft: DatasetTransforms | null) => void
  onApply: (transforms: DatasetTransforms) => void
  /** Graphs built on this dataset. */
  usedIn: CanvasItem[]
  rowLimit?: boolean
}

/** Result tab: transforms on the left, a live preview of the table they produce on the right, applied to graphs on confirm. */
export function ResultWorkbench({ dashboard, datasetKey, source, applied, draft, onDraftChange, onApply, usedIn, rowLimit }: ResultWorkbenchProps) {
  const [panelOpen, setPanelOpen] = useState(true)
  const [showOriginal, setShowOriginal] = useState(false)
  const working = draft ?? applied
  const pending = draft && !sameTransforms(draft, applied) ? draft : undefined
  const total = transformCount(working)
  const original = showOriginal && total > 0
  const shown = original ? source : applyTransforms(source, working)
  // Editing while the original is shown would hide the very change being made.
  const edit = (next: DatasetTransforms) => {
    setShowOriginal(false)
    onDraftChange(sameTransforms(next, applied) ? null : next)
  }
  const tableLabel = original ? 'Original rows, before transforms' : pending ? 'Preview, not applied yet' : total > 0 ? 'Transformed result' : 'Result'

  return (
    <div className="flex min-h-0 flex-1">
      {panelOpen && (
        <aside aria-label="Transforms" className="flex w-[360px] shrink-0 flex-col border-r border-white/10">
          <div className="flex h-10 shrink-0 items-center gap-2 border-b border-white/10 pr-2 pl-4">
            <span className="flex flex-1 items-center gap-1.5 text-xs font-medium text-white">
              Transforms
              {total > 0 && <span className="text-white/45">{total}</span>}
            </span>
            <button
              type="button"
              aria-label="Hide transforms"
              onClick={() => setPanelOpen(false)}
              className="flex size-7 cursor-pointer items-center justify-center rounded-md text-white/55 hover:bg-white/10 hover:text-white"
            >
              <PanelLeftClose className="size-4" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            <TransformsPanel source={source} transforms={working} onChange={edit} rowLimit={rowLimit} />
          </div>
          {pending && (
            <ApplyBar
              breaks={graphsBrokenBy(dashboard, datasetKey, pending, usedIn)}
              graphCount={usedIn.length}
              onDiscard={() => {
                setShowOriginal(false)
                onDraftChange(null)
              }}
              onApply={() => onApply(pending)}
            />
          )}
        </aside>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-10 shrink-0 items-center gap-2 border-b border-white/10 px-4 text-xs text-white/55">
          {!panelOpen && (
            <Button variant="outline" size="xs" onClick={() => setPanelOpen(true)}>
              <PanelLeftOpen className="size-3.5" />
              Transforms
              {total > 0 && <span className="text-white/45">{total}</span>}
              {pending && <span aria-label="Unapplied changes" className="size-1.5 rounded-full bg-amber-300" />}
            </Button>
          )}
          <span className={cn('flex-1 truncate', pending && !original && 'text-amber-200')}>
            {tableLabel}
            {shown.ok && ` · ${formatNumber(shown.rows.length)} rows`}
          </span>
          {total > 0 && (
            <button
              type="button"
              aria-pressed={showOriginal}
              onClick={() => setShowOriginal((current) => !current)}
              className={cn(
                'flex h-6 cursor-pointer items-center rounded-md border border-white/10 px-2 text-xs text-white/70 hover:border-white/25 hover:text-white',
                showOriginal && 'border-white/25 bg-white/10 text-white',
              )}
            >
              Show original
            </button>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-4">
          {shown.ok ? (
            <ResultTable columns={shown.columns} rows={shown.rows} />
          ) : (
            <p className="rounded-md border border-red-400/20 bg-red-500/10 p-3 font-mono text-xs text-red-200">{shown.error}</p>
          )}
        </div>
      </div>
    </div>
  )
}
