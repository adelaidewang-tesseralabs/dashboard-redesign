import { useRef, type ReactNode } from 'react'
import { cn } from '../../../lib/cn'

type SelectableWidgetProps = {
  selected: boolean
  readOnly: boolean
  /** Refreshing, or being changed by Tessera AI. */
  busy: boolean
  onSelect: () => void
  className?: string
  children: ReactNode
}

/** Pointer travel (px) beyond which a press counts as a drag, not a click that opens the widget panel. */
const CLICK_SLOP = 4

/** A widget's frame: a click selects it, a drag doesn't. */
export function SelectableWidget({ selected, readOnly, busy, onSelect, className, children }: SelectableWidgetProps) {
  const pressRef = useRef<{ x: number; y: number } | null>(null)
  return (
    <div
      data-widget
      data-selected={(!readOnly && selected) || undefined}
      onMouseDown={(event) => {
        pressRef.current = { x: event.clientX, y: event.clientY }
      }}
      onClick={(event) => {
        const press = pressRef.current
        if (!readOnly && press && Math.hypot(event.clientX - press.x, event.clientY - press.y) <= CLICK_SLOP) onSelect()
      }}
      className={cn(
        // Scroll margin keeps a widget scrolled into view (V4's settings panel) clear of the floating toolbar.
        'scroll-mt-4 scroll-mb-20 rounded-lg ring-1 ring-[var(--dash-card-edge)] transition-opacity',
        !readOnly && selected && 'outline-2 outline-offset-2 outline-[var(--dash-selected)]',
        busy && 'animate-pulse opacity-50',
        className,
      )}
    >
      {children}
    </div>
  )
}
