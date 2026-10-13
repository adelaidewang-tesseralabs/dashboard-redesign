import { useEffect, type ReactNode } from 'react'
import { cn } from '../../../../lib/cn'
import type { BottomPanelResize } from './useBottomPanelHeight'

const KEY_STEP = 16
/** Matches the WidgetEditor header, so collapsing leaves just the title row. */
const HEADER_HEIGHT = 44

type BottomSettingsPanelProps = {
  resize: BottomPanelResize
  /** The selected widget; changing it scrolls the widget into view above the panel. */
  itemId: string
  children: ReactNode
}

/** Builder V4: widget settings docked under the canvas, like an IDE terminal, so Tessera AI stays open beside them. */
export function BottomSettingsPanel({ resize, itemId, children }: BottomSettingsPanelProps) {
  const { collapsed } = resize

  useEffect(() => {
    document.querySelector('[data-widget][data-selected]')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [itemId, collapsed])

  return (
    <div style={{ height: collapsed ? HEADER_HEIGHT : resize.height }} className="relative flex shrink-0 flex-col overflow-hidden border-t border-white/10 bg-tlai-1">
      <div
        role="separator"
        aria-orientation="horizontal"
        aria-label="Resize settings panel"
        aria-valuenow={resize.height}
        aria-valuemin={resize.min}
        aria-valuemax={resize.max}
        tabIndex={0}
        onPointerDown={resize.startResize}
        onKeyDown={(event) => {
          if (event.key === 'ArrowUp') resize.nudge(KEY_STEP)
          else if (event.key === 'ArrowDown') resize.nudge(-KEY_STEP)
          else return
          event.preventDefault()
        }}
        className="group absolute inset-x-0 top-0 z-10 h-1.5 cursor-row-resize outline-none"
      >
        <span
          className={cn(
            'absolute inset-x-0 top-0 h-px transition-colors group-hover:bg-tlai-mint group-focus-visible:bg-tlai-mint',
            resize.dragging && 'bg-tlai-mint',
          )}
        />
      </div>
      {children}
    </div>
  )
}
