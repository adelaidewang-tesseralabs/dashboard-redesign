import type { ChartColor, ChartPalette } from '../lib/colors'
import type { GraphQuery } from './transforms'

/** Graph styles the main app supports today, in its picker order. */
export const CHART_STYLES = ['bar', 'line', 'area', 'metric', 'gauge', 'pie', 'table'] as const
export type ChartStyle = (typeof CHART_STYLES)[number]

export function isChartStyle(value: string): value is ChartStyle {
  return (CHART_STYLES as readonly string[]).includes(value)
}

/** Metric cards and tables draw no series, so a palette has nothing to color. */
export const usesColor = (chart: ChartStyle) => chart !== 'metric' && chart !== 'table'

/** These draw one series color, so they take a single `color` rather than a `palette`. */
export const usesSingleColor = (chart: ChartStyle) => chart === 'line' || chart === 'area' || chart === 'gauge'

/** Only these color each label differently, so only their legend says anything the chart doesn't. */
export const usesLegend = (chart: ChartStyle) => chart === 'bar' || chart === 'pie'

/** Pie slices carry no labels of their own, so their legend is on unless turned off; bars are labelled on the axis. */
export const showsLegend = (item: { chart: ChartStyle; legend?: boolean }) => usesLegend(item.chart) && (item.legend ?? item.chart === 'pie')

export type FieldFilter = { fieldKey: string; value: string }

/** Widget-panel overrides; unset means the source's default title and no description. */
type Presentation = { title?: string; description?: string; showTitle?: boolean; showDescription?: boolean }

export type MediaKind = 'image' | 'pdf' | 'video'
/** `url` is a blob URL for uploads (lives as long as the page, like the rest of the prototype's state) or a pasted link. */
export type MediaFile = { name: string; kind: MediaKind; url: string }

export const TEXT_TONES = ['gray', 'blue', 'mint', 'amber', 'red', 'purple'] as const
export type TextTone = (typeof TEXT_TONES)[number]
/** Unset fields fall back to the canvas card look, top-aligned and left-aligned. */
export type TextBoxStyle = {
  background?: TextTone
  border?: TextTone
  verticalAlign?: 'top' | 'middle' | 'bottom'
  textAlign?: 'left' | 'center' | 'right'
}

/**
 * Unset or unknown `pageId` means the dashboard's first page. `pinnedAt` (Final builder): kept on the grid's top rows,
 * where other blocks can sit beside it but never above.
 */
type Placement = { pageId?: string; pinnedAt?: number }

/** Pinned blocks a page can hold, so the graphs aren't pushed off screen. */
export const MAX_PINNED = 3

/**
 * A text block Tessera AI writes from its page's graphs. Until someone edits it, its text is rewritten from the graphs
 * on every render; once `edited`, it keeps the person's text and offers a rewrite when the graphs no longer match `basis`.
 * `inline` (Final builder): generated into an ordinary text block on the grid, instead of the summary pinned above it.
 */
export type PageSummary = { basis: string; edited?: boolean; inline?: boolean }

/** A widget on the canvas, keyed by where its data comes from. */
export type CanvasItem = Presentation &
  Placement &
  (
    /**
     * `filters` are builder V1's equals-only filters; V2 graphs keep theirs in `query.filters`. `palette` colors multi-color charts, `color` single-color ones.
     * Unset `legend` means the chart's default (`showsLegend`).
     */
    | { id: string; source: 'object'; objectName: string; fieldKey: string; chart: ChartStyle; palette?: ChartPalette; color?: ChartColor; legend?: boolean; filters?: FieldFilter[]; query?: GraphQuery }
    /** `datasetId` links the graph to a saved SQL dataset (builder V2), whose query then wins over `sql`. */
    | { id: string; source: 'sql'; title: string; sql: string; chart: ChartStyle; palette?: ChartPalette; color?: ChartColor; legend?: boolean; datasetId?: string; query?: GraphQuery }
    /** An image, PDF or video block; no `media` yet means it still shows the drop zone. */
    | { id: string; source: 'media'; media?: MediaFile }
    /** A rich text block written in basic Markdown. */
    | { id: string; source: 'text'; markdown: string; style?: TextBoxStyle; summary?: PageSummary }
  )

export type GraphItem = Extract<CanvasItem, { source: 'object' | 'sql' }>

export const isGraph = (item: CanvasItem): item is GraphItem => item.source === 'object' || item.source === 'sql'

export type SummaryItem = Extract<CanvasItem, { source: 'text' }> & { summary: PageSummary }

/** The page summary sits above the grid at its text's own height, so it has no grid rect. Inline summaries are on the grid. */
export const isPageSummary = (item: CanvasItem): item is SummaryItem => item.source === 'text' && !!item.summary && !item.summary.inline
export const DATA_CHECKS_TABLE = 'data_checks'

export const mediaItem = (): CanvasItem => ({ id: `media-${crypto.randomUUID()}`, source: 'media', showTitle: false })

export const textItem = (): CanvasItem => ({ id: `text-${crypto.randomUUID()}`, source: 'text', markdown: '', showTitle: false })

export const summaryItem = (basis: string): CanvasItem => ({ id: `text-${crypto.randomUUID()}`, source: 'text', markdown: '', showTitle: false, summary: { basis } })

export const objectItem = (objectName: string, fieldKey: string): Extract<CanvasItem, { source: 'object' }> => ({
  id: `obj-${crypto.randomUUID()}`,
  source: 'object',
  objectName,
  fieldKey,
  chart: 'bar',
})

/** A graph of a saved SQL dataset's result; it follows later edits to the dataset's query. */
export const sqlDatasetItem = (dataset: { id: string; label: string; sql: string }, chart: ChartStyle = 'bar'): CanvasItem => ({
  id: `sql-${crypto.randomUUID()}`,
  source: 'sql',
  title: dataset.label,
  sql: dataset.sql,
  chart,
  datasetId: dataset.id,
})

/** Whether two items chart the same data — used to avoid adding a duplicate graph. Ids can't tell: edited object graphs keep theirs. */
export function sameSource(a: CanvasItem, b: CanvasItem) {
  if (a.source === 'object' && b.source === 'object') {
    return a.objectName === b.objectName && a.fieldKey === b.fieldKey && !a.filters?.length && !b.filters?.length && !a.query && !b.query
  }
  return a.id === b.id
}

/** Columns in the canvas grid; widget positions and sizes are in grid units. */
export const GRID_COLS = 12

/** A widget's placement on the canvas grid; `i` is the `CanvasItem` id. */
export type WidgetRect = { i: string; x: number; y: number; w: number; h: number }

type WidgetSize = { w: number; h: number; minW: number; minH: number }

const CHART_SIZE: WidgetSize = { w: 6, h: 5, minW: 3, minH: 3 }
const MEDIA_SIZE: WidgetSize = { w: 6, h: 5, minW: 2, minH: 2 }
const TEXT_SIZE: WidgetSize = { w: 6, h: 3, minW: 2, minH: 2 }

export function itemSize(item: CanvasItem): WidgetSize {
  switch (item.source) {
    case 'media':
      return MEDIA_SIZE
    case 'text':
      return TEXT_SIZE
    case 'object':
    case 'sql':
      return CHART_SIZE
    default: {
      const unhandled: never = item
      return unhandled
    }
  }
}
