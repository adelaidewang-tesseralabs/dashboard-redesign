import { useEffect, type ReactNode, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

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

/** A graph filling the canvas. Esc or the close button returns to the dashboard. */
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
    <div role="region" aria-label={`${label}, full screen`} className="flex h-full flex-col gap-3 p-5">
      <div className="flex shrink-0 justify-end">
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-xs text-[var(--dash-muted)] hover:bg-[var(--dash-card)] hover:text-[var(--dash-fg)]"
        >
          <X className="size-4" />
          Exit full screen
          <kbd className="rounded border border-[var(--dash-card-edge)] px-1 text-[10px]">Esc</kbd>
        </button>
      </div>
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
