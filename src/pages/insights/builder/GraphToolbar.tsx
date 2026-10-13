import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react'
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

/** Cards without a title row (text, media) fold the buttons below this width instead. */
const NARROW_CARD_PX = 320
const BUTTON_PX = 24
const GAP_PX = 2
/** Space kept between the title row's end and the first button. */
const CLEARANCE_PX = 8

/**
 * Whether every button, laid out in full, would cover the end of the card's title row (title, info icon, badge).
 * Measured against the full width rather than the toolbar's current one, so folding never unfolds itself.
 */
function useFoldedToolbar(ref: RefObject<HTMLElement | null>, buttonCount: number) {
  const [folded, setFolded] = useState(false)
  const [cardWidth, setCardWidth] = useState<number | null>(null)
  useEffect(() => {
    const toolbar = ref.current
    const card = toolbar?.closest('[data-widget-id], [data-widget]')
    if (!toolbar || !card) return
    const heading = card.querySelector('[data-card-heading]')
    const fullWidth = buttonCount * BUTTON_PX + (buttonCount - 1) * GAP_PX
    const measure = () => {
      const width = card.getBoundingClientRect().width
      setCardWidth(Math.round(width))
      if (!heading) {
        setFolded(width < NARROW_CARD_PX)
        return
      }
      const headingEnd = Math.max(...[...heading.children].map((child) => child.getBoundingClientRect().right))
      setFolded(toolbar.getBoundingClientRect().right - fullWidth < headingEnd + CLEARANCE_PX)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(card)
    if (heading) [...heading.children].forEach((child) => observer.observe(child))
    return () => observer.disconnect()
  })
  return { folded, cardWidth }
}

/**
 * A canvas item's top-right icon buttons: Ask AI, copy link, download, full screen, then "…" for editing.
 * It floats over the card's corner rather than taking width from the title.
 */
export function GraphToolbar({ label, actions, view, onComment }: GraphToolbarProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [askOpen, setAskOpen] = useState(false)
  const { folded, cardWidth } = useFoldedToolbar(rootRef, (onComment ? 1 : 0) + (view ? 3 : 0) + 1)
  const pinned = view?.fullScreen.open
  return (
    // Clicks stay here so using the toolbar doesn't also select the graph underneath. Left out of PNG downloads.
    <div
      ref={rootRef}
      data-capture-ignore
      onClick={(event) => event.stopPropagation()}
      // The Ask AI box hangs from this right edge; capping it to the card keeps narrow cards from clipping it.
      style={cardWidth ? ({ '--ask-box-max': `${cardWidth - 24}px` } as CSSProperties) : undefined}
      className={cn(
        'relative flex items-center gap-0.5 rounded-md bg-[var(--dash-card)] shadow-[-10px_0_8px_-2px_var(--dash-card)] transition-opacity',
        // Full screen sits outside the card's hover group, and its exit button must never hide.
        pinned
          ? 'opacity-100'
          : 'opacity-0 group-hover/widget:opacity-100 focus-within:opacity-100 in-data-selected:opacity-100 has-[[data-popover-open]]:opacity-100 has-[[data-comment-open]]:opacity-100',
      )}
    >
      {onComment && <WidgetComment label={label} onSubmit={onComment} open={askOpen} onOpenChange={setAskOpen} showTrigger={!folded} />}
      {view && !folded && <ViewButtons view={view} />}
      <GraphActionsMenu label={label} actions={actions} view={view} viewInMenu={folded} onAskAi={folded && onComment ? () => setAskOpen(true) : undefined} />
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
