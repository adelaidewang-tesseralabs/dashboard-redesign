import { GRID_COLS, type WidgetRect } from '../../../data/widgets'

const sharesColumns = (a: WidgetRect, b: WidgetRect) => a.x < b.x + b.w && b.x < a.x + a.w
const overlaps = (a: WidgetRect, b: WidgetRect) => sharesColumns(a, b) && a.y < b.y + b.h && b.y < a.y + a.h
const byPosition = (a: WidgetRect, b: WidgetRect) => a.y - b.y || a.x - b.x

/** Pinned blocks in reading order (top to bottom, then left to right). */
export function pinnedOrder(rects: WidgetRect[], pinnedIds: Set<string>) {
  return rects.filter((rect) => pinnedIds.has(rect.i)).toSorted(byPosition).map((rect) => rect.i)
}

/**
 * Lays pinned blocks across the top rows in `order`, left to right and wrapping like text, at the sizes they have.
 * Every other block keeps its spot unless it would sit above or on a pinned block; then it moves down just below.
 */
export function keepPinnedOnTop(rects: WidgetRect[], order: string[]): WidgetRect[] {
  const placed: WidgetRect[] = []
  let x = 0
  let y = 0
  let rowHeight = 0
  for (const id of order) {
    const rect = rects.find((entry) => entry.i === id)
    if (!rect) continue
    const w = Math.min(rect.w, GRID_COLS)
    if (x + w > GRID_COLS) {
      x = 0
      y += rowHeight
      rowHeight = 0
    }
    placed.push({ ...rect, x, y, w })
    x += w
    rowHeight = Math.max(rowHeight, rect.h)
  }
  const pinned = new Set(order)
  for (const rect of rects.filter((entry) => !pinned.has(entry.i)).toSorted(byPosition)) {
    let next = { ...rect, y: Math.max(rect.y, ...placed.filter((entry) => pinned.has(entry.i) && sharesColumns(entry, rect)).map((entry) => entry.y + entry.h)) }
    for (let blocker = placed.find((entry) => overlaps(entry, next)); blocker; blocker = placed.find((entry) => overlaps(entry, next))) {
      next = { ...next, y: blocker.y + blocker.h }
    }
    placed.push(next)
  }
  return placed
}
