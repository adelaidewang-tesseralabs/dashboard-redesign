import { useState } from 'react'
import type { DataObject } from '../../../data/dataSources'
import { FOUNDRY_CATALOG, WORKFLOWS } from '../../../data/externalSources'
import { objectItem, sameSource, type CanvasItem } from '../../../data/widgets'
import { cn } from '../../../lib/cn'
import { menuSurfaceClass } from '../../../ui/menuStyles'
import { OptionRow, SubmenuButton, SubmenuRow } from './AddGraphMenuRows'
import { ORIGIN_META } from './sourceKinds'

export const FOUNDRY_SUBMENU = '__foundry__'
export const WORKFLOWS_SUBMENU = '__workflows__'

type Located = { object: DataObject; hint: string }

const FOUNDRY_TABLES: Located[] = FOUNDRY_CATALOG.flatMap((catalog) =>
  catalog.schemas.flatMap((schema) => schema.tables.map((object) => ({ object, hint: `${catalog.name}.${schema.name}` }))),
)
const WORKFLOW_OUTPUTS: Located[] = WORKFLOWS.flatMap((workflow) => workflow.outputs.map((object) => ({ object, hint: workflow.name })))

type ExternalSourceRowsProps = {
  /** Graphs on every page of the dashboard. */
  widgets: CanvasItem[]
  submenu: string | null
  onOpenSubmenu: (key: string) => void
  side: string
  onPick: (item: CanvasItem) => void
}

/** Final builder's Add graph menu: every Foundry table and workflow output, graphable without adding it as a dataset first. */
export function ExternalSourceRows({ widgets, submenu, onOpenSubmenu, side, onPick }: ExternalSourceRowsProps) {
  const [openTable, setOpenTable] = useState<string | null>(null)
  const graphed = (object: DataObject) => widgets.some((widget) => widget.source === 'object' && widget.objectName === object.name)

  /** The table list scrolls, so each table's fields open beside the whole list rather than inside it, where the scroll would clip them. */
  const tableRows = (tables: Located[]) => {
    const open = tables.find(({ object }) => object.name === openTable)?.object
    return (
      <>
        <div className="-m-2 max-h-72 overflow-y-auto p-2">
          {tables.map(({ object, hint }) => (
            <SubmenuButton key={object.name} label={object.label} hint={hint} bold={graphed(object)} open={openTable === object.name} onOpen={() => setOpenTable(object.name)} />
          ))}
        </div>
        {open && (
          <div role="menu" aria-label={open.label} className={cn(menuSurfaceClass, 'absolute left-full z-50 ml-1.5 w-56', side)}>
            {open.fields.map((field) => {
              const item = objectItem(open.name, field.key)
              return <OptionRow key={field.key} label={`by ${field.label}`} added={widgets.some((widget) => sameSource(widget, item))} onSelect={() => onPick(item)} />
            })}
          </div>
        )}
      </>
    )
  }

  const group = (key: string, origin: 'foundry' | 'workflow', label: string, tables: Located[]) => (
    <SubmenuRow
      label={label}
      Icon={ORIGIN_META[origin].Icon}
      bold={tables.some(({ object }) => graphed(object))}
      open={submenu === key}
      onOpen={() => {
        if (submenu !== key) setOpenTable(null)
        onOpenSubmenu(key)
      }}
      side={side}
    >
      {tableRows(tables)}
    </SubmenuRow>
  )

  return (
    <>
      {group(FOUNDRY_SUBMENU, 'foundry', 'Data Foundry', FOUNDRY_TABLES)}
      {group(WORKFLOWS_SUBMENU, 'workflow', 'Workflows', WORKFLOW_OUTPUTS)}
    </>
  )
}
