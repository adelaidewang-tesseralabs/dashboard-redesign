import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '../../../lib/cn'

export type LegendEntry = { label: string; color: string; lit: boolean }

type ChartWithLegendProps = {
  entries: LegendEntry[]
  onSelectLabel?: (label: string) => void
  children: ReactNode
}

/** A multi-color chart with its key underneath. */
export function ChartWithLegend({ entries, onSelectLabel, children }: ChartWithLegendProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useLayoutEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)))
    observer.observe(frame)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={frameRef} className="flex h-full min-h-0 w-full flex-col gap-2">
      <div className="min-h-0 min-w-0 flex-1">{children}</div>
      <ChartLegend key={`${width}:${entries.length}`} entries={entries} onSelectLabel={onSelectLabel} />
    </div>
  )
}

type ChartLegendProps = { entries: LegendEntry[]; onSelectLabel?: (label: string) => void }

/**
 * Entries that don't fit collapse into "+N more"; every label stays in the chart's tooltip.
 * Remounted (via `key`) whenever the area's width changes, so it measures afresh from the full list each time.
 */
function ChartLegend({ entries, onSelectLabel }: ChartLegendProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(entries.length)

  useLayoutEffect(() => {
    const list = listRef.current
    if (!list || shown !== entries.length) return
    const limit = list.getBoundingClientRect().bottom
    const first = [...list.children].findIndex((item) => item.getBoundingClientRect().bottom > limit + 0.5)
    // One more entry gives way so the "+N more" chip itself has room.
    if (first >= 0) setShown(Math.max(0, first - 1))
  }, [shown, entries.length])

  const hidden = entries.length - shown
  return (
    <div
      ref={listRef}
      className="flex max-h-9 shrink-0 flex-wrap justify-center gap-x-3 gap-y-1 overflow-hidden text-[11px] leading-4 text-[var(--dash-muted)]"
    >
      {entries.slice(0, shown).map((entry) => (
        <LegendItem key={entry.label} entry={entry} onSelect={onSelectLabel && (() => onSelectLabel(entry.label))} />
      ))}
      {hidden > 0 && <span className="shrink-0 text-[var(--dash-faint)]">+{hidden} more</span>}
    </div>
  )
}

function LegendItem({ entry, onSelect }: { entry: LegendEntry; onSelect?: () => void }) {
  const content = (
    <>
      <span aria-hidden style={{ background: entry.color }} className="size-2 shrink-0 rounded-full" />
      <span data-overflow-tip className="truncate">
        {entry.label}
      </span>
    </>
  )
  const className = cn('flex max-w-40 min-w-0 shrink-0 items-center gap-1.5 transition-opacity', !entry.lit && 'opacity-40')
  if (!onSelect) return <span className={className}>{content}</span>
  return (
    <button type="button" onClick={onSelect} className={cn(className, 'cursor-pointer rounded hover:text-[var(--dash-fg)]')}>
      {content}
    </button>
  )
}
