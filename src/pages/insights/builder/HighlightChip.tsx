import { X } from 'lucide-react'
import type { CrossHighlight } from './crossHighlight'

/** Tells a viewer why most of the dashboard just turned grey, and how to undo it. */
export function HighlightChip({ highlight, onClear }: { highlight: CrossHighlight; onClear: () => void }) {
  return (
    <div className="flex w-fit items-center gap-1.5 rounded-full border border-[var(--dash-border)] bg-[var(--dash-card)] py-1 pr-1 pl-3 text-xs text-[var(--dash-muted)]">
      <span>
        Highlighting {highlight.columnLabel}: <span className="font-medium text-[var(--dash-fg)]">{highlight.value}</span>
      </span>
      <button
        type="button"
        aria-label="Clear highlight"
        title="Clear highlight (Esc)"
        onClick={onClear}
        className="flex size-5 cursor-pointer items-center justify-center rounded-full text-[var(--dash-muted)] hover:bg-white/10 hover:text-[var(--dash-fg)]"
      >
        <X className="size-3" />
      </button>
    </div>
  )
}
