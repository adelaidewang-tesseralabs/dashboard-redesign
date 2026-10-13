import { useEffect, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
type WidgetFullScreenProps = {
  label: string
  /** Covers the canvas only, so the header and the settings or chat panel stay usable. */
  host: HTMLElement
  contentRef: RefObject<HTMLDivElement | null>
  onClose: () => void
  onSelect?: () => void
  children: ReactNode
}

function isEditable(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
}

/** A graph filling the canvas. Esc or the graph's exit button returns to the dashboard. */
export function WidgetFullScreen({ label, host, contentRef, onClose, onSelect, children }: WidgetFullScreenProps) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // Esc while typing in the settings or chat panel belongs to that field.
      if (event.key === 'Escape' && !isEditable(event.target)) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return createPortal(
    <div role="region" aria-label={`${label}, full screen`} className="flex h-full flex-col p-5">
      <div
        ref={contentRef}
        data-widget
        onClick={(event) => {
          if (!(event.target as HTMLElement).closest('button, [role=menu], a')) onSelect?.()
        }}
        className="group/widget relative min-h-0 flex-1"
      >
        {children}
      </div>
    </div>,
    host,
  )
}
