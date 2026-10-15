import type { Dashboard, GraphGroup } from '../../../data/dashboards'
import { GRID_COLS, isAboveGrid, type WidgetRect } from '../../../data/widgets'
import { insertRect, layoutWidgets } from './layoutWidgets'

/** Section rows always span the grid and are one row tall. */
export const SECTION_ROWS = 1

/** Each section's saved row, or a new row under everything else for a section that has none yet. */
export function sectionRects(groups: GraphGroup[], saved: WidgetRect[], others: WidgetRect[]): WidgetRect[] {
  const placed: WidgetRect[] = []
  for (const group of groups) {
    const rect = saved.find((entry) => entry.i === group.id)
    const bottom = Math.max(0, ...[...others, ...placed].map((entry) => entry.y + entry.h))
    placed.push({ i: group.id, x: 0, w: GRID_COLS, h: SECTION_ROWS, y: rect?.y ?? bottom })
  }
  return placed
}

/** Where every widget and section row on the (page-scoped) dashboard sits, filling in widgets that have no saved rect. */
export function canvasRects(dashboard: Dashboard) {
  const groups = dashboard.groups ?? []
  const saved = dashboard.layout ?? []
  const gridWidgets = (dashboard.widgets ?? []).filter((item) => !isAboveGrid(item))
  const widgetRects = layoutWidgets(gridWidgets, saved, saved.filter((rect) => groups.some((group) => group.id === rect.i)))
  return { widgetRects, groupRects: sectionRects(groups, saved, widgetRects) }
}

/** A section holds every widget that starts below it and above the next section. Widgets above the first section are loose. */
export function sectionMembers(sections: WidgetRect[], widgets: WidgetRect[]): Map<string, string[]> {
  const sorted = sections.toSorted((a, b) => a.y - b.y)
  const members = new Map(sorted.map((section): [string, string[]] => [section.i, []]))
  for (const rect of widgets) {
    const owner = sorted.findLast((section) => section.y + section.h <= rect.y)
    if (owner) members.get(owner.i)?.push(rect.i)
  }
  return members
}

/** Grid rows, top to bottom, that no widget or section spans across: the only places a full-width section row fits. */
export function cleanBreaks(rects: WidgetRect[]): number[] {
  const bottom = Math.max(0, ...rects.map((rect) => rect.y + rect.h))
  const candidates = new Set([0, bottom, ...rects.map((rect) => rect.y), ...rects.map((rect) => rect.y + rect.h)])
  return [...candidates].filter((row) => !rects.some((rect) => rect.y < row && row < rect.y + rect.h)).toSorted((a, b) => a - b)
}

/** The row for a section added above `rect`: the nearest clean break at or above its top, or the bottom without one. */
export function sectionRowAbove(rects: WidgetRect[], rect: WidgetRect | undefined): number {
  const breaks = cleanBreaks(rects)
  if (!rect) return breaks.at(-1) ?? 0
  return breaks.findLast((row) => row <= rect.y) ?? 0
}

/**
 * Clean breaks offered for a new section on the canvas, with the row each shows at in the grid's rendered (compacted)
 * layout `shown`. Breaks touching a section row would leave a section empty, and breaks in a collapsed section can't be
 * seen, so both are skipped.
 */
export function insertableBreaks(
  widgets: WidgetRect[],
  sections: WidgetRect[],
  shown: readonly Pick<WidgetRect, 'i' | 'y' | 'h'>[],
  collapsed: ReadonlySet<string>,
): { row: number; shownRow: number }[] {
  const rects = [...widgets, ...sections]
  const shownById = new Map(shown.map((rect) => [rect.i, rect]))
  const sorted = sections.toSorted((a, b) => a.y - b.y)
  const shownBottom = Math.max(0, ...shown.map((rect) => rect.y + rect.h))
  const offered: { row: number; shownRow: number }[] = []
  for (const row of cleanBreaks(rects)) {
    if (sections.some((section) => section.y === row || section.y + section.h === row)) continue
    const owner = sorted.findLast((section) => section.y + section.h <= row)
    if (owner && collapsed.has(owner.i)) continue
    const next = rects.filter((rect) => rect.y >= row && shownById.has(rect.i)).toSorted((a, b) => a.y - b.y)[0]
    const shownRow = next ? (shownById.get(next.i)?.y ?? 0) : shownBottom
    if (!offered.some((entry) => entry.shownRow === shownRow)) offered.push({ row, shownRow })
  }
  return offered
}

/** A new section at `row`, with everything from that row down pushed below it so it takes those graphs. */
export function newSection(rects: WidgetRect[], row: number): { group: GraphGroup; layout: WidgetRect[] } {
  const id = `group-${crypto.randomUUID()}`
  return { group: { id, name: 'New section' }, layout: insertRect(rects, { i: id, x: 0, y: row, w: GRID_COLS, h: SECTION_ROWS }) }
}
