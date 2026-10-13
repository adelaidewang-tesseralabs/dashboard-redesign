import { useState } from 'react'
import GridLayout, { useContainerWidth, type Layout, type LayoutItem } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import type { Dashboard } from '../../../data/dashboards'
import { useDashboards } from '../../../data/DashboardsStore'
import { GRID_COLS, isPageSummary, itemSize, type CanvasItem, type WidgetRect } from '../../../data/widgets'
import { cn } from '../../../lib/cn'
import { CanvasWidget } from './CanvasWidget'
import type { CrossHighlight } from './crossHighlight'
import type { WidgetActions } from './GraphActionsMenu'
import { dashboardGraphColors } from './graphColors'
import { insertRect } from './layoutWidgets'
import { SectionInsertLine } from './SectionInsertLine'
import { SectionRow } from './SectionRow'
import { SelectableWidget } from './SelectableWidget'
import { SECTION_ROWS, canvasRects, insertableBreaks, newSection, sectionMembers, sectionRowAbove } from './sections'
import { useGraphShortcuts } from './useGraphShortcuts'
import { useLinkedWidget } from './useLinkedWidget'

type CanvasGridProps = {
  dashboard: Dashboard
  onLayoutChange: (layout: WidgetRect[]) => void
  onRemove: (itemId: string) => void
  selectedId: string | null
  onSelect: (itemId: string | null) => void
  /** Preview: no dragging, resizing, selecting or removing. */
  readOnly?: boolean
  refreshing?: boolean
  /** Builder V2: comment on a graph to ask Tessera AI for a change. */
  onComment?: (itemId: string, text: string) => void
  /** The graph Tessera AI is changing right now. */
  editingId?: string | null
  /** Builder V2+ preview: linked highlighting between graphs. */
  highlight?: CrossHighlight | null
  onHighlight?: (highlight: CrossHighlight) => void
  /** Builder V6: section rows, added from the gaps between rows of graphs or a graph's menu. */
  sections?: boolean
}

const ROW_HEIGHT = 60
const GAP = 12

const ID_PREFIX: Record<CanvasItem['source'], string> = { object: 'obj', sql: 'sql', text: 'text', media: 'media' }

const toRects = (layout: readonly WidgetRect[]) => layout.map(({ i, x, y, w, h }) => ({ i, x, y, w, h }))

/** Drag a widget by its body to move it, or by the bottom-right corner to resize it. Section rows drag their graphs along. */
export function CanvasGrid({ dashboard, onLayoutChange, onRemove, selectedId, onSelect, readOnly = false, refreshing = false, onComment, editingId = null, highlight = null, onHighlight, sections = false }: CanvasGridProps) {
  const { addGroup, updateGroup, removeGroup, insertWidget } = useDashboards()
  const { width, containerRef, mounted } = useContainerWidth()
  useLinkedWidget(mounted)
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(new Set())
  const [rendered, setRendered] = useState<Layout>([])
  const [interacting, setInteracting] = useState(false)
  const widgets = dashboard.widgets ?? []
  const groups = dashboard.groups ?? []
  const { widgetRects, groupRects } = canvasRects(dashboard)
  const members = sectionMembers(groupRects, widgetRects)
  const hidden = new Set(
    groups.flatMap((group) => {
      const own = members.get(group.id) ?? []
      if (readOnly && group.hidden) return [group.id, ...own]
      return collapsed.has(group.id) ? own : []
    }),
  )
  const summary = widgets.find(isPageSummary)
  const shownWidgets = widgets.filter((item) => !hidden.has(item.id) && !isPageSummary(item))
  const shownGroups = groups.filter((group) => !hidden.has(group.id))
  const layout: LayoutItem[] = [
    ...widgetRects
      .filter((rect) => !hidden.has(rect.i))
      .map((rect) => {
        const item = widgets.find((widget) => widget.id === rect.i)
        return item ? { ...rect, minW: itemSize(item).minW, minH: itemSize(item).minH } : rect
      }),
    ...groupRects.filter((rect) => !hidden.has(rect.i)).map((rect) => ({ ...rect, minH: SECTION_ROWS, maxH: SECTION_ROWS, minW: GRID_COLS, isResizable: false })),
  ]
  const graphColors = dashboardGraphColors(dashboard)
  const save = (next: Layout) => onLayoutChange(toRects(next))
  const saveDrag = (next: Layout, before: LayoutItem | null, after: LayoutItem | null) => {
    const dy = before && after ? after.y - before.y : 0
    const own = before ? (members.get(before.i) ?? []) : []
    if (!dy || own.length === 0) return save(next)
    // Collapsed members aren't in `next`, so move every member from its pre-drag rect.
    const moved = widgetRects.filter((rect) => own.includes(rect.i)).map((rect) => ({ ...rect, y: rect.y + dy }))
    onLayoutChange([...toRects(next).filter((rect) => !own.includes(rect.i)), ...moved])
  }
  const toggleCollapsed = (groupId: string) =>
    setCollapsed((current) => {
      const next = new Set(current)
      if (!next.delete(groupId)) next.add(groupId)
      return next
    })
  const allRects = [...widgetRects, ...groupRects]
  const sectionOf = (itemId: string) => [...members].find(([, own]) => own.includes(itemId))?.[0] ?? null
  /** A copy lands right under its original, or at the bottom when pasted where the original isn't. */
  const insertCopy = (item: CanvasItem) => {
    if (isPageSummary(item)) return
    const copy = { ...item, id: `${ID_PREFIX[item.source]}-${crypto.randomUUID()}` }
    const source = widgetRects.find((rect) => rect.i === item.id)
    const { w, h } = source ?? itemSize(item)
    const bottom = Math.max(0, ...allRects.map((rect) => rect.y + rect.h))
    const rect = source ? { i: copy.id, x: source.x, y: source.y + source.h, w, h } : { i: copy.id, x: 0, y: bottom, w, h }
    insertWidget(dashboard.id, copy, insertRect(allRects, rect))
    onSelect(copy.id)
  }
  const moveToSection = (itemId: string, sectionId: string | null) => {
    const rect = widgetRects.find((entry) => entry.i === itemId)
    if (!rect) return
    const section = groupRects.find((entry) => entry.i === sectionId)
    onLayoutChange(insertRect(allRects, { ...rect, x: 0, y: section ? section.y + section.h : 0 }))
    if (sectionId) setCollapsed((current) => new Set([...current].filter((id) => id !== sectionId)))
  }
  const remove = (itemId: string) => {
    onRemove(itemId)
    if (selectedId === itemId) onSelect(null)
  }
  const addSectionAt = (row: number) => {
    const { group, layout: next } = newSection(allRects, row)
    addGroup(dashboard.id, group, next)
  }
  const actionsFor = (item: CanvasItem): WidgetActions => ({
    onDuplicate: () => insertCopy(item),
    onRemove: () => remove(item.id),
    move: {
      sections: groups.map((group) => ({ id: group.id, name: group.name })),
      sectionId: sectionOf(item.id),
      onMove: (sectionId) => moveToSection(item.id, sectionId),
    },
    onAddSectionAbove: sections ? () => addSectionAt(sectionRowAbove(allRects, widgetRects.find((rect) => rect.i === item.id))) : undefined,
  })
  const insertLines = sections && !readOnly && !interacting ? insertableBreaks(widgetRects, groupRects, rendered, collapsed) : []
  useGraphShortcuts(
    readOnly
      ? undefined
      : { dashboardId: dashboard.id, selected: widgets.find((item) => item.id === selectedId) ?? null, onPaste: insertCopy, onDelete: remove },
  )

  const renderWidget = (item: CanvasItem, actions: WidgetActions, className?: string) => (
    <SelectableWidget
      selected={selectedId === item.id}
      readOnly={readOnly}
      busy={refreshing || editingId === item.id}
      onSelect={() => onSelect(item.id)}
      className={className}
    >
      <CanvasWidget
        dashboard={dashboard}
        item={item}
        readOnly={readOnly}
        selected={!readOnly && selectedId === item.id}
        actions={readOnly ? undefined : actions}
        onComment={readOnly || !onComment ? undefined : (text) => onComment(item.id, text)}
        highlight={highlight}
        onHighlight={onHighlight}
        colors={graphColors.get(item.id)}
      />
    </SelectableWidget>
  )

  const grid = (
    <div ref={containerRef} className="canvas-grid relative">
      {insertLines.map(({ row, shownRow }) => (
        <SectionInsertLine key={row} top={shownRow * (ROW_HEIGHT + GAP) - GAP / 2} onAdd={() => addSectionAt(row)} />
      ))}
      {mounted && (
        <GridLayout
          width={width}
          layout={layout}
          gridConfig={{ cols: GRID_COLS, rowHeight: ROW_HEIGHT, margin: [GAP, GAP], containerPadding: [0, 0] }}
          dragConfig={{ enabled: !readOnly, cancel: 'button, input, textarea, form, a, [role=toolbar]' }}
          resizeConfig={{ enabled: !readOnly }}
          onLayoutChange={setRendered}
          onDragStart={() => setInteracting(true)}
          onDragStop={(next, before, after) => {
            setInteracting(false)
            saveDrag(next, before, after)
          }}
          onResizeStart={() => setInteracting(true)}
          onResizeStop={(next) => {
            setInteracting(false)
            save(next)
          }}
        >
          {shownGroups.map((group) => (
            <div key={group.id} className={cn(!readOnly && 'cursor-grab active:cursor-grabbing')}>
              <SectionRow
                group={group}
                count={members.get(group.id)?.length ?? 0}
                collapsed={collapsed.has(group.id)}
                onToggleCollapsed={() => toggleCollapsed(group.id)}
                onChange={readOnly ? undefined : (next) => updateGroup(dashboard.id, next)}
                onRemove={readOnly ? undefined : () => removeGroup(dashboard.id, group.id)}
              />
            </div>
          ))}
          {shownWidgets.map((item) => (
            // Grid items are transformed, so an open comment box or filter list can only rise above its neighbours by lifting the whole item.
            <div key={item.id} className={cn(!readOnly && 'cursor-grab active:cursor-grabbing', 'has-[[data-comment-open]]:z-20 has-[[data-popover-open]]:z-20 has-[[data-editing]]:z-20 has-[[data-editing]]:cursor-auto')}>
              {/* GridLayout overrides mouse handlers on its direct children, so selection lives one level down. */}
              {renderWidget(item, actionsFor(item), 'h-full')}
            </div>
          ))}
        </GridLayout>
      )}
    </div>
  )

  if (!summary) return grid
  return (
    <div className="flex flex-col gap-3">
      {/* Above the grid so the text toolbar's dropdowns open over the graphs. */}
      <div className="relative z-10">{renderWidget(summary, { onRemove: () => remove(summary.id) })}</div>
      {grid}
    </div>
  )
}
