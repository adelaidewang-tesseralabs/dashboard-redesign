import { Check, ExternalLink, History } from 'lucide-react'
import { workflowRuns, workflowUrl, type Workflow } from '../../../../data/externalSources'
import { cn } from '../../../../lib/cn'
import { formatDateTime } from '../../../../lib/format'
import { Popover } from '../../../../ui/Popover'

type RunVersionPickerProps = {
  workflow: Workflow
  /** The pinned run; unset reads the latest run. */
  pinnedRunId?: string
  onPin: (runId: string | undefined) => void
}

/** Picks which run of a workflow its outputs are read from. Read-only: versions are made and reverted in Workflows. */
export function RunVersionPicker({ workflow, pinnedRunId, onPin }: RunVersionPickerProps) {
  const runs = workflowRuns(workflow)
  const latest = runs[0]
  const selected = runs.find((run) => run.id === pinnedRunId) ?? latest
  const pinned = selected.id !== latest.id

  return (
    <Popover
      align="end"
      className="shrink-0"
      trigger={({ open, toggle }) => (
        <button
          type="button"
          aria-expanded={open}
          aria-label={`${workflow.name} run version`}
          title={pinned ? `Pinned to v${selected.version}` : `Latest run, v${selected.version}`}
          onClick={toggle}
          className={cn(
            'flex h-6 cursor-pointer items-center gap-1 rounded border px-1.5 text-[11px] tabular-nums',
            pinned ? 'border-amber-300/40 bg-amber-300/10 text-amber-200 hover:bg-amber-300/15' : 'border-white/10 text-white/60 hover:bg-white/10 hover:text-white',
            open && 'bg-white/10',
          )}
        >
          <History className="size-3" aria-hidden />v{selected.version}
          {pinned && <span className="text-amber-200/70">· Pinned</span>}
        </button>
      )}
      contentClassName="w-64 p-1"
    >
      {(close) => (
        <div className="flex flex-col text-sm">
          <div className="px-2 pt-1.5 pb-1 text-xs text-white/50">Read outputs from run</div>
          {runs.map((run) => (
            <button
              key={run.id}
              type="button"
              onClick={() => {
                onPin(run.id === latest.id ? undefined : run.id)
                close()
              }}
              className={cn('flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-left hover:bg-white/10', run.id === selected.id && 'bg-white/5')}
            >
              <span className="mt-0.5 rounded bg-white/10 px-1.5 text-[11px] font-medium tabular-nums text-white/85">v{run.version}</span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="flex items-center gap-1.5 text-[13px] text-white/90">
                  {formatDateTime(run.ranAt)}
                  {run.id === latest.id && <span className="rounded-full bg-tlai-mint/15 px-1.5 text-[10px] text-tlai-mint">Latest</span>}
                </span>
                <span className="truncate text-[11px] text-white/45">{run.author}</span>
              </span>
              {run.id === selected.id && <Check className="mt-1 size-3.5 shrink-0 text-tlai-mint" aria-hidden />}
            </button>
          ))}
          <div className="my-1 h-px bg-white/10" />
          <p className="px-2 py-1 text-[11px] leading-4 text-white/45">Graphs read the chosen run until you pick another. Versions are created and reverted in Workflows.</p>
          <a
            href={workflowUrl(workflow)}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-white/80 hover:bg-white/10 hover:text-white"
          >
            <ExternalLink className="size-3.5" aria-hidden />
            View workflow details
          </a>
        </div>
      )}
    </Popover>
  )
}
