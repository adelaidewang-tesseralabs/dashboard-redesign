import { useEffect, useState } from 'react'
import { CURRENT_USER, type Dashboard, type SavedFilter } from '../../../../data/dashboards'
import { useDashboards } from '../../../../data/DashboardsStore'
import { filterColumns } from '../dashboardFilters'
import { itemDatasetKey, listDatasets } from '../v2/datasets'
import { DatasetFilterBuilder } from './DatasetFilterBuilder'
import { DatasetFilterButton } from './DatasetFilterButton'
import { SavedFiltersMenu } from './SavedFiltersMenu'

type PresetFilterBarProps = {
  /** One page, with this person's own picks applied for viewers. */
  dashboard: Dashboard
  /** Editors set everyone's defaults and manage fields and saved filters; viewers only pick their own values. */
  canEdit: boolean
  /** The toolbar's filter tool was clicked. */
  opening: boolean
  onOpened: () => void
  onValuesChange: (filterId: string, values: string[]) => void
  /** Sets several filters at once (Clear All, a saved filter). */
  onApplyValues: (values: Record<string, string[]>) => void
  onResetPersonal?: () => void
}

/** Final builder's filter row: one Olivier-style filter button per dataset, then saved filters. Replaces fixed and viewer filters. */
export function PresetFilterBar({ dashboard, canEdit, opening, onOpened, onValuesChange, onApplyValues, onResetPersonal }: PresetFilterBarProps) {
  const { dashboards, addFilter, removeFilter, addSavedFilter, removeSavedFilter } = useDashboards()
  const [openKey, setOpenKey] = useState<string | null>(null)
  const [startAdding, setStartAdding] = useState(false)
  const full = dashboards.find((entry) => entry.id === dashboard.id) ?? dashboard
  // All pages' graphs: a filter on every page needs its column even where this page's graphs don't use it.
  const columns = filterColumns(full)
  const presets = (dashboard.filters ?? []).filter((filter) => !filter.fixed)
  const onPage = new Set((dashboard.widgets ?? []).map(itemDatasetKey))
  const datasets = listDatasets(full).filter((dataset) =>
    canEdit ? onPage.has(dataset.key) && columns.some((column) => column.datasetKey === dataset.key) : presets.some((filter) => filter.datasetKey === dataset.key),
  )
  const savedFilters = full.savedFilters ?? []

  useEffect(() => {
    if (!opening) return
    setOpenKey(datasets[0]?.key ?? null)
    setStartAdding(true)
    onOpened()
  }, [opening, datasets, onOpened])

  if (datasets.length === 0 && (canEdit || savedFilters.length === 0)) return null

  const save = (name: string) =>
    addSavedFilter(dashboard.id, { id: crypto.randomUUID(), name, createdBy: CURRENT_USER, values: Object.fromEntries(presets.map((filter) => [filter.id, filter.values])) })
  const apply = (savedFilter: SavedFilter) =>
    onApplyValues(Object.fromEntries(presets.filter((filter) => canEdit || !filter.locked).map((filter) => [filter.id, savedFilter.values[filter.id] ?? []])))

  return (
    <div role="toolbar" aria-label="Preset filters" className="flex flex-wrap items-center gap-2 px-5 pt-5">
      {canEdit && <span className="text-xs text-[var(--dash-muted)]">Preset filters for viewers</span>}
      {datasets.map((dataset) => {
        const own = presets.filter((filter) => filter.datasetKey === dataset.key)
        return (
          <DatasetFilterButton
            key={dataset.key}
            label={dataset.label}
            activeCount={own.filter((filter) => filter.values.length > 0).length}
            open={openKey === dataset.key}
            onOpenChange={(open) => {
              setOpenKey(open ? dataset.key : null)
              if (!open) setStartAdding(false)
            }}
          >
            <DatasetFilterBuilder
              presets={own}
              columns={columns.filter((column) => column.datasetKey === dataset.key)}
              canEdit={canEdit}
              startAdding={startAdding}
              onValuesChange={onValuesChange}
              onClearAll={() => onApplyValues(Object.fromEntries(own.filter((filter) => canEdit || !filter.locked).map((filter) => [filter.id, []])))}
              onAdd={
                canEdit
                  ? (column, allPages) => {
                      const id = crypto.randomUUID()
                      addFilter(dashboard.id, { id, datasetKey: column.datasetKey, column: column.column, label: column.label, values: [], allPages: allPages || undefined })
                      return id
                    }
                  : undefined
              }
              onRemove={canEdit ? (filterId) => removeFilter(dashboard.id, filterId) : undefined}
            />
          </DatasetFilterButton>
        )
      })}
      {(canEdit ? presets.length > 0 : savedFilters.length > 0) && (
        <SavedFiltersMenu
          savedFilters={savedFilters}
          onApply={apply}
          onSave={canEdit ? save : undefined}
          onDelete={canEdit ? (savedFilterId) => removeSavedFilter(dashboard.id, savedFilterId) : undefined}
        />
      )}
      {onResetPersonal && (
        <span className="ml-auto flex items-center gap-2 text-xs text-[var(--dash-muted)]">
          Your view
          <button type="button" onClick={onResetPersonal} className="cursor-pointer rounded px-1.5 py-1 text-[var(--dash-fg)] hover:bg-[var(--dash-card)]">
            Reset to default
          </button>
        </span>
      )}
    </div>
  )
}
