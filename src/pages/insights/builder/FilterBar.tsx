import { useState, type ReactNode } from 'react'
import type { Dashboard, DashboardFilter, FieldRef } from '../../../data/dashboards'
import { useDashboards } from '../../../data/DashboardsStore'
import { AddFilterPicker } from './AddFilterPicker'
import { filterColumns, findFilterColumn, fixedValuesFor, linkedFields } from './dashboardFilters'
import { FilterChip } from './FilterChip'
import { FilterReachNote } from './FilterReachNote'
import { FilterSettingsDialog } from './FilterSettingsDialog'
import { LinkFieldDialog } from './LinkFieldDialog'

/** `viewer` filters are controls people can change; `fixed` ones shape the graphs and stay hidden from viewers. */
export type FilterKind = 'viewer' | 'fixed'

type FilterBarProps = {
  dashboard: Dashboard
  /** Editors add, configure and remove filters and set everyone's default values; viewers change only their own values. */
  canEdit: boolean
  adding: FilterKind | null
  onAddingChange: (adding: FilterKind | null) => void
  onValuesChange: (filterId: string, values: string[]) => void
  /** Viewers only, when their values differ from the defaults. */
  onResetPersonal?: () => void
}

type Linking = { from: FieldRef; datasetKey: string }

export function FilterBar({ dashboard, canEdit, adding, onAddingChange, onValuesChange, onResetPersonal }: FilterBarProps) {
  const { dashboards, addFilter, updateFilter, removeFilter, addFieldLink } = useDashboards()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [linking, setLinking] = useState<Linking | null>(null)
  const filters = dashboard.filters ?? []
  const fixed = canEdit ? filters.filter((filter) => filter.fixed) : []
  const viewer = filters.filter((filter) => !filter.fixed)
  if (fixed.length === 0 && viewer.length === 0 && !adding) return null
  // `dashboard` holds one page's graphs; an all-pages filter needs its column on pages whose graphs don't use it.
  const columns = filterColumns(dashboards.find((entry) => entry.id === dashboard.id) ?? dashboard)
  const editing = canEdit ? filters.find((filter) => filter.id === editingId) : undefined

  const chip = (filter: DashboardFilter) => {
    const column = findFilterColumn(columns, filter)
    const cap = filter.fixed ? undefined : fixedValuesFor(dashboard, filter)
    return (
      <FilterChip
        key={filter.id}
        filter={filter}
        column={column && cap ? { ...column, values: column.values.filter((value) => cap.includes(value)) } : column}
        readOnly={!canEdit && filter.locked}
        note={
          <>
            {cap && canEdit && <p className="px-2 pb-1 text-xs text-white/55">Only values the fixed filter keeps.</p>}
            <FilterReachNote
              dashboard={dashboard}
              filter={filter}
              columns={columns}
              onLink={canEdit ? (datasetKey) => setLinking({ from: { datasetKey: filter.datasetKey, column: filter.column }, datasetKey }) : undefined}
            />
          </>
        }
        onValuesChange={(values) => onValuesChange(filter.id, values)}
        onEdit={canEdit ? () => setEditingId(filter.id) : undefined}
        onRemove={canEdit ? () => removeFilter(dashboard.id, filter.id) : undefined}
      />
    )
  }
  const picker = (kind: FilterKind) => (
    <AddFilterPicker
      label={kind === 'fixed' ? 'Add fixed filter' : 'Add filter'}
      open={adding === kind}
      onOpenChange={(open) => onAddingChange(open ? kind : null)}
      columns={columns}
      existing={kind === 'fixed' ? fixed : viewer}
      onPick={(column, allPages) =>
        addFilter(dashboard.id, {
          id: crypto.randomUUID(),
          datasetKey: column.datasetKey,
          column: column.column,
          label: column.label,
          values: [],
          fixed: kind === 'fixed' || undefined,
          allPages: allPages || undefined,
        })
      }
    />
  )

  return (
    <div role="toolbar" aria-label="Page filters" className="flex flex-col gap-2 px-5 pt-5">
      {(fixed.length > 0 || adding === 'fixed') && (
        <FilterRow label="Fixed · viewers don't see these">
          {fixed.map(chip)}
          {picker('fixed')}
        </FilterRow>
      )}
      {(viewer.length > 0 || adding === 'viewer') && (
        <FilterRow label={canEdit ? 'Defaults for everyone' : undefined}>
          {viewer.map(chip)}
          {canEdit && picker('viewer')}
          {onResetPersonal && (
            <span className="ml-auto flex items-center gap-2 text-xs text-[var(--dash-muted)]">
              Your view
              <button type="button" onClick={onResetPersonal} className="cursor-pointer rounded px-1.5 py-1 text-[var(--dash-fg)] hover:bg-[var(--dash-card)]">
                Reset to default
              </button>
            </span>
          )}
        </FilterRow>
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

function FilterRow({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {label && <span className="text-xs text-[var(--dash-muted)]">{label}</span>}
      {children}
    </div>
  )
}
