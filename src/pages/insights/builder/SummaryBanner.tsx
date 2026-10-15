import { Sparkles, X } from 'lucide-react'
import type { Dashboard } from '../../../data/dashboards'
import { MarkdownView } from './MarkdownView'
import { summarizePage } from './pageSummary'

type SummaryBannerProps = {
  /** The page as saved: viewer filters never change what the summary says. */
  dashboard: Dashboard
  filtered: boolean
  onClose: () => void
}

/** Final builder's viewer summary: written fresh from the page each time it opens, read-only, and never saved. */
export function SummaryBanner({ dashboard, filtered, onClose }: SummaryBannerProps) {
  const story = summarizePage(dashboard)
  if (!story) return null
  return (
    <section aria-label="AI summary" className="px-5 pt-5">
      <div className="rounded-lg border border-[var(--dash-card-edge)] bg-[var(--dash-card)] px-4 py-3">
        <div className="flex items-center gap-2 text-[11px] text-[var(--dash-muted)]">
          <Sparkles className="size-3 text-[var(--dash-selected)]" aria-hidden />
          <span className="font-medium">AI summary of this page</span>
          <span className="text-[var(--dash-faint)]">Generated now</span>
          {filtered && <span className="text-[var(--dash-faint)]">· Based on all data, not your filters</span>}
          <button
            type="button"
            aria-label="Close summary"
            title="Close summary"
            onClick={onClose}
            className="ml-auto flex size-6 cursor-pointer items-center justify-center rounded text-[var(--dash-muted)] hover:bg-white/10 hover:text-[var(--dash-fg)]"
          >
            <X className="size-3.5" />
          </button>
        </div>
        <div className="pt-1.5 text-sm">
          <MarkdownView markdown={story} />
        </div>
      </div>
    </section>
  )
}
