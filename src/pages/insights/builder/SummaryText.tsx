import { Pin, Sparkles } from 'lucide-react'
import type { Dashboard } from '../../../data/dashboards'
import { useDashboards } from '../../../data/DashboardsStore'
import type { CanvasItem, SummaryItem } from '../../../data/widgets'
import { useToast } from '../../../ui/Toast'
import { summarizePage, summaryBasis } from './pageSummary'
import { TextWidget } from './TextWidget'

type SummaryTextProps = {
  dashboard: Dashboard
  item: SummaryItem
  title: string
  readOnly: boolean
  selected: boolean
}

const NO_GRAPHS = 'Add graphs to this page and AI will summarize what they show.'

/** A page summary by Tessera AI. It rewrites itself as the graphs change until someone edits it; then it asks first. */
export function SummaryText({ dashboard, item, title, readOnly, selected }: SummaryTextProps) {
  const { updateWidget } = useDashboards()
  const story = summarizePage(dashboard) ?? NO_GRAPHS
  const basis = summaryBasis(dashboard)
  const { inline } = item.summary
  const saveText = (markdown: string) => updateWidget(dashboard.id, { ...item, markdown, summary: { basis, edited: true, inline } })
  const props = { dashboardId: dashboard.id, title, readOnly, selected, onSaveText: saveText, fitContent: !inline, doubleClickToEdit: inline }
  /** The summary above the grid is always pinned; one in a text block only when its block is. */
  const pinned = !readOnly && (!inline || !!item.pinnedAt)

  if (!item.summary.edited) return <TextWidget {...props} item={{ ...item, markdown: story }} badge={<AiSummaryLabel pinned={pinned} />} />
  const outdated = !readOnly && item.summary.basis !== basis
  return (
    <TextWidget
      {...props}
      item={item}
      badge={inline && <AiSummaryLabel pinned={pinned} />}
      footer={
        outdated && (
          <OutdatedNotice
            onReplace={() => updateWidget(dashboard.id, { ...item, markdown: story, summary: { basis, inline } })}
            onKeep={() => updateWidget(dashboard.id, { ...item, summary: { basis, edited: true, inline } })}
          />
        )
      }
    />
  )
}

/** Final builder: an empty text block can be filled with a summary of its page, which then sits wherever the block does. */
export function GenerateSummaryButton({ dashboard, item }: { dashboard: Dashboard; item: Extract<CanvasItem, { source: 'text' }> }) {
  const { updateWidget } = useDashboards()
  const toast = useToast()
  const generate = () => {
    if (!summarizePage(dashboard)) {
      toast('Add a graph to this page first')
      return
    }
    updateWidget(dashboard.id, { ...item, markdown: '', summary: { basis: summaryBasis(dashboard), inline: true } })
  }
  return (
    <button
      type="button"
      onClick={generate}
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-[var(--dash-border)] px-2.5 py-1 text-xs font-medium text-[var(--dash-fg)] hover:bg-white/10"
    >
      <Sparkles className="size-3.5 text-[var(--dash-selected)]" aria-hidden />
      Generate AI summary
    </button>
  )
}

function AiSummaryLabel({ pinned }: { pinned: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--dash-muted)]">
      <Sparkles className="size-3 text-[var(--dash-selected)]" aria-hidden />
      AI summary
      {pinned && <PinnedMark />}
    </span>
  )
}

/** Editors can drag everything else, so the summary says why it won't move. */
export function PinnedMark() {
  return (
    <span title="Pinned to the top of the page" aria-label="Pinned to the top of the page" className="flex size-5 items-center justify-center text-[var(--dash-faint)]">
      <Pin className="size-3" />
    </span>
  )
}

function OutdatedNotice({ onReplace, onKeep }: { onReplace: () => void; onKeep: () => void }) {
  return (
    // Clicks here shouldn't also select the block and open its editor.
    <div onClick={(event) => event.stopPropagation()} className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-t border-[var(--dash-card-edge)] px-4 py-2 text-xs">
      <span className="text-[var(--dash-muted)]">The graphs changed since this summary was written.</span>
      <span className="ml-auto flex items-center gap-1">
        <button type="button" onClick={onKeep} className="cursor-pointer rounded px-2 py-1 text-[var(--dash-muted)] hover:bg-white/10 hover:text-[var(--dash-fg)]">
          Keep my text
        </button>
        <button type="button" onClick={onReplace} className="cursor-pointer rounded bg-[var(--dash-selected)]/15 px-2 py-1 font-medium text-[var(--dash-fg)] hover:bg-[var(--dash-selected)]/25">
          Replace with new summary
        </button>
      </span>
    </div>
  )
}
