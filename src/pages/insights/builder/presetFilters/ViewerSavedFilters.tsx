import { useState } from 'react'
import { CURRENT_USER, type Dashboard, type DashboardFilter, type SavedFilter } from '../../../../data/dashboards'
import { useDashboards } from '../../../../data/DashboardsStore'
import { dashboardPages } from '../../../../data/pages'
import { useToast } from '../../../../ui/Toast'
import { narrowValues } from './narrowPresets'
import type { SavedFilterActions, SavedFilterState } from './SavedFilterRow'
import { SavedFiltersMenu } from './SavedFiltersMenu'
import { matchesSavedFilter, savedFilterOutdated } from './savedFilterStatus'

type ViewerSavedFiltersProps = {
  /** The whole dashboard, where saved filters live. */
  dashboard: Dashboard
  /** The page's filters the viewer can change, holding their current picks. */
  filters: DashboardFilter[]
  /** Editors' preset values by filter id. */
  presets: Record<string, string[]>
  pageId?: string
  /** Owners and editors, even while previewing: they can delete or stop sharing anyone's shared filter. */
  canManageShared: boolean
  onApplyValues: (values: Record<string, string[]>) => void
}

/** Saved filters, in viewer mode only: each person's own named picks, which they can share with everyone on the dashboard. */
export function ViewerSavedFilters({ dashboard, filters, presets, pageId, canManageShared, onApplyValues }: ViewerSavedFiltersProps) {
  const { addSavedFilter, removeSavedFilter, updateSavedFilter } = useDashboards()
  const toast = useToast()
  const [appliedId, setAppliedId] = useState<string | null>(null)
  const pages = dashboardPages(dashboard)
  const pageName = (id: string | undefined) => pages.find((page) => page.id === id)?.name
  const all = dashboard.savedFilters ?? []
  const savedFilters = [
    ...all.filter((savedFilter) => savedFilter.createdBy === CURRENT_USER),
    ...all.filter((savedFilter) => savedFilter.createdBy !== CURRENT_USER && savedFilter.shared),
  ]
  const picked = filters.filter((filter) => filter.values.length > 0)
  const currentValues = () => Object.fromEntries(picked.map((filter) => [filter.id, filter.values]))
  const currentOperators = () => Object.fromEntries(picked.flatMap((filter) => (filter.operator ? [[filter.id, filter.operator]] : [])))

  const save = (name: string, shared: boolean) => {
    const id = crypto.randomUUID()
    addSavedFilter(dashboard.id, { id, name, createdBy: CURRENT_USER, shared, pageId, values: currentValues(), operators: currentOperators() })
    setAppliedId(id)
  }
  const apply = (savedFilter: SavedFilter) => {
    onApplyValues(Object.fromEntries(filters.map((filter) => [filter.id, savedFilter.values[filter.id] ?? []])))
    setAppliedId(savedFilter.id)
    const narrowed = filters.some((filter) => {
      const saved = savedFilter.values[filter.id]
      return !!saved?.length && narrowValues(filter.operator ?? 'in', presets[filter.id] ?? [], saved).join() !== saved.join()
    })
    if (narrowed) toast(`Some of "${savedFilter.name}" is outside this dashboard's preset filters, so it was narrowed to fit.`)
  }
  const actionsFor = (savedFilter: SavedFilter): SavedFilterActions | undefined => {
    const remove = () => removeSavedFilter(dashboard.id, savedFilter.id)
    if (savedFilter.createdBy === CURRENT_USER)
      return {
        onRename: (name) => updateSavedFilter(dashboard.id, savedFilter.id, { name }),
        onShareChange: (shared) => updateSavedFilter(dashboard.id, savedFilter.id, { shared }),
        onUpdate: () => {
          updateSavedFilter(dashboard.id, savedFilter.id, { values: currentValues(), operators: currentOperators(), pageId })
          setAppliedId(savedFilter.id)
          toast(`Updated "${savedFilter.name}" with your current filters`)
        },
        onDelete: remove,
      }
    if (canManageShared) return { onShareChange: (shared) => updateSavedFilter(dashboard.id, savedFilter.id, { shared }), onDelete: remove }
    return undefined
  }
  const stateOf = (savedFilter: SavedFilter): SavedFilterState => ({
    own: savedFilter.createdBy === CURRENT_USER,
    applied: appliedId !== savedFilter.id ? undefined : matchesSavedFilter(savedFilter, filters) ? 'active' : 'edited',
    outdated: savedFilterOutdated(savedFilter, filters, presets, pageId),
    fromPage: savedFilter.pageId && savedFilter.pageId !== pageId ? pageName(savedFilter.pageId) : undefined,
  })

  return (
    <SavedFiltersMenu
      savedFilters={savedFilters}
      canSave={picked.length > 0}
      pageName={pages.length > 1 ? pageName(pageId) : undefined}
      onApply={apply}
      onSave={save}
      actionsFor={actionsFor}
      stateOf={stateOf}
    />
  )
}
