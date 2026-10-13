import { useState, type ReactNode } from 'react'
import type { Dashboard } from '../../../data/dashboards'
import { useDashboards } from '../../../data/DashboardsStore'
import type { DataObject } from '../../../data/dataSources'
import type { CanvasItem } from '../../../data/widgets'
import { BuilderCanvas } from './BuilderCanvas'
import { BuilderHeader } from './BuilderHeader'
import { ChatPanel } from './ChatPanel'
import { FoundryConsole, type FoundryTab } from './FoundryConsole'
import type { AddSourceKind } from './sourceKinds'
import { UploadFileDialog } from './UploadFileDialog'
import { useAttachTables } from './useAttachTables'
import { useBuilderChat } from './useBuilderChat'
import { useWidgetSelection } from './useWidgetSelection'
import { WidgetEditor } from './WidgetEditor'
import { WorkflowOutputDialog } from './WorkflowOutputDialog'

/** Builder V1: data sources are added inline from the canvas, with Foundry in a bottom drawer. Modeled on the Databricks Genie dashboard composer. */
type DashboardBuilderProps = {
  dashboard: Dashboard
  badge?: ReactNode
  /** Viewers get the canvas only: no toolbar, chat or widget editor. */
  readOnly?: boolean
  onOpenHistory?: () => void
}

export function DashboardBuilder({ dashboard, badge, readOnly = false, onOpenHistory }: DashboardBuilderProps) {
  const { addWidgets, updateWidget } = useDashboards()
  const chat = useBuilderChat(dashboard)
  const widgets = dashboard.widgets ?? []
  const { selected, setSelectedId } = useWidgetSelection(widgets)
  const { sources, attachedTables, attach } = useAttachTables(dashboard)
  const [foundryTab, setFoundryTab] = useState<FoundryTab | null>(null)
  const [sourceDialog, setSourceDialog] = useState<Exclude<AddSourceKind, 'foundry'> | null>(null)

  const add = (item: CanvasItem) => addWidgets(dashboard.id, [item])
  const openSource = (kind: AddSourceKind) => {
    switch (kind) {
      case 'foundry':
        setFoundryTab('tables')
        return
      case 'workflow':
      case 'upload':
        setSourceDialog(kind)
        return
      default: {
        const unhandled: never = kind
        return unhandled
      }
    }
  }
  const attachAndClose = (tables: DataObject[], name: string) => {
    attach(tables, name)
    setSourceDialog(null)
  }

  return (
    <div className="flex min-h-0 flex-1">
      <div className="relative flex min-w-0 flex-1 flex-col">
        <BuilderHeader dashboard={dashboard} badge={badge} readOnly={readOnly} />
        <BuilderCanvas
          dashboard={dashboard}
          readOnly={readOnly}
          onOpenHistory={onOpenHistory}
          chat={chat}
          selectedId={selected?.id ?? null}
          onSelect={setSelectedId}
          sources={sources}
          onAdd={add}
          onAddSource={openSource}
          drawer={
            foundryTab && (
              <FoundryConsole
                tab={foundryTab}
                onTabChange={setFoundryTab}
                sources={sources.map(({ object }) => object)}
                onAttach={attach}
                onAdd={add}
                onClose={() => setFoundryTab(null)}
              />
            )
          }
        />
      </div>

      <WorkflowOutputDialog open={sourceDialog === 'workflow'} attached={attachedTables} onClose={() => setSourceDialog(null)} onAttach={attachAndClose} />
      <UploadFileDialog open={sourceDialog === 'upload'} onClose={() => setSourceDialog(null)} onAttach={attachAndClose} />

      {readOnly ? null : selected ? (
        <WidgetEditor
          item={selected}
          sources={sources.map(({ object }) => object)}
          onChange={(item) => updateWidget(dashboard.id, item)}
          onClose={() => setSelectedId(null)}
        />
      ) : (
        chat.chatOpen && <ChatPanel messages={chat.messages} thinking={chat.thinking} onSend={chat.send} onClose={() => chat.setChatOpen(false)} />
      )}
    </div>
  )
}
