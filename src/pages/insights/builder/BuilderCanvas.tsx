import { useEffect, useState, type ReactNode } from 'react'
import { ArrowDown, ArrowLeft } from 'lucide-react'
import { CURRENT_USER, type Dashboard, type SqlDataset } from '../../../data/dashboards'
import { useDashboards } from '../../../data/DashboardsStore'
import type { DataObject } from '../../../data/dataSources'
import { isGraph, isPageSummary, mediaItem, summaryItem, textItem, type CanvasItem } from '../../../data/widgets'
import { useResolvedAppearance } from '../../../lib/appearance'
import type { FixedFilterStyle } from '../../../lib/fixedFilterStyle'
import { cn } from '../../../lib/cn'
import { useToast } from '../../../ui/Toast'
import { CanvasGrid, type PageMove } from './CanvasGrid'
import { sameHighlight, type CrossHighlight } from './crossHighlight'
import { HighlightChip } from './HighlightChip'
import { CanvasHero } from './CanvasHero'
import { EmptyCanvasStart } from './EmptyCanvasStart'
import { CanvasToolbar } from './CanvasToolbar'
import { DataIssuesBanner } from './DataIssuesBanner'
import { FilterBar, type FilterKind } from './FilterBar'
import { FullScreenContext, type CanvasFullScreen } from './fullScreen'
import { PresetFilterBar } from './presetFilters/PresetFilterBar'
import { summarizePage, summaryBasis } from './pageSummary'
import { requestTextEdit } from './TextWidget'
import { canvasRects, newSection, sectionRowAbove } from './sections'
import { narrowedPicks } from './presetFilters/narrowPresets'
import { useFilterViewer } from './presetFilters/useFilterViewer'
import { staleOpenPicks, withViewerFilters } from './presetFilters/viewerFilters'
import { listDatasets } from './v2/datasets'
import { personalOverrides, usePersonalFilters, withPersonalValues } from './usePersonalView'
import type { AddSourceKind } from './sourceKinds'
import type { useBuilderChat } from './useBuilderChat'
import { useUndoShortcuts } from './useUndoShortcuts'

type BuilderCanvasProps = {
  dashboard: Dashboard
  chat: ReturnType<typeof useBuilderChat>
  selectedId: string | null
  onSelect: (itemId: string | null) => void
  multiSelectedIds?: ReadonlySet<string>
  onToggleSelect?: (itemId: string) => void
  sources: { object: DataObject; label: string }[]
  /** Builder V2's saved SQL datasets, offered in the Add graph menu. */
  queries?: SqlDataset[]
  sourcesLabel?: string
  datasetsFirst?: boolean
  /** Builder V3: the chart tool lists only datasets already on this dashboard. */
  datasetsOnly?: boolean
  onAdd: (item: CanvasItem) => void
  onAddSource: (kind: AddSourceKind) => void
  /** Builder V2: one "Add dataset..." entry in the Add graph menu instead of one per source kind. */
  onOpenAddSource?: () => void
  /** Builder V2: the empty canvas links to the Data tab instead of offering source buttons. */
  onOpenData?: () => void
  /** Bottom panel shown instead of the floating toolbar (V1's Foundry drawer). */
  drawer?: ReactNode | null
  /** Builder V2 preview: the canvas as viewers see it, without any editing chrome. */
  readOnly?: boolean
  /** An editor previewing: filters open at the dashboard's defaults, and picks aren't saved as their own view. */
  previewing?: boolean
  refreshing?: boolean
  onComment?: (itemId: string, text: string) => void
  /** Linked from the unavailable-data banner for people who can restore. */
  onOpenHistory?: () => void
  /** Builder V2+: in preview, clicking part of a graph highlights related data and greys out the rest. */
  crossHighlight?: boolean
  /** Builder V6: section rows that group the graphs below them. */
  sections?: boolean
  /** Builder V6: Tessera AI can sum up each page in a text block. */
  summaries?: boolean
  /** Builder V6: how fixed filters are set apart from the ones viewers change. */
  fixedFilterStyle?: FixedFilterStyle
  /** Builder V6: an expanded graph keeps a slim toolbar (AI, undo, redo, appearance) instead of hiding it. */
  fullScreenToolbar?: boolean
  /** Floats just above the toolbar, e.g. a way back to the Data tab. */
  aboveToolbar?: ReactNode
  /** Builder V3 panel layout B: the tools dock as a rail on the canvas's left edge instead of floating at the bottom. */
  toolbarPlacement?: 'bottom' | 'left'
  /** Final builder: graphs move between pages instead of sections. */
  pageMove?: PageMove
  /** Final builder: per-dataset preset filters and saved filters instead of viewer and fixed filters. */
  presetFilters?: boolean
  /** Final builder: an empty canvas offers Add graph and a chat box, with no toolbar until something is on it. */
  emptyStart?: boolean
  /** Final builder: Add graph lists every source, not just the dashboard's datasets. */
  graphCatalog?: boolean
  /** The page `dashboard` shows; saved filters remember it. */
  pageId?: string
  /** Owners and editors: they can delete or stop sharing anyone's shared saved filter, even while previewing. */
  canManageSharedFilters?: boolean
}

/** Dot-grid canvas shared by both builder versions: hero or widget grid, and the floating toolbar. */
export function BuilderCanvas(props: BuilderCanvasProps) {
  const { dashboard, chat, selectedId, onSelect, multiSelectedIds, onToggleSelect, sources, queries, sourcesLabel, datasetsFirst, datasetsOnly, onAdd, onAddSource, onOpenAddSource, onOpenData, drawer, readOnly = false, previewing = false, refreshing = false, onComment, onOpenHistory, crossHighlight = false, sections = false, summaries = false, fixedFilterStyle, fullScreenToolbar = false, aboveToolbar, toolbarPlacement = 'bottom', pageMove, presetFilters = false, emptyStart = false, graphCatalog = false, pageId, canManageSharedFilters = false } = props
  const { dashboards, removeWidget, setLayout, setFilterValues, setAppearance, addGroup, insertWidget, undo, redo, canUndo, canRedo } = useDashboards()
  const toast = useToast()
  const roleStandIn = useFilterViewer(dashboard)
  /** Final only: saved filters and picks follow the person a role switch or preview stands for. */
  const filterViewer = presetFilters ? roleStandIn : CURRENT_USER
  const personal = usePersonalFilters(dashboard.id, !previewing, filterViewer)
  useUndoShortcuts(readOnly ? undefined : dashboard.id)
  const [addingFilter, setAddingFilter] = useState<FilterKind | null>(null)
  const highlighting = readOnly && crossHighlight
  const [highlight, setHighlight] = useState<CrossHighlight | null>(null)
  if (!highlighting && highlight) setHighlight(null)
  const [fullScreenId, setFullScreenId] = useState<string | null>(null)
  const [fullScreenHost, setFullScreenHost] = useState<HTMLDivElement | null>(null)
  if (fullScreenId && !dashboard.widgets?.some((widget) => widget.id === fullScreenId)) setFullScreenId(null)
  const fullScreen: CanvasFullScreen = { itemId: fullScreenId, setItemId: setFullScreenId, host: fullScreenHost, onSelect: readOnly ? undefined : onSelect }
  const [revealId, setRevealId] = useState<string | null>(null)
  /** Builders select what's added; the canvas also scrolls it into view, since new blocks often land below the fold. */
  const addItem = (item: CanvasItem) => {
    onAdd(item)
    setRevealId(item.id)
  }
  useEffect(() => {
    if (!revealId) return
    // Grid items get their positions a frame after they mount.
    const timer = window.setTimeout(() => {
      document.querySelector(`[data-widget-id="${CSS.escape(revealId)}"]`)?.closest('[data-widget]')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      setRevealId(null)
    }, 150)
    return () => window.clearTimeout(timer)
  }, [revealId])
  const toggleHighlight = (next: CrossHighlight) => setHighlight((current) => (sameHighlight(current, next) ? null : next))

  useEffect(() => {
    if (!highlight) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setHighlight(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [highlight])
  const fullDashboard = dashboards.find((entry) => entry.id === dashboard.id) ?? dashboard
  const viewerPage = readOnly && presetFilters ? withViewerFilters(dashboard, fullDashboard) : dashboard
  const picks = presetFilters ? narrowedPicks(viewerPage, personal.values) : personal.values
  const shown = readOnly ? withPersonalValues(viewerPage, picks) : dashboard
  const overrides = readOnly ? personalOverrides(viewerPage, picks) : []
  const stale = readOnly && presetFilters ? staleOpenPicks(dashboard, fullDashboard, personal.values) : undefined
  const staleKey = stale?.filterIds.join('|') ?? ''
  useEffect(() => {
    if (!stale || stale.filterIds.length === 0) return
    personal.reset(stale.filterIds)
    const labels = listDatasets(fullDashboard).filter((dataset) => stale.datasetKeys.includes(dataset.key)).map((dataset) => dataset.label)
    toast(`The editor set preset filters for ${labels.join(', ')}, so your own filters there were cleared.`)
    // Keyed on the stale ids alone: resetting them empties the set, so this runs once per change.
  }, [staleKey])
  const widgets = dashboard.widgets ?? []
  const groups = dashboard.groups ?? []
  const empty = widgets.length === 0 && groups.length === 0 && !chat.thinking
  /** Above the selected graph, or at the bottom when nothing is selected. */
  const addSection = () => {
    const { widgetRects, groupRects } = canvasRects(dashboard)
    const rects = [...widgetRects, ...groupRects]
    const { group, layout } = newSection(rects, sectionRowAbove(rects, widgetRects.find((rect) => rect.i === selectedId)))
    addGroup(dashboard.id, group, layout)
  }
  /** One summary per page, above the grid; asking again selects the one already there. */
  const addSummary = () => {
    const existing = widgets.find(isPageSummary)
    if (existing) return onSelect(existing.id)
    if (!summarizePage(dashboard)) return toast('Add a graph to this page first')
    const summary = summaryItem(summaryBasis(dashboard))
    insertWidget(dashboard.id, summary, [])
    onSelect(summary.id)
    setRevealId(summary.id)
  }
  const addText = () => {
    const item = textItem()
    requestTextEdit(item.id)
    addItem(item)
  }
  const undoChange = canUndo(dashboard.id) ? () => undo(dashboard.id) : undefined
  /** A dashboard shows each source once across its pages, so the catalog checks graphs on every page. */
  const menuWidgets = graphCatalog ? (dashboards.find((entry) => entry.id === dashboard.id)?.widgets ?? []) : widgets
  const theme = useResolvedAppearance(dashboard.appearance)
  const fullScreenTools = fullScreenToolbar && !readOnly
  /** `expandedId`: the graph filling the canvas, which opening Tessera AI aims the chat at. */
  const toolbar = (expandedId: string | null) => (
    <CanvasToolbar
      orientation={toolbarPlacement === 'left' ? 'vertical' : 'horizontal'}
      fullScreen={expandedId !== null}
      chatOpen={chat.chatOpen}
      widgets={menuWidgets}
      sources={sources}
      queries={queries}
      sourcesLabel={sourcesLabel}
      datasetsFirst={datasetsFirst}
      datasetsOnly={datasetsOnly}
      catalog={graphCatalog}
      onToggleChat={() => {
        if (expandedId && !chat.chatOpen) onSelect(expandedId)
        chat.setChatOpen((current) => !current)
      }}
      onOpenChat={() => chat.setChatOpen(true)}
      onAddSource={onAddSource}
      onOpenAddSource={onOpenAddSource}
      onAddWidget={addItem}
      onAddText={addText}
      onAddSummary={summaries ? addSummary : undefined}
      onAddFilter={setAddingFilter}
      presetFiltersOnly={presetFilters}
      onAddMedia={() => addItem(mediaItem())}
      onAddSection={sections ? addSection : undefined}
      onUndo={undoChange}
      onRedo={canRedo(dashboard.id) ? () => redo(dashboard.id) : undefined}
      appearance={dashboard.appearance ?? 'dark'}
      onAppearanceChange={(appearance) => setAppearance(dashboard.id, appearance)}
    />
  )

  const railed = toolbarPlacement === 'left'
  const starting = empty && emptyStart && !readOnly
  const blockCount = widgets.length + groups.length
  /** `armed` while the empty start shows; then the block count it ended at, until the next add or removal. */
  const [manualHint, setManualHint] = useState<'armed' | number | null>(null)
  if (starting && manualHint !== 'armed') setManualHint('armed')
  if (manualHint === 'armed' && !starting && blockCount > 0) setManualHint(blockCount)
  if (typeof manualHint === 'number' && blockCount !== manualHint) setManualHint(null)
  const showManualHint = !readOnly && typeof manualHint === 'number'
  const showRail = railed && !readOnly && !drawer && !starting && (!fullScreenId || fullScreenTools)

  return (
    <FullScreenContext value={fullScreen}>
      <div className="flex min-h-0 flex-1">
        {showRail && toolbar(fullScreenId)}
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
          <DataIssuesBanner dashboard={dashboard} onOpenHistory={readOnly ? undefined : onOpenHistory} />
          <div
            data-dashboard-theme={theme}
            onClick={(event) => {
              if ((event.target as HTMLElement).closest('.react-grid-item, [data-widget]')) return
              onSelect(null)
              setHighlight(null)
            }}
            className="min-h-0 flex-1 overflow-auto bg-[var(--dash-canvas)] bg-[radial-gradient(var(--dash-dot)_1px,transparent_1px)] bg-size-[18px_18px]"
          >
            {widgets.some(isGraph) && presetFilters && (
              <PresetFilterBar
                dashboard={shown}
                canEdit={!readOnly}
                personalValues={personal.values}
                onValuesChange={(filterId, values) => (readOnly ? personal.setFilterValues(filterId, values) : setFilterValues(dashboard.id, filterId, values))}
                onApplyValues={(values) =>
                  readOnly
                    ? personal.setManyFilterValues(values)
                    : Object.entries(values).forEach(([filterId, picked]) => setFilterValues(dashboard.id, filterId, picked))
                }
                onResetPersonal={overrides.length ? () => personal.reset(overrides) : undefined}
                pageId={pageId}
                canManageShared={canManageSharedFilters}
                viewer={filterViewer}
              />
            )}
            {widgets.some(isGraph) && !presetFilters && (
              <FilterBar
                dashboard={shown}
                canEdit={!readOnly}
                adding={addingFilter}
                onAddingChange={setAddingFilter}
                onValuesChange={(filterId, values) => (readOnly ? personal.setFilterValues(filterId, values) : setFilterValues(dashboard.id, filterId, values))}
                onResetPersonal={overrides.length ? () => personal.reset(overrides) : undefined}
                fixedStyle={fixedFilterStyle}
              />
            )}
            {empty && readOnly ? (
              <p className="p-10 text-center text-sm text-[var(--dash-muted)]">Nothing to preview yet. Add a graph to the canvas first.</p>
            ) : starting ? (
              <EmptyCanvasStart
                onPrompt={chat.send}
                widgets={menuWidgets}
                sources={sources}
                queries={queries}
                sourcesLabel={sourcesLabel}
                datasetsFirst={datasetsFirst}
                datasetsOnly={datasetsOnly}
                catalog={graphCatalog}
                onAdd={addItem}
                onAddSource={onAddSource}
                onOpenAddSource={onOpenAddSource}
                onAddText={addText}
                onAddMedia={() => addItem(mediaItem())}
                onUndo={undoChange}
              />
            ) : empty ? (
              <CanvasHero onPrompt={chat.send} sources={sources} onAdd={onAdd} onAddSource={onAddSource} onOpenData={onOpenData} />
            ) : (
              <div className={cn('flex flex-col gap-3 p-5', drawer ? 'pb-[380px]' : !railed && 'pb-24')}>
                <CanvasGrid
                  dashboard={shown}
                  onLayoutChange={(layout) => setLayout(dashboard.id, layout)}
                  onRemove={(itemId) => removeWidget(dashboard.id, itemId)}
                  selectedId={selectedId}
                  onSelect={onSelect}
                  multiSelectedIds={multiSelectedIds}
                  onToggleSelect={onToggleSelect}
                  readOnly={readOnly}
                  refreshing={refreshing}
                  onComment={onComment}
                  editingId={chat.editingId}
                  highlight={highlight}
                  onHighlight={highlighting ? toggleHighlight : undefined}
                  sections={sections}
                  pageMove={pageMove}
                />
                {chat.thinking && !chat.editingId && <div className={cn('h-80 animate-pulse rounded-lg bg-[var(--dash-card)]', emptyStart && 'w-1/2')} />}
              </div>
            )}
          </div>

          <div
            ref={setFullScreenHost}
            data-dashboard-theme={theme}
            className={cn('absolute inset-0 z-30 bg-[var(--dash-canvas)]', !fullScreenId && 'hidden', fullScreenTools && !railed && 'pb-12')}
          />

          {fullScreenId ? (
            fullScreenTools && !railed && (
              <div className="pointer-events-none absolute inset-x-0 bottom-4 z-40 flex justify-center">
                <div className="pointer-events-auto">{toolbar(fullScreenId)}</div>
              </div>
            )
          ) : readOnly ? (
            highlight && (
              // Floats where the edit toolbar sits, so showing it never pushes the graphs down.
              <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
                <div className="pointer-events-auto shadow-lg">
                  <HighlightChip highlight={highlight} onClear={() => setHighlight(null)} />
                </div>
              </div>
            )
          ) : starting ? null : drawer ?? (railed ? (
            <>
              {empty && (
                <div data-dashboard-theme={theme} className="pointer-events-none absolute top-4 left-4 flex items-center gap-1.5 text-[var(--dash-muted)]">
                  <ArrowLeft className="size-3.5" />
                  <span className="text-[11px] font-medium tracking-wider uppercase">Create manually</span>
                </div>
              )}
              {aboveToolbar && (
                <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
                  <div className="pointer-events-auto">{aboveToolbar}</div>
                </div>
              )}
            </>
          ) : (
            <div className="pointer-events-none absolute inset-x-0 bottom-4 z-30 flex flex-col items-center gap-1.5">
              {(empty || showManualHint) && (
                // Sits over the canvas but outside its themed element, so it takes the theme itself.
                <div data-dashboard-theme={theme} className="flex flex-col items-center gap-1.5 text-[var(--dash-muted)]">
                  <span className="text-[11px] font-medium tracking-wider uppercase">{empty ? 'Create manually' : 'Create more blocks manually'}</span>
                  <ArrowDown className="size-3.5" />
                </div>
              )}
              {aboveToolbar && <div className="mb-1">{aboveToolbar}</div>}
              <div className="pointer-events-auto">{toolbar(null)}</div>
            </div>
          ))}
        </div>
      </div>
    </FullScreenContext>
  )
}

