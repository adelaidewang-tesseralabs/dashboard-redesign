import { useState, type PointerEvent as ReactPointerEvent } from 'react'

const MIN_HEIGHT = 160
const MAX_HEIGHT = 560
const DEFAULT_HEIGHT = 300
const HEIGHT_KEY = 'insights-prototype.v4-settings-height'
const COLLAPSED_KEY = 'insights-prototype.v4-settings-collapsed'
const DRAG_BODY_CLASSES = ['select-none', 'cursor-row-resize']

export type BottomPanelResize = {
  height: number
  collapsed: boolean
  dragging: boolean
  startResize: (event: ReactPointerEvent) => void
  /** Keyboard resizing; positive values make the panel taller. */
  nudge: (delta: number) => void
  toggleCollapsed: () => void
  min: number
  max: number
}

/** Leave the canvas at least 40% of the window so the selected widget stays visible above the panel. */
const maxHeight = () => Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, Math.round(window.innerHeight * 0.6)))
const clamp = (height: number) => Math.min(maxHeight(), Math.max(MIN_HEIGHT, Math.round(height)))

/** Builder V4's bottom settings panel, sized like an IDE terminal: drag its top edge, or collapse it to the header. */
export function useBottomPanelHeight(): BottomPanelResize {
  const [height, setHeight] = useState(() => clamp(Number(localStorage.getItem(HEIGHT_KEY)) || DEFAULT_HEIGHT))
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSED_KEY) === 'true')
  const [dragging, setDragging] = useState(false)

  const saveCollapsed = (next: boolean) => {
    localStorage.setItem(COLLAPSED_KEY, String(next))
    setCollapsed(next)
  }

  const startResize = (event: ReactPointerEvent) => {
    event.preventDefault()
    const startY = event.clientY
    const startHeight = height
    let latest = startHeight
    setDragging(true)
    if (collapsed) saveCollapsed(false)
    document.body.classList.add(...DRAG_BODY_CLASSES)

    const onMove = (move: PointerEvent) => {
      latest = clamp(startHeight + startY - move.clientY)
      setHeight(latest)
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      document.body.classList.remove(...DRAG_BODY_CLASSES)
      setDragging(false)
      localStorage.setItem(HEIGHT_KEY, String(latest))
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const nudge = (delta: number) => {
    const next = clamp(height + delta)
    setHeight(next)
    localStorage.setItem(HEIGHT_KEY, String(next))
  }

  return { height, collapsed, dragging, startResize, nudge, toggleCollapsed: () => saveCollapsed(!collapsed), min: MIN_HEIGHT, max: maxHeight() }
}
