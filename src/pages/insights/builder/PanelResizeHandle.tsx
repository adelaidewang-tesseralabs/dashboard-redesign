import { cn } from '../../../lib/cn'
import type { SidePanelResize } from './useSidePanelWidth'

const KEY_STEP = 16

/** Drag strip on a right-hand panel's left edge. */
export function PanelResizeHandle({ resize }: { resize: SidePanelResize }) {
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
        if (event.key === 'ArrowLeft') resize.nudge(KEY_STEP)
        else if (event.key === 'ArrowRight') resize.nudge(-KEY_STEP)
        else return
        event.preventDefault()
      }}
      className="group absolute inset-y-0 -left-[3px] z-10 w-1.5 cursor-col-resize outline-none"
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
