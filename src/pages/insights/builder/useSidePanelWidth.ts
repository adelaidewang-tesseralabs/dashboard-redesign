import { useState, type PointerEvent as ReactPointerEvent } from 'react'

const MIN_WIDTH = 320
const MAX_WIDTH = 640
const DEFAULT_WIDTH = 384
const STORAGE_KEY = 'insights.sidePanelWidth'
const DRAG_BODY_CLASSES = ['select-none', 'cursor-col-resize']

/** Which edge of the panel carries the drag handle: `left` for a panel on the right of the canvas, `right` for one docked on its left. */
export type PanelEdge = 'left' | 'right'

export type SidePanelResize = {
  width: number
  dragging: boolean
  edge: PanelEdge
  startResize: (event: ReactPointerEvent) => void
  /** Keyboard resizing; positive values widen the panel. */
  nudge: (delta: number) => void
  min: number
  max: number
}

type SidePanelWidthOptions = {
  edge?: PanelEdge
  /** A second panel keeps its own width instead of sharing the right panel's. */
  storageKey?: string
}

const clamp = (width: number) => Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(width)))

/** Width of a builder side panel. By default the right panel, shared by chat and widget settings, so dragging left widens it. */
export function useSidePanelWidth({ edge = 'left', storageKey = STORAGE_KEY }: SidePanelWidthOptions = {}): SidePanelResize {
  const [width, setWidth] = useState(() => clamp(Number(localStorage.getItem(storageKey)) || DEFAULT_WIDTH))
  const [dragging, setDragging] = useState(false)
  const save = (next: number) => localStorage.setItem(storageKey, String(next))

  const startResize = (event: ReactPointerEvent) => {
    event.preventDefault()
    const startX = event.clientX
    const startWidth = width
    const direction = edge === 'left' ? -1 : 1
    let latest = startWidth
    setDragging(true)
    document.body.classList.add(...DRAG_BODY_CLASSES)

    const onMove = (move: PointerEvent) => {
      latest = clamp(startWidth + direction * (move.clientX - startX))
      setWidth(latest)
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      document.body.classList.remove(...DRAG_BODY_CLASSES)
      setDragging(false)
      save(latest)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const nudge = (delta: number) => {
    const next = clamp(width + delta)
    setWidth(next)
    save(next)
  }

  return { width, dragging, edge, startResize, nudge, min: MIN_WIDTH, max: MAX_WIDTH }
}
