import { useState } from 'react'
import type { Dashboard, DashboardFilter, SavedFilter } from '../../../../data/dashboards'
import { useDashboards } from '../../../../data/DashboardsStore'
import { dashboardPages } from '../../../../data/pages'
import { useToast } from '../../../../ui/Toast'
import { presetFields } from './presetFields'
import type { SavedFilterActions, SavedFilterState } from './SavedFilterRow'
import { SavedFiltersMenu } from './SavedFiltersMenu'
import { appliedValues, matchesSavedFilter, savedFilterOutdated } from './savedFilterStatus'

type ViewerSavedFiltersProps = {
  /** The whole dashboard, where saved filters live. */
  dashboard: Dashboard
  /** The page's filters the viewer can change, holding their current picks. */
  filters: DashboardFilter[]
  /** Editors' preset values by filter id. */
  presets: Record<string, string[]>
  pageId?: string
  /** Whose saved filters these are: the signed-in person, or whoever the prototype stands in for. */
  viewer: string
  /** Owners and editors, even while previewing: they can delete or stop sharing anyone's shared filter. */
  canManageShared: boolean
  onApplyValues: (values: Record<string, string[]>) => void
}

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

/** Saved filters, in viewer mode only: each person's own named picks, which they can share with everyone on the dashboard. */
export function ViewerSavedFilters({ dashboard, filters, presets, pageId, viewer, canManageShared, onApplyValues }: ViewerSavedFiltersProps) {
  const { addSavedFilter, removeSavedFilter, updateSavedFilter } = useDashboards()
  const toast = useToast()
  const [appliedId, setAppliedId] = useState<string | null>(null)
  const pages = dashboardPages(dashboard)
  const pageName = (id: string | undefined) => pages.find((page) => page.id === id)?.name
  const savedFilters = (dashboard.savedFilters ?? []).filter((savedFilter) => savedFilter.createdBy === viewer || savedFilter.shared)
  const picked = filters.filter((filter) => filter.values.length > 0)
  const currentValues = () => Object.fromEntries(picked.map((filter) => [filter.id, filter.values]))
  const currentOperators = () => Object.fromEntries(picked.flatMap((filter) => (filter.operator ? [[filter.id, filter.operator]] : [])))
  const fields = presetFields(dashboard)
  const labelOf = (filterId: string) => {
    const stored = dashboard.filters?.find((filter) => filter.id === filterId)
    if (stored) return stored.label
    const open = fields.find((field) => filterId === `open:${field.datasetKey}:${field.column}`)
    return open?.label ?? 'A field'
  }
  const nameTaken = (name: string, exceptId?: string) =>
    savedFilters.some((savedFilter) => savedFilter.createdBy === viewer && savedFilter.id !== exceptId && sameName(savedFilter.name, name))

  const save = (name: string, shared: boolean) => {
    const id = crypto.randomUUID()
    addSavedFilter(dashboard.id, { id, name, createdBy: viewer, shared, pageId, values: currentValues(), operators: currentOperators() })
    setAppliedId(id)
  }
  const apply = (savedFilter: SavedFilter) => {
    onApplyValues(Object.fromEntries(filters.map((filter) => [filter.id, savedFilter.values[filter.id] ?? []])))
    setAppliedId(savedFilter.id)
    const narrowed = filters.some((filter) => {
      const saved = savedFilter.values[filter.id] ?? []
      return saved.some((value) => !appliedValues(savedFilter, filter, presets).includes(value))
    })
    const elsewhere = savedFilter.pageId && savedFilter.pageId !== pageId ? pageName(savedFilter.pageId) : undefined
    if (narrowed) toast(`Some of "${savedFilter.name}" is outside this dashboard's preset filters, so it was narrowed to fit.`)
    else if (elsewhere) toast(`"${savedFilter.name}" was saved on ${elsewhere}. Applied the filters that exist on ${pageName(pageId) ?? 'this page'}.`)
  }
  const remove = (savedFilter: SavedFilter) => {
    removeSavedFilter(dashboard.id, savedFilter.id)
    if (appliedId === savedFilter.id) setAppliedId(null)
    toast(`Deleted "${savedFilter.name}"`, { label: 'Undo', onSelect: () => addSavedFilter(dashboard.id, savedFilter) })
  }
  const setShared = (savedFilter: SavedFilter, shared: boolean) => {
    updateSavedFilter(dashboard.id, savedFilter.id, { shared })
    const message = shared
      ? `Shared "${savedFilter.name}" with everyone who has access to this dashboard`
      : savedFilter.createdBy === viewer
        ? `Stopped sharing "${savedFilter.name}". Only you can see it now.`
        : `Stopped sharing "${savedFilter.name}". It's private to its creator now.`
    toast(message, { label: 'Undo', onSelect: () => updateSavedFilter(dashboard.id, savedFilter.id, { shared: !shared }) })
  }
  const actionsFor = (savedFilter: SavedFilter): SavedFilterActions | undefined => {
    if (savedFilter.createdBy === viewer)
      return {
        onRename: (name) => updateSavedFilter(dashboard.id, savedFilter.id, { name }),
        ...(savedFilter.shared ? { onStopSharing: () => setShared(savedFilter, false) } : { onShare: () => setShared(savedFilter, true) }),
        onUpdate: () => {
          updateSavedFilter(dashboard.id, savedFilter.id, { values: currentValues(), operators: currentOperators(), pageId })
          setAppliedId(savedFilter.id)
          toast(`Updated "${savedFilter.name}" with your current filters`)
        },
        onDelete: () => remove(savedFilter),
      }
    if (canManageShared && savedFilter.shared)
      return {
        onStopSharing: () => setShared(savedFilter, false),
        onDelete: () => remove(savedFilter),
      }
    return undefined
  }
  const stateOf = (savedFilter: SavedFilter): SavedFilterState => ({
    own: savedFilter.createdBy === viewer,
    applied: appliedId !== savedFilter.id ? undefined : matchesSavedFilter(savedFilter, filters, presets) ? 'active' : 'edited',
    outdated: savedFilterOutdated(savedFilter, filters, presets, pageId, labelOf),
    fromPage: savedFilter.pageId && savedFilter.pageId !== pageId ? pageName(savedFilter.pageId) : undefined,
  })

  return (
    <SavedFiltersMenu
      savedFilters={savedFilters}
      canSave={picked.some((filter) => filter.values.join() !== (presets[filter.id] ?? []).join())}
      pageName={pages.length > 1 ? pageName(pageId) : undefined}
      onApply={apply}
      onSave={save}
      nameTaken={nameTaken}
      actionsFor={actionsFor}
      stateOf={stateOf}
    />
  )
}
