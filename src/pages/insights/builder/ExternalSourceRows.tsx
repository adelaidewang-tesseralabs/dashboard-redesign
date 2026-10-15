import { useState } from 'react'
import type { DataObject } from '../../../data/dataSources'
import type { Dashboard } from '../../../data/dashboards'
import { useDashboards } from '../../../data/DashboardsStore'
import { FOUNDRY_CATALOG, WORKFLOWS, type PublishedDataset } from '../../../data/externalSources'
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

/** Datasets published from dashboards first, hinted with the dashboard they came from. */
function foundryTables(published: PublishedDataset[], dashboards: Dashboard[]): Located[] {
  const fromDashboards = published.map((entry) => ({
    object: entry.table,
    hint: `Dashboards · ${dashboards.find((dashboard) => dashboard.id === entry.dashboardId)?.name ?? entry.dashboardName}`,
  }))
  return [...fromDashboards, ...FOUNDRY_TABLES]
}
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
  const { dashboards, published } = useDashboards()
  /** `top`: the hovered row's offset in the submenu, so the fields line up with it. */
  const [openTable, setOpenTable] = useState<{ name: string; top: number } | null>(null)
  const graphed = (object: DataObject) => widgets.some((widget) => widget.source === 'object' && widget.objectName === object.name)
  // offsetTop ignores scrolling, so subtract the list's scroll; less the panel padding, so the first field sits level with the row.
  const openBeside = (name: string, row: HTMLElement) => setOpenTable({ name, top: row.offsetTop - (row.parentElement?.scrollTop ?? 0) - 8 })

  /** The table list scrolls, so each table's fields open beside the list rather than inside it, where the scroll would clip them. */
  const tableRows = (tables: Located[]) => {
    const open = tables.find(({ object }) => object.name === openTable?.name)?.object
    return (
      <>
        <div className="-m-2 max-h-72 overflow-y-auto p-2" onScroll={() => setOpenTable(null)}>
          {tables.map(({ object, hint }) => (
            <div
              key={object.name}
              onMouseEnter={(event) => openBeside(object.name, event.currentTarget)}
              onFocus={(event) => openBeside(object.name, event.currentTarget)}
            >
              <SubmenuButton label={object.label} hint={hint} bold={graphed(object)} open={openTable?.name === object.name} onOpen={() => undefined} />
            </div>
          ))}
        </div>
        {open && openTable && (
          <div role="menu" aria-label={open.label} style={{ top: openTable.top }} className={cn(menuSurfaceClass, 'absolute left-full z-50 ml-1.5 w-56')}>
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
      {group(FOUNDRY_SUBMENU, 'foundry', 'Data Foundry', foundryTables(published, dashboards))}
      {group(WORKFLOWS_SUBMENU, 'workflow', 'Workflows', WORKFLOW_OUTPUTS)}
    </>
  )
}
