import { useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react'

const MIN_RATIO = 0.2
const MAX_RATIO = 0.8
const DEFAULT_SPLIT_RATIO = 0.5
const STORAGE_KEY = 'insights-prototype.v5-split-ratio'
const DRAG_BODY_CLASSES = ['select-none', 'cursor-row-resize']

const clamp = (ratio: number) => Math.min(MAX_RATIO, Math.max(MIN_RATIO, ratio))

export type SplitRatio = {
  /** Share of the column's height given to the top pane. */
  ratio: number
  dragging: boolean
  startResize: (event: ReactPointerEvent) => void
  /** Positive values grow the top pane. */
  nudge: (delta: number) => void
  reset: () => void
}

/** Builder V5: where the divider between widget settings (top) and Tessera AI (bottom) sits, remembered across dashboards. */
export function useSplitRatio(containerRef: RefObject<HTMLElement | null>): SplitRatio {
  const [ratio, setRatio] = useState(() => clamp(Number(localStorage.getItem(STORAGE_KEY)) || DEFAULT_SPLIT_RATIO))
  const [dragging, setDragging] = useState(false)

  const save = (next: number) => {
    const clamped = clamp(next)
    setRatio(clamped)
    localStorage.setItem(STORAGE_KEY, String(clamped))
    return clamped
  }

  const startResize = (event: ReactPointerEvent) => {
    const container = containerRef.current
    if (!container) return
    event.preventDefault()
    const { top, height } = container.getBoundingClientRect()
    let latest = ratio
    setDragging(true)
    document.body.classList.add(...DRAG_BODY_CLASSES)

    const onMove = (move: PointerEvent) => {
      latest = clamp((move.clientY - top) / height)
      setRatio(latest)
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

  return { ratio, dragging, startResize, nudge: (delta) => save(ratio + delta), reset: () => save(DEFAULT_SPLIT_RATIO) }
}
