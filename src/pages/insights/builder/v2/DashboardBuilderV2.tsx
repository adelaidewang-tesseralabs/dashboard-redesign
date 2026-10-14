import { useEffect, useState, type ReactNode } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { CURRENT_USER, type Dashboard } from '../../../../data/dashboards'
import { useDashboards } from '../../../../data/DashboardsStore'
import { groupBySql, type DataObject } from '../../../../data/dataSources'
import { pageView, resolvePageId } from '../../../../data/pages'
import { isGraph, type CanvasItem } from '../../../../data/widgets'
import { useFixedFilterStyle } from '../../../../lib/fixedFilterStyle'
import type { PanelLayout } from '../../../../lib/panelLayout'
import { useCollapseNavWhile } from '../../../../nav/navSuppression'
import { Button } from '../../../../ui/Button'
import { Dialog } from '../../../../ui/Dialog'
import { useToast } from '../../../../ui/Toast'
import { BuilderCanvas } from '../BuilderCanvas'
import { BuilderHeader } from '../BuilderHeader'
import { displayTitle, itemLabel } from '../canvasItems'
import { ChatPanel } from '../ChatPanel'
import { IconAction } from '../EditorFields'
import { widgetSuggestions } from '../planWidgetEdit'
import { useAttachTables } from '../useAttachTables'
import { useBuilderChat } from '../useBuilderChat'
import { useSidePanelWidth } from '../useSidePanelWidth'
import type { AddSourceKind } from '../sourceKinds'
import { useWidgetSelection } from '../useWidgetSelection'
import { WidgetEditor } from '../WidgetEditor'
import { LineageView } from '../lineage/LineageView'
import type { LineageTarget } from '../lineage/lineageGraph'
import { PreviewPersonContext } from '../previewPerson'
import { LINKED_WIDGET_PARAM } from '../useGraphView'
import { WidgetNavigationContext, type WidgetNavigation } from '../widgetNavigation'
import { AddDatasetDialogs, type AddDatasetRequest } from './AddDatasetDialogs'
import { BottomSettingsPanel } from './BottomSettingsPanel'
import { BuilderViewSwitch, type BuilderView } from './BuilderViewSwitch'
import { DashboardActions } from './DashboardActions'
import { DatasetDataSection } from './DatasetDataSection'
import { DockedColumn, SettingsEmptyState } from './DockedColumn'
import { EditModeSwitch, type EditMode } from './EditModeSwitch'
import { datasetGraphColumns, graphFor, graphForColumn, listDatasets, sqlKey, tableKey, type Dataset, type GraphColumn } from './datasets'
import { BackPill } from './BackPill'
import { useDismissOnInteraction } from './useDismissOnInteraction'
import { useTransformsOpen } from './useTransformsOpen'
import { DataTab, type DataPanel } from './DataTab'
import { planFromCatalog } from './planFromCatalog'
import { LayerSwitchButton } from './LayerSwitchButton'
import { MultiGraphPanel } from './MultiGraphPanel'
import { StackedEditorPanel } from './StackedEditorPanel'
import { useBottomPanelHeight } from './useBottomPanelHeight'
import { useConsoleTabs, type ConsoleTab } from './useConsoleTabs'
import { useTransformDrafts } from './transforms/transformDrafts'
import { useLeaveGuard } from './useLeaveGuard'
import { useDashboardPages } from './useDashboardPages'
import { useV3SidePanel } from './useV3SidePanel'
import { PageTabs } from './PageTabs'
import { PreviewBanner } from './PreviewBanner'

/**
 * Production flow only — where a selected widget's settings go: `side` layers them over the chat (V3),
 * `bottom` docks them under the canvas (V4), `split` puts them above the chat in the same column (V5).
 */
export type SettingsPlacement = 'side' | 'bottom' | 'split'

/**
 * `catalog` (V2): Catalog console with a SQL editor. `production` (V3–V5): no catalog, datasets come through the main
 * app's source dialogs. `governed` (V6): the production builder, but the read-only catalog is the only way to add data
 * and nothing can author SQL, so Data Foundry stays the source of truth for queries.
 */
export type AddDatasetFlow = 'catalog' | 'production' | 'governed'

/** Builder V2: build on the canvas, manage everything the dashboard reads in a Data tab. */
type DashboardBuilderV2Props = {
  dashboard: Dashboard
  /** Page-level actions (favorite, share…) shown in the builder's header row instead of the top bar. */
  headerActions?: ReactNode
  addDatasetFlow?: AddDatasetFlow
  settingsPlacement?: SettingsPlacement
  /** Shown right after the name, e.g. who has access. */
  badge?: ReactNode
  /** Viewers get the canvas only: no Data tab, toolbar, chat, widget panels or comments. */
  readOnly?: boolean
  onOpenHistory?: () => void
  /** Owners and editors: the lineage page shown in place of the canvas, opened from a graph or the dashboard's more menu. */
  lineage?: LineageTarget | null
  onLineageChange?: (target: LineageTarget | null) => void
  /** Opens the share dialog with this person staged, from the preview's person picker. */
  onShare?: (invitee: string) => void
  /**
   * Production flow (V3): where the canvas tools, widget settings and chat sit. `layered` stacks settings over the chat on the right,
   * `tools-left` also docks the toolbar as a left rail, `settings-left` / `chat-left` split settings and chat across both sides, and
   * `chat-left-select` is `chat-left` with settings only while something is selected. `settings-bottom` is handled by the caller through `settingsPlacement`.
   */
  panelLayout?: PanelLayout
}

export function DashboardBuilderV2(props: DashboardBuilderV2Props) {
  const { dashboard, headerActions, addDatasetFlow = 'catalog', settingsPlacement = 'side', badge, readOnly = false, onOpenHistory, lineage = null, onLineageChange, onShare, panelLayout = 'layered' } = props
  const { addWidgets, updateWidget, updateWidgets, addSources, addSqlDataset } = useDashboards()
  const toast = useToast()
  const chat = useBuilderChat(dashboard, planFromCatalog)
  const widgets = dashboard.widgets ?? []
  const { selected, setSelectedId } = useWidgetSelection(widgets)
  const { sources } = useAttachTables(dashboard)
  const [view, setView] = useState<BuilderView>('canvas')
  /** The graph "View dataset" came from, so the Data tab can offer a way back to it. */
  const [returnToId, setReturnToId] = useState<string | null>(null)
  /** The dataset a graph was just created from, so the canvas can offer a way back to it. */
  const [backToDatasetKey, setBackToDatasetKey] = useState<string | null>(null)
  const transformsPanel = useTransformsOpen(dashboard.id)
  const [, setSearchParams] = useSearchParams()
  /** The user opened the dataset list again while the chat had it collapsed. */
  const [listReopened, setListReopened] = useState(false)
  const [listCollapsedByUser, setListCollapsedByUser] = useState(false)
  /** The dataset whose "Using" chip the user cleared in the Data tab chat. */
  const [contextClearedKey, setContextClearedKey] = useState<string | null>(null)
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [dataPanel, setDataPanel] = useState<DataPanel>('datasets')
  /** Who the preview shows the dashboard as; null when editing. */
  const [previewAs, setPreviewAs] = useState<string | null>(null)
  const previewing = previewAs !== null
  const [refreshing, setRefreshing] = useState(false)
  const [editMode, setEditMode] = useState<EditMode>('ai')
  const [addRequest, setAddRequest] = useState<AddDatasetRequest | null>(null)
  const sidePanel = useSidePanelWidth()
  const leftPanel = useSidePanelWidth({ edge: 'right', storageKey: 'insights.leftPanelWidth' })
  const bottomPanel = useBottomPanelHeight()
  const consoleTabs = useConsoleTabs()
  const datasets = listDatasets(dashboard)
  const transformDrafts = useTransformDrafts()
  const [multiIds, setMultiIds] = useState<string[]>([])
  const multiGraphs = widgets.filter(isGraph).filter((item) => multiIds.includes(item.id))
  const multiActive = multiGraphs.length >= 2
  const unappliedDatasets = datasets.filter((dataset) => transformDrafts.drafts[dataset.key])
  const leaveGuard = useLeaveGuard(unappliedDatasets.length > 0)
  const leaveDialog = (
    <Dialog
      open={leaveGuard.pendingHref !== null}
      onClose={leaveGuard.stay}
      title="Discard unapplied changes?"
      description="These datasets have transform changes that haven't been applied to their graphs."
      footer={
        <>
          <Button variant="ghost" onClick={leaveGuard.stay}>
            Stay
          </Button>
          <Button variant="destructive" onClick={leaveGuard.leave}>
            Discard and leave
          </Button>
        </>
      }
    >
      <ul className="flex flex-col gap-1 text-sm text-white/80">
        {unappliedDatasets.map((dataset) => (
          <li key={dataset.key}>{dataset.label}</li>
        ))}
      </ul>
    </Dialog>
  )
  const productionFlow = addDatasetFlow !== 'catalog'
  const governed = addDatasetFlow === 'governed'
  const fixedFilterStyle = useFixedFilterStyle()
  const sourceDialogs = productionFlow && !governed
  const bottomSettings = productionFlow && settingsPlacement === 'bottom'
  const docked = productionFlow && (panelLayout === 'settings-left' || panelLayout === 'chat-left' || panelLayout === 'chat-left-select')
  const chatOnLeft = docked && panelLayout !== 'settings-left'
  /** E only opens settings for a selection, so selecting reflows the canvas; C and D keep the column docked. */
  const pinnedSettings = panelLayout !== 'chat-left-select'
  const layeredSettings = settingsPlacement === 'side' && !docked
  const asViewer = readOnly || previewing
  const pages = useDashboardPages(dashboard, asViewer, () => setSelectedId(null))
  const page = pageView(dashboard, pages.activeId)
  const showPageTabs = asViewer ? pages.pages.length > 1 : governed || pages.pages.length > 1
  const v3Panel = useV3SidePanel({ enabled: productionFlow, chat, hasWidgets: widgets.length > 0, editorCoversChat: (!!selected || multiActive) && layeredSettings, setSelectedId })
  const multiSelect = governed && !bottomSettings && !asViewer

  useEffect(() => {
    if (!multiActive) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMultiIds([])
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [multiActive])

  /** The new block takes the selection, whatever was selected before. */
  const add = (item: CanvasItem) => {
    addWidgets(dashboard.id, [item])
    selectWidget(item.id)
  }
  const changeView = (next: BuilderView) => {
    if (next === 'canvas') setReturnToId(null)
    setView(next)
  }
  const openDataset = (key: string | null) => {
    setActiveKey(key)
    setView('data')
  }
  const selectWidget = (itemId: string | null) => {
    setMultiIds([])
    if (productionFlow) {
      v3Panel.select(itemId)
      return
    }
    setSelectedId(itemId)
    if (itemId && editMode === 'ai') chat.setChatOpen(true)
  }
  /** Shift-click: the open graph becomes the first of the selection; dropping back to one graph opens it as usual. */
  const toggleSelect = (itemId: string) => {
    const base = multiActive ? multiGraphs.map((item) => item.id) : selected && isGraph(selected) ? [selected.id] : []
    const next = base.includes(itemId) ? base.filter((id) => id !== itemId) : [...base, itemId]
    if (next.length < 2) return selectWidget(next[0] ?? null)
    setSelectedId(null)
    setMultiIds(next)
    v3Panel.showEditor()
  }
  const openWidget = (itemId: string) => {
    changeView('canvas')
    selectWidget(itemId)
  }
  const changeEditMode = (mode: EditMode) => {
    setEditMode(mode)
    chat.setChatOpen(mode === 'ai')
  }
  const commentOn = (itemId: string, text: string) => {
    const item = widgets.find((widget) => widget.id === itemId)
    if (!item) return
    setSelectedId(itemId)
    if (productionFlow) v3Panel.showChat()
    else setEditMode('ai')
    chat.send(text, item)
  }
  const closeChat = () => {
    if (productionFlow) {
      v3Panel.closeChat()
      return
    }
    chat.setChatOpen(false)
    setSelectedId(null)
  }
  const modeSwitch = <EditModeSwitch mode={editMode} onChange={changeEditMode} />
  /** Lands on the canvas with the new graph selected, scrolled to and flashed (the copied-link treatment), and a way back. */
  const showCreatedGraph = (item: Pick<CanvasItem, 'id' | 'pageId'>, datasetKey: string | undefined) => {
    openWidget(item.id)
    setBackToDatasetKey(datasetKey ?? null)
    setSearchParams(
      (current) => {
        if (item.pageId) current.set('page', resolvePageId(dashboard, item.pageId))
        current.set(LINKED_WIDGET_PARAM, item.id)
        return current
      },
      { replace: true },
    )
  }
  const createGraph = (dataset: Dataset, column?: GraphColumn) => {
    const item = column ? graphForColumn(dataset, column) : graphFor(dataset)
    add(item)
    showCreatedGraph(item, dataset.key)
  }
  const viewChatGraph = (itemId: string) => {
    const item = widgets.find((widget) => widget.id === itemId)
    if (item) showCreatedGraph(item, activeDataset?.key)
    else openWidget(itemId)
  }
  const backToDataset = () => {
    if (!backToDatasetKey) return
    setBackToDatasetKey(null)
    setDataPanel('datasets')
    openDataset(backToDatasetKey)
  }
  const openChat = () => (productionFlow ? v3Panel.showChat() : chat.setChatOpen(true))
  const closeDataChat = () => (productionFlow ? v3Panel.closeChat() : chat.setChatOpen(false))
  const newSql = () => {
    if (sourceDialogs) {
      setAddRequest({ kind: 'foundry', foundryMode: 'sql' })
      return
    }
    consoleTabs.newQuery()
    setDataPanel('catalog')
  }
  const requestSource = (kind: AddSourceKind) => {
    if (governed) {
      openCatalog()
      return
    }
    setAddRequest({ kind, foundryMode: 'tables' })
  }
  const showAdded = (key: string, message: string) => {
    setAddRequest(null)
    setActiveKey(key)
    const openDatasets = () => {
      setDataPanel('datasets')
      setView('data')
    }
    if (view === 'canvas') {
      toast(`${message} — graph it from the chart tool`, { label: 'View', onSelect: openDatasets })
      return
    }
    openDatasets()
    toast(message)
  }
  const addTables = (tables: DataObject[], name: string) => {
    if (tables.length === 0) return
    const label = (table: DataObject) => (tables.length === 1 && name) || table.label
    addSources(dashboard.id, tables.map((table) => ({ table: table.name, label: label(table) })))
    showAdded(tableKey(tables[0].name), tables.length === 1 ? `Added ${label(tables[0])}` : `Added ${tables.length} datasets`)
  }
  const addQuery = (label: string, sql: string) => {
    const id = crypto.randomUUID()
    addSqlDataset(dashboard.id, { id, label, sql })
    showAdded(sqlKey(id), `Added ${label}`)
  }
  const saveQuery = (tab: ConsoleTab) => {
    const id = crypto.randomUUID()
    addSqlDataset(dashboard.id, { id, label: tab.title, sql: tab.sql })
    consoleTabs.update(tab.id, { datasetId: id })
    setActiveKey(sqlKey(id))
    toast(`Added ${tab.title} as a dataset`)
  }
  const showDataset = (key: string) => {
    setActiveKey(key)
    setDataPanel('datasets')
  }
  const editAsSql = (dataset: Extract<Dataset, { kind: 'table' }>) => {
    const id = crypto.randomUUID()
    addSqlDataset(dashboard.id, { id, label: `${dataset.label} query`, sql: groupBySql(dataset.object, dataset.object.fields[0]) })
    setActiveKey(sqlKey(id))
  }
  const addTable = (table: DataObject) => {
    addSources(dashboard.id, [{ table: table.name, label: table.label }])
    setActiveKey(tableKey(table.name))
    toast(`Added ${table.label}`)
  }
  const togglePreview = (next: boolean) => {
    setPreviewAs(next ? CURRENT_USER : null)
    if (next) setSelectedId(null)
  }
  const openCatalog = () => {
    setDataPanel(sourceDialogs ? 'datasets' : 'catalog')
    setView('data')
  }
  const selectedDataSection =
    selected && (selected.source === 'object' || (selected.source === 'sql' && selected.datasetId)) ? (
      <DatasetDataSection
        item={selected}
        datasets={datasets}
        dashboard={dashboard}
        onChange={(item) => updateWidget(dashboard.id, item)}
        onOpenDataset={openDataset}
      />
    ) : undefined
  const showSettings = view === 'canvas' && !asViewer && !lineage
  const dataChatOpen = view === 'data' && !asViewer && !lineage && chat.chatOpen
  const canvasChatOpen = showSettings && chat.chatOpen && (productionFlow || !(selected && editMode === 'manual'))
  const chatShowing = dataChatOpen || canvasChatOpen
  if (!chatShowing && listReopened) setListReopened(false)
  const activeDataset = datasets.find((dataset) => dataset.key === activeKey) ?? datasets[0]
  const datasetOnScreen = dataPanel === 'datasets' || sourceDialogs
  const chatDataset = datasetOnScreen && activeDataset?.key !== contextClearedKey ? activeDataset : undefined
  const datasetSuggestions = (dataset: Dataset) =>
    datasetGraphColumns(dataset, dashboard)
      .filter((column) => !column.graphed)
      .slice(0, 3)
      .map((column) => `Graph by ${column.label}`)
  useCollapseNavWhile(chatShowing || (docked && !chatOnLeft && showSettings))
  const backToDatasetShown = backToDatasetKey !== null && view === 'canvas' && !asViewer
  useDismissOnInteraction(backToDatasetShown, () => setBackToDatasetKey(null))
  const viewDataset = (key: string, fromItemId: string) => {
    setDataPanel('datasets')
    openDataset(key)
    if (governed) setReturnToId(fromItemId)
  }
  const navigation: WidgetNavigation = {
    onViewLineage: readOnly || !onLineageChange ? undefined : (itemId) => onLineageChange({ kind: 'graph', itemId }),
    onOpenDataset: readOnly ? undefined : viewDataset,
  }
  const canvasChat = chat.chatOpen && (
    <ChatPanel
      embedded
      messages={chat.messages}
      thinking={chat.thinking}
      onSend={(text) => chat.send(text, selected ?? undefined)}
      onClose={closeChat}
      intro="Describe the graphs you want, or select one to change it. I search every source you can access, and tell you which ones I used. Mention @table to pick one."
      onOpenSource={(table) => openDataset(tableKey(table))}
      context={selected ? { label: displayTitle(selected) || itemLabel(selected), suggestions: widgetSuggestions(selected), onClear: () => setSelectedId(null) } : undefined}
      headerExtra={selected && layeredSettings && <LayerSwitchButton to="editor" onClick={v3Panel.showEditor} />}
    />
  )
  const settingsPanel = multiActive ? (
    <MultiGraphPanel graphs={multiGraphs} datasets={datasets} dashboard={dashboard} onChange={(items) => updateWidgets(dashboard.id, items)} onDeselect={toggleSelect} onClose={() => setMultiIds([])} />
  ) : selected && !bottomSettings ? (
    <WidgetEditor
      embedded
      item={selected}
      sources={sources.map(({ object }) => object)}
      onChange={(item) => updateWidget(dashboard.id, item)}
      onClose={() => setSelectedId(null)}
      headerExtra={layeredSettings && <LayerSwitchButton to="chat" onClick={v3Panel.showChat} unread={v3Panel.unread} />}
      dataSection={selectedDataSection}
    />
  ) : undefined
  const dataChat = dataChatOpen && (
    <ChatPanel
      embedded={chatOnLeft}
      messages={chat.messages}
      thinking={chat.thinking}
      onSend={(text) => chat.send(text, undefined, chatDataset?.key)}
      onClose={closeDataChat}
      intro="Describe the graphs you want. I search every source you can access, and tell you which ones I used. Mention @table to pick one."
      onOpenSource={(table) => showDataset(tableKey(table))}
      resize={chatOnLeft ? undefined : sidePanel}
      context={chatDataset && { kind: 'dataset', label: chatDataset.label, suggestions: datasetSuggestions(chatDataset), onClear: () => setContextClearedKey(chatDataset.key) }}
      onViewGraph={viewChatGraph}
    />
  )
  const dockedSettings = docked && showSettings && (settingsPanel || pinnedSettings) && (
    <DockedColumn label="Widget settings" resize={chatOnLeft ? sidePanel : leftPanel}>
      {settingsPanel ?? <SettingsEmptyState />}
    </DockedColumn>
  )
  const dockedChat = docked && canvasChatOpen && (
    <DockedColumn label="Ask AI" resize={chatOnLeft ? leftPanel : sidePanel}>
      {canvasChat}
    </DockedColumn>
  )

  if (lineage && onLineageChange) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        {lineage.kind !== 'graph' && <BuilderHeader dashboard={dashboard} badge={badge} readOnly={readOnly} trailing={<div className="flex items-center gap-2">{headerActions}</div>} />}
        <LineageView key={JSON.stringify(lineage)} dashboard={dashboard} target={lineage} onBack={() => onLineageChange(null)} />
        {leaveDialog}
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1">
      {chatOnLeft && (dataChat ? <DockedColumn label="Ask AI" resize={leftPanel}>{dataChat}</DockedColumn> : dockedChat)}
      {docked && !chatOnLeft && dockedSettings}
      <div className="relative flex min-w-0 flex-1 flex-col">
        <BuilderHeader
          dashboard={dashboard}
          badge={badge}
          readOnly={readOnly}
          trailing={
            <DashboardActions
              dashboard={dashboard}
              previewing={previewing}
              onPreviewChange={readOnly ? undefined : togglePreview}
              refreshing={refreshing}
              onRefreshingChange={setRefreshing}
              iconActions={headerActions}
            />
          }
        />
        {!asViewer && <BuilderViewSwitch view={view} dataCount={datasets.length} unapplied={unappliedDatasets.length > 0} onChange={changeView} />}
        {previewAs && !readOnly && (
          <PreviewBanner
            dashboard={dashboard}
            person={previewAs}
            onPersonChange={setPreviewAs}
            onGrantAccess={onShare}
            onExit={() => togglePreview(false)}
          />
        )}
        {(asViewer || view === 'canvas') && showPageTabs && (
          <PageTabs
            pages={pages.pages}
            activeId={pages.activeId}
            onSelect={pages.select}
            {...(asViewer ? {} : { onAdd: pages.add, onUpdate: pages.update, onMove: pages.move, onDuplicate: pages.duplicate, onDelete: pages.remove })}
          />
        )}
        {asViewer || view === 'canvas' ? (
          <WidgetNavigationContext value={navigation}>
            <PreviewPersonContext value={previewAs && previewAs !== CURRENT_USER ? previewAs : undefined}>
              <BuilderCanvas
                key={`${pages.activeId}:${previewing}`}
                dashboard={page}
                sections={governed}
                summaries={governed}
                fixedFilterStyle={governed ? fixedFilterStyle : undefined}
                fullScreenToolbar={governed}
                toolbarPlacement={productionFlow && panelLayout === 'tools-left' ? 'left' : 'bottom'}
                aboveToolbar={backToDatasetShown && <BackPill label="Back to dataset" onBack={backToDataset} onDismiss={() => setBackToDatasetKey(null)} />}
                chat={productionFlow ? v3Panel.chat : chat}
                selectedId={selected?.id ?? null}
                onSelect={selectWidget}
                multiSelectedIds={multiActive ? new Set(multiGraphs.map((item) => item.id)) : undefined}
                onToggleSelect={multiSelect ? toggleSelect : undefined}
                onComment={commentOn}
                sources={datasets.flatMap((dataset) =>
                  dataset.kind === 'table' && (productionFlow || dataset.origin !== 'mosaic') ? [{ object: dataset.object, label: dataset.label }] : [],
                )}
                queries={dashboard.sqlDatasets}
                sourcesLabel="Datasets"
                datasetsFirst
                datasetsOnly={productionFlow}
                onAdd={add}
                onAddSource={productionFlow ? requestSource : openCatalog}
                onOpenAddSource={sourceDialogs ? undefined : openCatalog}
                onOpenData={openCatalog}
                readOnly={asViewer}
                previewing={previewing && !readOnly}
                onOpenHistory={onOpenHistory}
                refreshing={refreshing}
                crossHighlight
              />
            </PreviewPersonContext>
          </WidgetNavigationContext>
        ) : (
          <DataTab
            dashboard={dashboard}
            datasets={datasets}
            activeKey={activeKey}
            onActivate={setActiveKey}
            panel={dataPanel}
            onPanelChange={setDataPanel}
            onAddTable={addTable}
            onNewSql={newSql}
            consoleTabs={consoleTabs}
            onSaveQuery={saveQuery}
            onOpenDataset={showDataset}
            onEditAsSql={editAsSql}
            onCreateGraph={createGraph}
            onAskAi={openChat}
            onOpenWidget={openWidget}
            onAddSourceKind={sourceDialogs ? requestSource : undefined}
            sqlEditing={!governed}
            transformDrafts={transformDrafts}
            listCollapsed={listCollapsedByUser || (chatShowing && !listReopened)}
            onShowList={() => {
              setListReopened(true)
              setListCollapsedByUser(false)
            }}
            onCollapseList={() => setListCollapsedByUser(true)}
            isTransformsOpen={transformsPanel.isOpen}
            onTransformsOpenChange={transformsPanel.setOpen}
          />
        )}
        {view === 'data' && returnToId && !asViewer && (
          <div className="pointer-events-none absolute inset-x-0 bottom-6 z-40 flex justify-center">
            <BackPill label="Back to dashboard" onBack={() => openWidget(returnToId)} />
          </div>
        )}
        {bottomSettings && showSettings && selected && (
          <BottomSettingsPanel resize={bottomPanel} itemId={selected.id}>
            <WidgetEditor
              embedded
              layout="columns"
              item={selected}
              sources={sources.map(({ object }) => object)}
              onChange={(item) => updateWidget(dashboard.id, item)}
              onClose={() => setSelectedId(null)}
              headerExtra={
                <IconAction
                  Icon={bottomPanel.collapsed ? ChevronUp : ChevronDown}
                  label={bottomPanel.collapsed ? 'Expand widget settings' : 'Collapse widget settings'}
                  onClick={bottomPanel.toggleCollapsed}
                />
              }
              dataSection={selectedDataSection}
            />
          </BottomSettingsPanel>
        )}
      </div>

      {!chatOnLeft && dataChat}
      {chatOnLeft ? dockedSettings : dockedChat}

      {sourceDialogs && (
        <AddDatasetDialogs
          request={addRequest}
          attached={new Set(sources.map(({ object }) => object.name))}
          onClose={() => setAddRequest(null)}
          onAddTables={addTables}
          onAddQuery={addQuery}
        />
      )}

      {showSettings &&
        !docked &&
        (productionFlow ? (
          <StackedEditorPanel resize={sidePanel} front={v3Panel.front} split={settingsPlacement === 'split'} chat={canvasChat || undefined} editor={settingsPanel} />
        ) : selected && editMode === 'manual' ? (
          <WidgetEditor
            item={selected}
            sources={sources.map(({ object }) => object)}
            onChange={(item) => updateWidget(dashboard.id, item)}
            onClose={() => setSelectedId(null)}
            resize={sidePanel}
            headerExtra={modeSwitch}
            dataSection={selectedDataSection}
          />
        ) : (
          chat.chatOpen && (
            <ChatPanel
              messages={chat.messages}
              thinking={chat.thinking}
              onSend={(text) => chat.send(text, selected ?? undefined)}
              onClose={closeChat}
              intro="Describe the graphs you want, or select one to change it. I search every source you can access, and tell you which ones I used. Mention @table to pick one."
              onOpenSource={(table) => openDataset(tableKey(table))}
              resize={sidePanel}
              context={selected ? { label: displayTitle(selected) || itemLabel(selected), suggestions: widgetSuggestions(selected), onClear: () => setSelectedId(null) } : undefined}
              headerExtra={selected && modeSwitch}
            />
          )
        ))}
      {leaveDialog}
    </div>
  )
}
