import type { Dashboard } from '../../../data/dashboards'
import { useDashboards } from '../../../data/DashboardsStore'
import { findObject, type DataObject } from '../../../data/dataSources'
import { objectItem } from '../../../data/widgets'
import { useToast } from '../../../ui/Toast'

/** The dashboard's attached lake tables, resolved, and an action that attaches more with a first graph each. */
export function useAttachTables(dashboard: Dashboard) {
  const { addSources, addWidgets } = useDashboards()
  const toast = useToast()
  const sources = (dashboard.sources ?? []).flatMap((source) => {
    const object = findObject(source.table)
    return object ? [{ object, label: source.label }] : []
  })

  /** Attaches tables as dashboard sources and drops a first graph for each, grouped by its first field. */
  const attach = (tables: DataObject[], name: string) => {
    if (tables.length === 0) return
    const label = (table: DataObject) => (tables.length === 1 && name) || table.label
    addSources(dashboard.id, tables.map((table) => ({ table: table.name, label: label(table) })))
    addWidgets(
      dashboard.id,
      tables.map((table) => {
        const field = table.fields[0]
        return { ...objectItem(table.name, field.key), title: `${label(table)} by ${field.label}` }
      }),
    )
    toast(tables.length === 1 ? `Added ${label(tables[0])} as a source` : `Added ${tables.length} sources`)
  }

  return { sources, attachedTables: new Set(sources.map(({ object }) => object.name)), attach }
}
