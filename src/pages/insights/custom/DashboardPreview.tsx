import type { Dashboard } from '../../../data/dashboards'
import { dashboardPages, pageView } from '../../../data/pages'
import { GRID_COLS, isGraph, usesSingleColor, type CanvasItem, type WidgetRect } from '../../../data/widgets'
import { CHART_PALETTES, CHART_SINGLE_COLORS, DASHBOARD_COLORS, resolvePalette, scoreColor } from '../../../lib/colors'
import { formatPercent } from '../../../lib/format'
import { dashboardGraphColors, type GraphColors } from '../builder/graphColors'
import { layoutWidgets } from '../builder/layoutWidgets'
import { PreviewGlyph, type GlyphKind } from './PreviewGlyph'

type Tile = { id: string; rect: Omit<WidgetRect, 'i'>; kind: GlyphKind; colors: readonly string[]; score?: string }

/** Like a screenshot, the thumbnail shows the top of the canvas; short canvases stretch to at least `MIN_ROWS`. */
const MIN_ROWS = 4
const MAX_ROWS = 8
const PLACEHOLDER = ['rgba(255,255,255,0.14)']

/** Miniature of the dashboard's canvas: each widget where it sits, drawn as its type in its real colors. */
export function DashboardPreview({ dashboard }: { dashboard: Dashboard }) {
  const executed = Boolean(dashboard.lastExecution) && dashboard.qualityScore != null
  const tiles = previewTiles(dashboard, executed)
  const rows = Math.min(MAX_ROWS, Math.max(MIN_ROWS, ...tiles.map(({ rect }) => rect.y + rect.h)))

  return (
    <div aria-hidden className="relative aspect-[2/1] overflow-hidden rounded-md border border-white/10 bg-tlai-1 p-1 transition-colors group-hover:border-white/20">
      <div className="relative size-full">
        {tiles
          .filter(({ rect }) => rect.y < rows)
          .map((tile) => (
            <div
              key={tile.id}
              className="absolute p-[2px]"
              style={{
                left: `${(tile.rect.x / GRID_COLS) * 100}%`,
                top: `${(tile.rect.y / rows) * 100}%`,
                width: `${(tile.rect.w / GRID_COLS) * 100}%`,
                height: `${(tile.rect.h / rows) * 100}%`,
              }}
            >
              <div className="flex size-full flex-col gap-1 overflow-hidden rounded-[3px] bg-white/[0.035] p-1.5 ring-1 ring-white/[0.06] ring-inset">
                {tile.kind !== 'text' && tile.kind !== 'media' && <span className="h-[3px] w-1/3 shrink-0 rounded-full bg-white/20" />}
                <div className="min-h-0 flex-1">
                  <PreviewGlyph kind={tile.kind} colors={tile.colors} seed={tile.id} score={tile.score} />
                </div>
              </div>
            </div>
          ))}
      </div>
      {!executed && (
        <span className="absolute right-2 bottom-2 rounded-full border border-white/10 bg-tlai-2 px-2 py-0.5 text-[10px] text-white/60">No executions yet</span>
      )}
    </div>
  )
}

function previewTiles(full: Dashboard, executed: boolean): Tile[] {
  // A thumbnail shows what opening the dashboard shows: its first page.
  const dashboard = pageView(full, dashboardPages(full)[0].id)
  const widgets = dashboard.widgets ?? []
  const assigned = executed ? dashboardGraphColors(dashboard) : new Map<string, GraphColors>()
  const tiles = layoutWidgets(widgets, dashboard.layout).flatMap((rect): Tile[] => {
    const item = widgets.find((widget) => widget.id === rect.i)
    if (!item) return []
    return [{ id: item.id, rect, kind: glyphKind(item), colors: executed ? widgetColors(item, assigned.get(item.id)) : PLACEHOLDER }]
  })
  if (tiles.length > 1) return tiles
  // A lone graph would fill the card again, so it sits beside the dashboard's quality score.
  const score: Tile = { id: `${dashboard.id}:score`, rect: { x: 0, y: 0, w: tiles.length ? 4 : GRID_COLS, h: MIN_ROWS }, kind: 'score', colors: executed && dashboard.qualityScore != null ? [scoreColor(dashboard.qualityScore)] : PLACEHOLDER, score: executed ? formatPercent(dashboard.qualityScore) : undefined }
  return [score, ...tiles.map((tile) => ({ ...tile, rect: { x: 4, y: 0, w: GRID_COLS - 4, h: MIN_ROWS } }))]
}

function glyphKind(item: CanvasItem): GlyphKind {
  return isGraph(item) ? item.chart : item.source
}

/** Same rules as the canvas: a picked color or palette wins, otherwise the dashboard's auto assignment. */
function widgetColors(item: CanvasItem, assigned: GraphColors | undefined): readonly string[] {
  if (!isGraph(item)) return []
  if (usesSingleColor(item.chart) && item.color) return [CHART_SINGLE_COLORS[item.color].color]
  if (assigned) return DASHBOARD_COLORS.map((_, index) => DASHBOARD_COLORS[(assigned.offset + index) % DASHBOARD_COLORS.length])
  return CHART_PALETTES[resolvePalette(item.palette)].colors
}
