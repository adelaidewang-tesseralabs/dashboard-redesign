import { useState } from 'react'
import type { Dashboard, FieldRef } from '../../../data/dashboards'
import { useDashboards } from '../../../data/DashboardsStore'
import { AddFilterPicker } from './AddFilterPicker'
import { filterColumns, findFilterColumn, linkedFields } from './dashboardFilters'
import { FilterChip } from './FilterChip'
import { FilterReachNote } from './FilterReachNote'
import { FilterSettingsDialog } from './FilterSettingsDialog'
import { LinkFieldDialog } from './LinkFieldDialog'

type FilterBarProps = {
  dashboard: Dashboard
  /** Editors add, configure and remove filters and set everyone's default values; viewers change only their own values. */
  canEdit: boolean
  adding: boolean
  onAddingChange: (adding: boolean) => void
  onValuesChange: (filterId: string, values: string[]) => void
  /** Viewers only, when their values differ from the defaults. */
  onResetPersonal?: () => void
}

type Linking = { from: FieldRef; datasetKey: string }

export function FilterBar({ dashboard, canEdit, adding, onAddingChange, onValuesChange, onResetPersonal }: FilterBarProps) {
  const { addFilter, updateFilter, removeFilter, addFieldLink } = useDashboards()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [linking, setLinking] = useState<Linking | null>(null)
  const filters = dashboard.filters ?? []
  if (filters.length === 0 && !adding) return null
  const columns = filterColumns(dashboard)
  const editing = canEdit ? filters.find((filter) => filter.id === editingId) : undefined

  return (
    <div role="toolbar" aria-label="Page filters" className="flex flex-wrap items-center gap-2 px-5 pt-5">
      {canEdit && filters.length > 0 && <span className="text-xs text-[var(--dash-muted)]">Defaults for everyone</span>}
      {filters.map((filter) => (
        <FilterChip
          key={filter.id}
          filter={filter}
          column={findFilterColumn(columns, filter)}
          readOnly={!canEdit && filter.locked}
          note={
            <FilterReachNote
              dashboard={dashboard}
              filter={filter}
              columns={columns}
              onLink={canEdit ? (datasetKey) => setLinking({ from: { datasetKey: filter.datasetKey, column: filter.column }, datasetKey }) : undefined}
            />
          }
          onValuesChange={(values) => onValuesChange(filter.id, values)}
          onEdit={canEdit ? () => setEditingId(filter.id) : undefined}
          onRemove={canEdit ? () => removeFilter(dashboard.id, filter.id) : undefined}
        />
      ))}
      {canEdit && (
        <AddFilterPicker
          open={adding}
          onOpenChange={onAddingChange}
          columns={columns}
          existing={filters}
          onPick={(column) =>
            addFilter(dashboard.id, { id: crypto.randomUUID(), datasetKey: column.datasetKey, column: column.column, label: column.label, values: [] })
          }
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
      {editing && (
        <FilterSettingsDialog
          dashboard={dashboard}
          filter={editing}
          columns={columns}
          onClose={() => setEditingId(null)}
          onSave={(filter) => {
            updateFilter(dashboard.id, filter)
            setEditingId(null)
          }}
        />
      )}
      {linking && (
        <LinkFieldDialog
          from={linking.from}
          datasetKey={linking.datasetKey}
          columns={columns}
          linked={linkedFields(dashboard, linking.from)}
          onClose={() => setLinking(null)}
          onLink={(link) => {
            addFieldLink(dashboard.id, link)
            setLinking(null)
          }}
        />
      )}
    </div>
  )
}
