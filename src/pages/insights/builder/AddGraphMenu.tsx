import { useEffect, useRef, useState, type ReactNode } from 'react'
import { FileCode2, Plus, Sparkles } from 'lucide-react'
import type { SqlDataset } from '../../../data/dashboards'
import { DATA_OBJECTS, type DataObject } from '../../../data/dataSources'
import { objectItem, sameSource, sqlDatasetItem, type CanvasItem } from '../../../data/widgets'
import { cn } from '../../../lib/cn'
import { menuSurfaceClass } from '../../../ui/menuStyles'
import { ActionRow, OptionRow, SectionLabel, SubmenuRow } from './AddGraphMenuRows'
import { ExternalSourceRows } from './ExternalSourceRows'
import { ADD_SOURCE_KINDS, ORIGIN_META, SourceIcon, type AddSourceKind } from './sourceKinds'

type AddGraphMenuProps = {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode
  /** Items already on the canvas — checked in the submenus, and their objects shown in bold. */
  widgets: CanvasItem[]
  /** Foundry tables, workflow outputs and uploads attached to the dashboard, with their data source names. */
  sources: { object: DataObject; label: string }[]
  /** Saved SQL datasets (builder V2); each adds a bar chart of its result. */
  queries?: SqlDataset[]
  sourcesLabel?: string
  /** Lists the dashboard's own datasets above the Mosaic objects. */
  datasetsFirst?: boolean
  /** Builder V3: only the datasets already on this dashboard, plus an "Add dataset" submenu of the production source dialogs. */
  datasetsOnly?: boolean
  /** Final builder: graph any Mosaic object, Foundry table or workflow output straight away, with Add dataset last. `widgets` then spans every page. */
  catalog?: boolean
  onAdd: (item: CanvasItem) => void
  onAddSource: (kind: AddSourceKind) => void
  /** Replaces the per-kind "Add data source" entries with one row that opens a combined dialog. */
  onOpenAddSource?: () => void
  /** Omit where the chat composer is already on screen. */
  onAskAi?: () => void
  /** `right`: beside the trigger, top-aligned, for a vertical rail. */
  side?: 'top' | 'bottom' | 'right'
  align?: 'start' | 'center'
}

const ADD_DATASET = '__add-dataset__'

/** Pick-data entry point, modeled on the main app's dataviz "+ Add graph": one submenu per object listing its charts. */
export function AddGraphMenu(props: AddGraphMenuProps) {
  const { trigger, widgets, sources, queries = [], sourcesLabel = 'Dashboard sources', datasetsFirst = false, datasetsOnly = false, catalog = false, onAdd, onAddSource, onOpenAddSource, onAskAi, side = 'top', align = 'start' } = props
  const [open, setOpen] = useState(false)
  const [submenu, setSubmenu] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const select = (action: () => void) => {
    setOpen(false)
    setSubmenu(null)
    action()
  }
  const isUsed = (item: CanvasItem) => widgets.some((widget) => sameSource(widget, item))
  const submenuSide = side === 'top' ? 'bottom-0' : 'top-0'
  const renderObject = (object: DataObject, label: string) => (
    <SubmenuRow
      key={object.name}
      label={label}
      Icon={object.origin && object.origin !== 'mosaic' ? ORIGIN_META[object.origin].Icon : undefined}
      bold={widgets.some((widget) => widget.source === 'object' && widget.objectName === object.name)}
      open={submenu === object.name}
      onOpen={() => setSubmenu(object.name)}
      side={submenuSide}
    >
      {object.fields.map((field) => {
        const item = objectItem(object.name, field.key)
        return <OptionRow key={field.key} label={`by ${field.label}`} added={isUsed(item)} onSelect={() => select(() => onAdd(item))} />
      })}
    </SubmenuRow>
  )

  const queryRows = queries.map((dataset) => (
    <ActionRow
      key={dataset.id}
      icon={<FileCode2 className="size-4 shrink-0 text-white/60" />}
      label={dataset.label}
      onHover={() => setSubmenu(null)}
      onSelect={() => select(() => onAdd(sqlDatasetItem(dataset)))}
    />
  ))
  const datasetsSection = sources.length + queries.length > 0 && (
    <>
      <SectionLabel>{sourcesLabel}</SectionLabel>
      {sources.map(({ object, label }) => renderObject(object, label))}
      {queryRows}
    </>
  )
  const addDatasetRow = onOpenAddSource ? (
    <ActionRow icon={<Plus className="size-4 text-white/60" />} label="Add dataset…" onHover={() => setSubmenu(null)} onSelect={() => select(onOpenAddSource)} />
  ) : (
    <SubmenuRow label="Add dataset" Icon={Plus} bold={false} open={submenu === ADD_DATASET} onOpen={() => setSubmenu(ADD_DATASET)} side={submenuSide}>
      {ADD_SOURCE_KINDS.map((kind) => (
        <ActionRow key={kind} icon={<SourceIcon origin={kind} />} label={ORIGIN_META[kind].label} onHover={() => undefined} onSelect={() => select(() => onAddSource(kind))} />
      ))}
    </SubmenuRow>
  )

  const catalogItems = (
    <>
      {DATA_OBJECTS.map((object) => renderObject(object, object.label))}
      {sources.filter(({ object }) => object.origin === 'upload').map(({ object, label }) => renderObject(object, label))}
      {queryRows}
      <ExternalSourceRows widgets={widgets} submenu={submenu} onOpenSubmenu={setSubmenu} side={submenuSide} onPick={(item) => select(() => onAdd(item))} />
      <div className="my-1 h-px bg-white/10" />
      {addDatasetRow}
    </>
  )

  return (
    <div ref={rootRef} className="relative">
      {trigger({ open, toggle: () => setOpen((current) => !current) })}
      {open && (
        <div
          role="menu"
          aria-label="Add graph"
          className={cn(
            menuSurfaceClass,
            'absolute z-40 w-60',
            side === 'right' && 'top-0 left-full ml-2',
            side === 'top' && 'bottom-full mb-2',
            side === 'bottom' && 'top-full mt-2',
            side !== 'right' && (align === 'start' ? 'left-0' : 'left-1/2 -translate-x-1/2'),
          )}
        >
          {catalog ? (
            catalogItems
          ) : datasetsOnly ? (
            <>
              {datasetsSection || <p className="px-2.5 py-2 text-xs text-white/45">No datasets on this dashboard yet</p>}
              <div className="my-1 h-px bg-white/10" />
              {addDatasetRow}
            </>
          ) : (
            <>
              {datasetsFirst && datasetsSection}
              <SectionLabel>Objects</SectionLabel>
              {DATA_OBJECTS.map((object) => renderObject(object, object.label))}

              {!datasetsFirst && datasetsSection}

              <div className="my-1 h-px bg-white/10" />
              {onOpenAddSource ? (
                <ActionRow icon={<Plus className="size-4 text-white/60" />} label="Add dataset…" onHover={() => setSubmenu(null)} onSelect={() => select(onOpenAddSource)} />
              ) : (
                <>
                  <SectionLabel>Add data source</SectionLabel>
                  {ADD_SOURCE_KINDS.map((kind) => (
                    <ActionRow
                      key={kind}
                      icon={<SourceIcon origin={kind} />}
                      label={ORIGIN_META[kind].label}
                      onHover={() => setSubmenu(null)}
                      onSelect={() => select(() => onAddSource(kind))}
                    />
                  ))}
                </>
              )}
              {onAskAi && (
                <>
                  <div className="my-1 h-px bg-white/10" />
                  <ActionRow
                    icon={<Sparkles className="size-4 text-tlai-mint" />}
                    label="Ask AI"
                    onHover={() => setSubmenu(null)}
                    onSelect={() => select(onAskAi)}
                  />
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
