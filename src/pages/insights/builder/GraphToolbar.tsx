import { useEffect, useRef, useState, type RefObject } from 'react'
import { Download, Link2, Maximize2, Minimize2 } from 'lucide-react'
import { cn } from '../../../lib/cn'
import { Menu } from '../../../ui/Menu'
import { GraphActionsMenu, graphToolButtonClass, type GraphViewActions, type WidgetActions } from './GraphActionsMenu'
import { WidgetComment } from './WidgetComment'

type GraphToolbarProps = {
  label: string
  actions?: WidgetActions
  view?: GraphViewActions
  onComment?: (text: string) => void
}

/** Below this card width the five buttons would cover most of the title. */
const NARROW_CARD_PX = 320

/** Whether the canvas card (or full-screen view) holding `ref` is too narrow for every button. */
function useNarrowCard(ref: RefObject<HTMLElement | null>) {
  const [narrow, setNarrow] = useState(false)
  useEffect(() => {
    const card = ref.current?.closest('[data-widget-id], [data-widget]')
    if (!card) return
    const observer = new ResizeObserver(([entry]) => setNarrow(entry.contentRect.width < NARROW_CARD_PX))
    observer.observe(card)
    return () => observer.disconnect()
  }, [ref])
  return narrow
}

/**
 * A canvas item's top-right icon buttons: Ask AI, copy link, download, full screen, then "…" for editing.
 * It floats over the card's corner rather than taking width from the title.
 */
export function GraphToolbar({ label, actions, view, onComment }: GraphToolbarProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const narrow = useNarrowCard(rootRef)
  const pinned = view?.fullScreen.open
  return (
    // Clicks stay here so using the toolbar doesn't also select the graph underneath. Left out of PNG downloads.
    <div
      ref={rootRef}
      data-capture-ignore
      onClick={(event) => event.stopPropagation()}
      className={cn(
        'flex items-center gap-0.5 rounded-md bg-[var(--dash-card)] shadow-[-10px_0_8px_-2px_var(--dash-card)] transition-opacity',
        // Full screen sits outside the card's hover group, and its exit button must never hide.
        pinned
          ? 'opacity-100'
          : 'opacity-0 group-hover/widget:opacity-100 focus-within:opacity-100 in-data-selected:opacity-100 has-[[data-popover-open]]:opacity-100 has-[[data-comment-open]]:opacity-100',
      )}
    >
      {onComment && <WidgetComment label={label} onSubmit={onComment} />}
      {view && !narrow && <ViewButtons view={view} />}
      <GraphActionsMenu label={label} actions={actions} view={view} viewInMenu={narrow} />
    </div>
  )
}

function ViewButtons({ view }: { view: GraphViewActions }) {
  const { fullScreen, onCopyLink, onDownloadCsv, onDownloadPng } = view
  return (
    <>
      <button type="button" aria-label="Copy link" title="Copy link" onClick={onCopyLink} className={graphToolButtonClass}>
        <Link2 className="size-3.5" />
      </button>
      <Menu
        items={[
          { label: 'Download CSV', onSelect: onDownloadCsv },
          { label: 'Download PNG', onSelect: onDownloadPng },
        ]}
        trigger={({ open, toggle }) => (
          <button type="button" aria-label="Download" title="Download" data-popover-open={open || undefined} onClick={toggle} className={graphToolButtonClass}>
            <Download className="size-3.5" />
          </button>
        )}
      />
      <button
        type="button"
        aria-label={fullScreen.open ? 'Exit full screen' : 'View full screen'}
        title={fullScreen.open ? 'Exit full screen (Esc)' : 'View full screen'}
        onClick={fullScreen.onToggle}
        className={graphToolButtonClass}
      >
        {fullScreen.open ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
      </button>
    </>
  )
}
