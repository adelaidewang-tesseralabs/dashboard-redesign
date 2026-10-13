import { useState, type ReactNode } from 'react'
import { ChevronDown, ChevronUp, Eye } from 'lucide-react'
import type { Dashboard } from '../../../../data/dashboards'
import { useDashboards } from '../../../../data/DashboardsStore'
import { groupBySql, type DataObject } from '../../../../data/dataSources'
import { pageView } from '../../../../data/pages'
import type { CanvasItem } from '../../../../data/widgets'
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
import { AddDatasetDialogs, type AddDatasetRequest } from './AddDatasetDialogs'
import { BottomSettingsPanel } from './BottomSettingsPanel'
import { BuilderViewSwitch, type BuilderView } from './BuilderViewSwitch'
import { DashboardActions } from './DashboardActions'
import { DatasetDataSection } from './DatasetDataSection'
import { EditModeSwitch, type EditMode } from './EditModeSwitch'
import { graphFor, listDatasets, sqlKey, tableKey, type Dataset } from './datasets'
import { DataTab, type DataPanel } from './DataTab'
import { planFromCatalog } from './planFromCatalog'
import { LayerSwitchButton } from './LayerSwitchButton'
import { StackedEditorPanel } from './StackedEditorPanel'
import { useBottomPanelHeight } from './useBottomPanelHeight'
import { useConsoleTabs, type ConsoleTab } from './useConsoleTabs'
import { useDashboardPages } from './useDashboardPages'
import { useV3SidePanel } from './useV3SidePanel'
import { PageTabs } from './PageTabs'

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
}

export function DashboardBuilderV2({ dashboard, headerActions, addDatasetFlow = 'catalog', settingsPlacement = 'side', badge, readOnly = false, onOpenHistory }: DashboardBuilderV2Props) {
  const { addWidgets, updateWidget, addSources, addSqlDataset } = useDashboards()
  const toast = useToast()
  const chat = useBuilderChat(dashboard, planFromCatalog)
  const widgets = dashboard.widgets ?? []
  const { selected, setSelectedId } = useWidgetSelection(widgets)
  const { sources } = useAttachTables(dashboard)
  const [view, setView] = useState<BuilderView>('canvas')
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [dataPanel, setDataPanel] = useState<DataPanel>('datasets')
  const [previewing, setPreviewing] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [editMode, setEditMode] = useState<EditMode>('ai')
  const [addRequest, setAddRequest] = useState<AddDatasetRequest | null>(null)
  const sidePanel = useSidePanelWidth()
  const bottomPanel = useBottomPanelHeight()
  const consoleTabs = useConsoleTabs()
  const datasets = listDatasets(dashboard)
  const productionFlow = addDatasetFlow !== 'catalog'
  const governed = addDatasetFlow === 'governed'
  const sourceDialogs = productionFlow && !governed
  const bottomSettings = productionFlow && settingsPlacement === 'bottom'
  const layeredSettings = settingsPlacement === 'side'
  const asViewer = readOnly || previewing
  const pages = useDashboardPages(dashboard, asViewer, () => setSelectedId(null))
  const page = pageView(dashboard, pages.activeId)
  const showPageTabs = asViewer ? pages.pages.length > 1 : governed || pages.pages.length > 1
  const v3Panel = useV3SidePanel({ enabled: productionFlow, chat, hasWidgets: widgets.length > 0, editorCoversChat: !!selected && layeredSettings, setSelectedId })

  const add = (item: CanvasItem) => addWidgets(dashboard.id, [item])
  const openDataset = (key: string | null) => {
    setActiveKey(key)
    setView('data')
  }
  const selectWidget = (itemId: string | null) => {
    if (productionFlow) {
      v3Panel.select(itemId)
      return
    }
    setSelectedId(itemId)
    if (itemId && editMode === 'ai') chat.setChatOpen(true)
  }
  const openWidget = (itemId: string) => {
    setView('canvas')
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
  const createGraph = (dataset: Dataset) => {
    const item = graphFor(dataset)
    add(item)
    openWidget(item.id)
  }
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
    setPreviewing(next)
    if (next) setSelectedId(null)
  }
  const openCatalog = () => {
    setDataPanel(sourceDialogs ? 'datasets' : 'catalog')
    setView('data')
  }
  const selectedDataSection =
    selected && (selected.source === 'object' || (selected.source === 'sql' && selected.datasetId)) ? (
      <DatasetDataSection item={selected} datasets={datasets} dashboard={dashboard} onChange={(item) => updateWidget(dashboard.id, item)} onOpenDataset={openDataset} />
    ) : undefined
  const showSettings = view === 'canvas' && !asViewer

  return (
    <div className="flex min-h-0 flex-1">
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
        {!asViewer && <BuilderViewSwitch view={view} dataCount={datasets.length} onChange={setView} />}
        {previewing && !readOnly && (
          <div className="flex shrink-0 items-center gap-2 border-b border-sky-300/20 bg-sky-400/10 px-5 py-2 text-xs text-sky-100">
            <Eye className="size-3.5" />
            Viewing as a viewer
            <button type="button" onClick={() => togglePreview(false)} className="ml-auto cursor-pointer font-medium text-sky-100 underline-offset-2 hover:underline">
              Back to editing
            </button>
          </div>
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
          <BuilderCanvas
            key={pages.activeId}
            dashboard={page}
            sections={governed}
            summaries={governed}
            chat={productionFlow ? v3Panel.chat : chat}
            selectedId={selected?.id ?? null}
            onSelect={selectWidget}
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
            onOpenHistory={onOpenHistory}
            refreshing={refreshing}
            onOpenChatLauncher={productionFlow ? v3Panel.showChat : undefined}
            crossHighlight
          />
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
            onOpenWidget={openWidget}
            onAddSourceKind={sourceDialogs ? requestSource : undefined}
            sqlEditing={!governed}
          />
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
        (productionFlow ? (
          <StackedEditorPanel
            resize={sidePanel}
            front={v3Panel.front}
            split={settingsPlacement === 'split'}
            chat={
              chat.chatOpen ? (
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
              ) : undefined
            }
            editor={
              selected && !bottomSettings ? (
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
            }
          />
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
    </div>
  )
}
