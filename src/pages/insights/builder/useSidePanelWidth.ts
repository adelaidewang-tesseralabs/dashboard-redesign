import { useState, type PointerEvent as ReactPointerEvent } from 'react'

const MIN_WIDTH = 320
const MAX_WIDTH = 640
const DEFAULT_WIDTH = 384
const STORAGE_KEY = 'insights.sidePanelWidth'
const DRAG_BODY_CLASSES = ['select-none', 'cursor-col-resize']

export type SidePanelResize = {
  width: number
  dragging: boolean
  startResize: (event: ReactPointerEvent) => void
  /** Keyboard resizing; positive values widen the panel. */
  nudge: (delta: number) => void
  min: number
  max: number
}

const clamp = (width: number) => Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(width)))
const save = (width: number) => localStorage.setItem(STORAGE_KEY, String(width))

/** Width of the builder's right panel, shared by chat and widget settings. The panel sits on the right, so dragging left widens it. */
export function useSidePanelWidth(): SidePanelResize {
  const [width, setWidth] = useState(() => clamp(Number(localStorage.getItem(STORAGE_KEY)) || DEFAULT_WIDTH))
  const [dragging, setDragging] = useState(false)

  const startResize = (event: ReactPointerEvent) => {
    event.preventDefault()
    const startX = event.clientX
    const startWidth = width
    let latest = startWidth
    setDragging(true)
    document.body.classList.add(...DRAG_BODY_CLASSES)

    const onMove = (move: PointerEvent) => {
      latest = clamp(startWidth + startX - move.clientX)
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

  return { width, dragging, startResize, nudge, min: MIN_WIDTH, max: MAX_WIDTH }
}
