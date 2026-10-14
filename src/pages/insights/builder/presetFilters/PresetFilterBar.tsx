import { useState } from 'react'
import { isPageCopy, type Dashboard, type DashboardFilter, type PresetOperator } from '../../../../data/dashboards'
import { useDashboards } from '../../../../data/DashboardsStore'
import { useToast } from '../../../../ui/Toast'
import { itemDatasetKey, listDatasets } from '../v2/datasets'
import { DatasetFilterBuilder } from './DatasetFilterBuilder'
import { DatasetFilterButton } from './DatasetFilterButton'
import { presetFields, type PresetField } from './presetFields'
import { ViewerSavedFilters } from './ViewerSavedFilters'

type PresetFilterBarProps = {
  /** One page, with this person's own picks applied for viewers. */
  dashboard: Dashboard
  /** Editors set everyone's presets; viewers narrow them and keep saved filters. */
  canEdit: boolean
  /** The viewer's own picks, before they're clamped to the presets. */
  personalValues: Record<string, string[]>
  onValuesChange: (filterId: string, values: string[]) => void
  /** Sets several filters at once (Clear All, a saved filter). */
  onApplyValues: (values: Record<string, string[]>) => void
  onResetPersonal?: () => void
  pageId?: string
  /** Whose saved filters show: the signed-in person, or whoever the prototype stands in for. */
  viewer: string
  /** Owners and editors, even while previewing: they can delete or stop sharing anyone's shared saved filter. */
  canManageShared?: boolean
}

/** Final builder's filter row: one Olivier-style filter button per dataset, then saved filters. Replaces fixed and viewer filters. */
export function PresetFilterBar({ dashboard, canEdit, personalValues, onValuesChange, onApplyValues, onResetPersonal, pageId, canManageShared = false, viewer }: PresetFilterBarProps) {
  const { dashboards, addFilter, updateFilter, setFilterAllPages, undo } = useDashboards()
  const toast = useToast()
  const [openKey, setOpenKey] = useState<string | null>(null)
  const full = dashboards.find((entry) => entry.id === dashboard.id) ?? dashboard
  // All pages' graphs: a filter on every page needs its field even where this page's graphs don't use it.
  const fields = presetFields(full)
  const filters = (dashboard.filters ?? []).filter((filter) => !filter.fixed)
  const presetValues = Object.fromEntries((full.filters ?? []).map((filter) => [filter.id, filter.values]))
  const onPage = new Set((dashboard.widgets ?? []).map(itemDatasetKey))
  const datasets = listDatasets(full).filter((dataset) =>
    canEdit ? onPage.has(dataset.key) && fields.some((field) => field.datasetKey === dataset.key) : filters.some((filter) => filter.datasetKey === dataset.key),
  )
  const viewerOwns = (filter: DashboardFilter) => canEdit || !filter.locked

  if (datasets.length === 0) return null

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
  return (
    <div role="toolbar" aria-label="Preset filters" className="flex flex-wrap items-center gap-2 px-5 pt-5">
      {canEdit && <span className="text-xs text-[var(--dash-muted)]">Preset filters for viewers</span>}
      {datasets.map((dataset) => {
        const own = filters.filter((filter) => filter.datasetKey === dataset.key)
        const ownFields = fields.filter(
          (field) => field.datasetKey === dataset.key && (canEdit || own.some((filter) => filter.column === field.column)),
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
              viewer={canEdit ? undefined : { presets: presetValues, picks: personalValues }}
              onValuesChange={changeValues}
              onOperatorChange={canEdit ? changeOperator : undefined}
              onClearAll={() => onApplyValues(Object.fromEntries(own.filter(viewerOwns).map((filter) => [filter.id, []])))}
              onAllPagesChange={canEdit ? changeAllPages : undefined}
              datasetLabel={dataset.label}
            />
          </DatasetFilterButton>
        )
      })}
      {!canEdit && (
        <ViewerSavedFilters
          dashboard={full}
          filters={filters.filter(viewerOwns)}
          presets={presetValues}
          pageId={pageId}
          viewer={viewer}
          canManageShared={canManageShared}
          onApplyValues={onApplyValues}
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
