import { useEffect, useState } from 'react'
import { CURRENT_USER, isPageCopy, type Dashboard, type DashboardFilter, type PresetOperator, type SavedFilter } from '../../../../data/dashboards'
import { useDashboards } from '../../../../data/DashboardsStore'
import { useToast } from '../../../../ui/Toast'
import { itemDatasetKey, listDatasets } from '../v2/datasets'
import { DatasetFilterBuilder } from './DatasetFilterBuilder'
import { DatasetFilterButton } from './DatasetFilterButton'
import { presetFields, type PresetField } from './presetFields'
import { SavedFiltersMenu } from './SavedFiltersMenu'

type PresetFilterBarProps = {
  /** One page, with this person's own picks applied for viewers. */
  dashboard: Dashboard
  /** Editors set everyone's defaults and manage saved filters; viewers only pick their own values on preset fields. */
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
  const { dashboards, addFilter, updateFilter, setFilterAllPages, undo, addSavedFilter, removeSavedFilter } = useDashboards()
  const toast = useToast()
  const [openKey, setOpenKey] = useState<string | null>(null)
  const full = dashboards.find((entry) => entry.id === dashboard.id) ?? dashboard
  // All pages' graphs: a filter on every page needs its field even where this page's graphs don't use it.
  const fields = presetFields(full)
  const filters = (dashboard.filters ?? []).filter((filter) => !filter.fixed)
  // Editors' defaults decide what's preset, so a viewer clearing their own pick keeps the field.
  const isPreset = (filter: DashboardFilter) => (full.filters?.find((entry) => entry.id === filter.id)?.values.length ?? 0) > 0
  const presets = filters.filter(isPreset)
  const onPage = new Set((dashboard.widgets ?? []).map(itemDatasetKey))
  const datasets = listDatasets(full).filter((dataset) =>
    canEdit ? onPage.has(dataset.key) && fields.some((field) => field.datasetKey === dataset.key) : presets.some((filter) => filter.datasetKey === dataset.key),
  )
  const savedFilters = full.savedFilters ?? []

  useEffect(() => {
    if (!opening) return
    setOpenKey(datasets[0]?.key ?? null)
    onOpened()
  }, [opening, datasets, onOpened])

  if (datasets.length === 0 && (canEdit || savedFilters.length === 0)) return null

  const save = (name: string) =>
    addSavedFilter(dashboard.id, {
      id: crypto.randomUUID(),
      name,
      createdBy: CURRENT_USER,
      values: Object.fromEntries(presets.map((filter) => [filter.id, filter.values])),
      operators: Object.fromEntries(presets.flatMap((filter) => (filter.operator ? [[filter.id, filter.operator]] : []))),
    })
  const changeAllPages = (filterId: string, allPages: boolean) => {
    const filter = full.filters?.find((entry) => entry.id === filterId)
    const replaced = allPages && filter ? (full.filters ?? []).filter((entry) => isPageCopy(entry, filter)).length : 0
    setFilterAllPages(dashboard.id, filterId, allPages)
    if (filter && replaced > 0)
      toast(`${filter.label} is on all pages. Replaced its filter on ${replaced === 1 ? '1 other page' : `${replaced} other pages`}.`, {
        label: 'Undo',
        onSelect: () => undo(dashboard.id),
      })
  }
  const changeOperator = (filter: DashboardFilter, operator: PresetOperator) => {
    const stored = full.filters?.find((entry) => entry.id === filter.id)
    if (stored) updateFilter(dashboard.id, { ...stored, operator })
  }
  const changeValues = (field: PresetField, filter: DashboardFilter | undefined, values: string[], operator: PresetOperator) => {
    if (filter) return onValuesChange(filter.id, values)
    if (canEdit && values.length > 0)
      addFilter(dashboard.id, { id: crypto.randomUUID(), datasetKey: field.datasetKey, column: field.column, label: field.label, values, operator })
  }
  const apply = (savedFilter: SavedFilter) => {
    if (canEdit)
      for (const filter of presets) {
        const operator = savedFilter.operators?.[filter.id]
        if (operator && operator !== filter.operator) changeOperator(filter, operator)
      }
    onApplyValues(Object.fromEntries(filters.filter((filter) => canEdit || (isPreset(filter) && !filter.locked)).map((filter) => [filter.id, savedFilter.values[filter.id] ?? []])))
  }

  return (
    <div role="toolbar" aria-label="Preset filters" className="flex flex-wrap items-center gap-2 px-5 pt-5">
      {canEdit && <span className="text-xs text-[var(--dash-muted)]">Preset filters for viewers</span>}
      {datasets.map((dataset) => {
        const own = filters.filter((filter) => filter.datasetKey === dataset.key)
        const ownFields = fields.filter(
          (field) => field.datasetKey === dataset.key && (canEdit || presets.some((filter) => filter.datasetKey === dataset.key && filter.column === field.column)),
        )
        return (
          <DatasetFilterButton
            key={dataset.key}
            label={dataset.label}
            activeCount={own.filter((filter) => filter.values.length > 0).length}
            open={openKey === dataset.key}
            onOpenChange={(open) => setOpenKey(open ? dataset.key : null)}
          >
            <DatasetFilterBuilder
              fields={ownFields}
              filters={own}
              canEdit={canEdit}
              onValuesChange={changeValues}
              onOperatorChange={canEdit ? changeOperator : undefined}
              onClearAll={() => onApplyValues(Object.fromEntries(own.filter((filter) => canEdit || (isPreset(filter) && !filter.locked)).map((filter) => [filter.id, []])))}
              onAllPagesChange={canEdit ? changeAllPages : undefined}
              datasetLabel={dataset.label}
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
