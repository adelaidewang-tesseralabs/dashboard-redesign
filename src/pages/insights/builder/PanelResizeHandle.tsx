import { cn } from '../../../lib/cn'
import type { SidePanelResize } from './useSidePanelWidth'

const KEY_STEP = 16

/** Drag strip on a side panel's inner edge: the left edge of a right-hand panel, or the right edge of a left-docked one. */
export function PanelResizeHandle({ resize }: { resize: SidePanelResize }) {
  const onRight = resize.edge === 'right'
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize panel"
      aria-valuenow={resize.width}
      aria-valuemin={resize.min}
      aria-valuemax={resize.max}
      tabIndex={0}
      onPointerDown={resize.startResize}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft') resize.nudge(onRight ? -KEY_STEP : KEY_STEP)
        else if (event.key === 'ArrowRight') resize.nudge(onRight ? KEY_STEP : -KEY_STEP)
        else return
        event.preventDefault()
      }}
      className={cn('group absolute inset-y-0 z-10 w-1.5 cursor-col-resize outline-none', onRight ? '-right-[3px]' : '-left-[3px]')}
    >
      <span
        className={cn(
          'absolute inset-y-0 left-1/2 w-px -translate-x-1/2 transition-colors group-hover:bg-tlai-mint group-focus-visible:bg-tlai-mint',
          resize.dragging && 'bg-tlai-mint',
        )}
      />
    </div>
  )
}
