import { useEffect, useState, type ReactNode } from 'react'
import { ArrowDown } from 'lucide-react'
import type { Dashboard, SqlDataset } from '../../../data/dashboards'
import { useDashboards } from '../../../data/DashboardsStore'
import type { DataObject } from '../../../data/dataSources'
import { isPageSummary, mediaItem, summaryItem, textItem, type CanvasItem } from '../../../data/widgets'
import { useResolvedAppearance } from '../../../lib/appearance'
import { cn } from '../../../lib/cn'
import { useToast } from '../../../ui/Toast'
import { CanvasGrid } from './CanvasGrid'
import { ChatLauncher } from './ChatLauncher'
import { sameHighlight, type CrossHighlight } from './crossHighlight'
import { HighlightChip } from './HighlightChip'
import { CanvasHero } from './CanvasHero'
import { CanvasToolbar } from './CanvasToolbar'
import { DataIssuesBanner } from './DataIssuesBanner'
import { FilterBar } from './FilterBar'
import { summarizePage, summaryBasis } from './pageSummary'
import { canvasRects, newSection, sectionRowAbove } from './sections'
import { personalOverrides, usePersonalFilters, withPersonalValues } from './usePersonalView'
import type { AddSourceKind } from './sourceKinds'
import type { useBuilderChat } from './useBuilderChat'
import { useUndoShortcuts } from './useUndoShortcuts'

type BuilderCanvasProps = {
  dashboard: Dashboard
  chat: ReturnType<typeof useBuilderChat>
  selectedId: string | null
  onSelect: (itemId: string | null) => void
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
  refreshing?: boolean
  onComment?: (itemId: string, text: string) => void
  /** Builder V3: open chat without clearing the selected graph, so it stacks on the settings. */
  onOpenChatLauncher?: () => void
  /** Linked from the unavailable-data banner for people who can restore. */
  onOpenHistory?: () => void
  /** Builder V2+: in preview, clicking part of a graph highlights related data and greys out the rest. */
  crossHighlight?: boolean
  /** Builder V6: section rows that group the graphs below them. */
  sections?: boolean
  /** Builder V6: Tessera AI can sum up each page in a text block. */
  summaries?: boolean
}

/** Dot-grid canvas shared by both builder versions: hero or widget grid, the floating toolbar, and the Tessera AI launcher. */
export function BuilderCanvas(props: BuilderCanvasProps) {
  const { dashboard, chat, selectedId, onSelect, sources, queries, sourcesLabel, datasetsFirst, datasetsOnly, onAdd, onAddSource, onOpenAddSource, onOpenData, drawer, readOnly = false, refreshing = false, onComment, onOpenChatLauncher, onOpenHistory, crossHighlight = false, sections = false, summaries = false } = props
  const { removeWidget, setLayout, setFilterValues, setAppearance, addGroup, insertWidget, undo, redo, canUndo, canRedo } = useDashboards()
  const toast = useToast()
  const personal = usePersonalFilters(dashboard.id)
  useUndoShortcuts(readOnly ? undefined : dashboard.id)
  const [addingFilter, setAddingFilter] = useState(false)
  const highlighting = readOnly && crossHighlight
  const [highlight, setHighlight] = useState<CrossHighlight | null>(null)
  if (!highlighting && highlight) setHighlight(null)
  const toggleHighlight = (next: CrossHighlight) => setHighlight((current) => (sameHighlight(current, next) ? null : next))

  useEffect(() => {
    if (!highlight) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setHighlight(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [highlight])
  const shown = readOnly ? withPersonalValues(dashboard, personal.values) : dashboard
  const overrides = readOnly ? personalOverrides(dashboard, personal.values) : []
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
    insertWidget(dashboard.id, summaryItem(summaryBasis(dashboard)), [])
  }
  const theme = useResolvedAppearance(dashboard.appearance)

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
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
        <FilterBar
          dashboard={shown}
          canEdit={!readOnly}
          adding={addingFilter}
          onAddingChange={setAddingFilter}
          onValuesChange={(filterId, values) => (readOnly ? personal.setFilterValues(filterId, values) : setFilterValues(dashboard.id, filterId, values))}
          onResetPersonal={overrides.length ? () => personal.reset(overrides) : undefined}
        />
        {empty && readOnly ? (
          <p className="p-10 text-center text-sm text-[var(--dash-muted)]">Nothing to preview yet. Add a graph to the canvas first.</p>
        ) : empty ? (
          <CanvasHero onPrompt={chat.send} sources={sources} onAdd={onAdd} onAddSource={onAddSource} onOpenData={onOpenData} />
        ) : (
          <div className={cn('flex flex-col gap-3 p-5', drawer ? 'pb-[380px]' : 'pb-24')}>
            <CanvasGrid
              dashboard={shown}
              onLayoutChange={(layout) => setLayout(dashboard.id, layout)}
              onRemove={(itemId) => removeWidget(dashboard.id, itemId)}
              selectedId={selectedId}
              onSelect={onSelect}
              readOnly={readOnly}
              refreshing={refreshing}
              onComment={onComment}
              editingId={chat.editingId}
              highlight={highlight}
              onHighlight={highlighting ? toggleHighlight : undefined}
              sections={sections}
            />
            {chat.thinking && !chat.editingId && <div className="h-80 animate-pulse rounded-lg bg-[var(--dash-card)]" />}
          </div>
        )}
      </div>

      {readOnly ? (
        highlight && (
          // Floats where the edit toolbar sits, so showing it never pushes the graphs down.
          <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
            <div className="pointer-events-auto shadow-lg">
              <HighlightChip highlight={highlight} onClear={() => setHighlight(null)} />
            </div>
          </div>
        )
      ) : drawer ?? (
        <div className="pointer-events-none absolute inset-x-0 bottom-4 flex flex-col items-center gap-1.5">
          {empty && (
            // Sits over the canvas but outside its themed element, so it takes the theme itself.
            <div data-dashboard-theme={theme} className="flex flex-col items-center gap-1.5 text-[var(--dash-muted)]">
              <span className="text-[11px] font-medium tracking-wider uppercase">Create manually</span>
              <ArrowDown className="size-3.5" />
            </div>
          )}
          <div className="pointer-events-auto">
            <CanvasToolbar
              chatOpen={chat.chatOpen}
              widgets={widgets}
              sources={sources}
              queries={queries}
              sourcesLabel={sourcesLabel}
              datasetsFirst={datasetsFirst}
              datasetsOnly={datasetsOnly}
              onToggleChat={() => chat.setChatOpen((current) => !current)}
              onOpenChat={() => chat.setChatOpen(true)}
              onAddSource={onAddSource}
              onOpenAddSource={onOpenAddSource}
              onAddWidget={onAdd}
              onAddText={() => {
                const item = textItem()
                onAdd(item)
                onSelect(item.id)
              }}
              onAddSummary={summaries ? addSummary : undefined}
              onAddFilter={() => setAddingFilter(true)}
              onAddMedia={() => onAdd(mediaItem())}
              onAddSection={sections ? addSection : undefined}
              onUndo={canUndo(dashboard.id) ? () => undo(dashboard.id) : undefined}
              onRedo={canRedo(dashboard.id) ? () => redo(dashboard.id) : undefined}
              appearance={dashboard.appearance ?? 'dark'}
              onAppearanceChange={(appearance) => setAppearance(dashboard.id, appearance)}
            />
          </div>
        </div>
      )}

      <ChatLauncher
        visible={!chat.chatOpen && !drawer && !readOnly}
        onOpen={
          onOpenChatLauncher ??
          (() => {
            onSelect(null)
            chat.setChatOpen(true)
          })
        }
      />
    </div>
  )
}

