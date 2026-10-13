import { GRID_COLS, itemSize, type CanvasItem, type WidgetRect } from '../../../data/widgets'

function overlaps(a: Omit<WidgetRect, 'i'>, b: Omit<WidgetRect, 'i'>) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
}

/** First top-left slot, scanning row by row, where a `w`×`h` widget fits without overlapping `placed`. */
function firstFreeSlot(placed: WidgetRect[], w: number, h: number) {
  for (let y = 0; ; y++) {
    for (let x = 0; x + w <= GRID_COLS; x++) {
      if (!placed.some((rect) => overlaps(rect, { x, y, w, h }))) return { x, y }
    }
  }
}

/**
 * Places `rect` by pushing everything that starts on or below its top row down by its height, section rows included,
 * so it overlaps nothing and every graph keeps its section. Any existing rect with the same id is replaced.
 */
export function insertRect(rects: WidgetRect[], rect: WidgetRect): WidgetRect[] {
  const others = rects.filter((entry) => entry.i !== rect.i)
  return [...others.map((entry) => (entry.y >= rect.y ? { ...entry, y: entry.y + rect.h } : entry)), rect]
}

/**
 * Keeps saved placements and packs widgets that have none (newly added ones) into the first free slot. `fixed` rects
 * (section rows) are kept clear but not returned.
 */
export function layoutWidgets(widgets: CanvasItem[], saved: WidgetRect[] = [], fixed: WidgetRect[] = []): WidgetRect[] {
  const placed = saved.filter((rect) => widgets.some((item) => item.id === rect.i))
  for (const item of widgets) {
    if (placed.some((rect) => rect.i === item.id)) continue
    const { w, h } = itemSize(item)
    placed.push({ i: item.id, w, h, ...firstFreeSlot([...fixed, ...placed], w, h) })
  }
  return placed
}
