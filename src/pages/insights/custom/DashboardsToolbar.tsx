import { Archive, LayoutGrid, List, ListFilter, Plus, X } from 'lucide-react'
import { FilterBuilder, type FilterField, type FilterValues } from '../../../ui/FilterBuilder'
import { Popover } from '../../../ui/Popover'
import { ToolbarButton } from '../../../ui/ToolbarButton'
import { ViewToggle } from '../../../ui/ViewToggle'
import type { DashboardSort } from './dashboardQuery'
import { DashboardsSortMenu } from './DashboardsSortMenu'
import { ToolbarSearch } from './ToolbarSearch'
import type { DashboardsView } from './useDashboardListState'

const VIEW_OPTIONS: { id: DashboardsView; label: string; Icon: typeof List }[] = [
  { id: 'grid', label: 'Grid view', Icon: LayoutGrid },
  { id: 'table', label: 'Table view', Icon: List },
]

type DashboardsToolbarProps = {
  fields: FilterField[]
  filters: FilterValues
  sort: DashboardSort
  archived: boolean
  search: string
  view: DashboardsView
  onFiltersChange: (values: FilterValues) => void
  onSortChange: (sort: DashboardSort) => void
  onArchivedChange: (archived: boolean) => void
  onSearchChange: (value: string) => void
  onViewChange: (view: DashboardsView) => void
  onCreate: () => void
}

export function DashboardsToolbar(props: DashboardsToolbarProps) {
  const activeFields = props.fields.filter((field) => props.filters[field.key]?.length)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-0.5 border-b border-white/15 pb-1">
          <Popover
            trigger={({ open, toggle }) => (
              <ToolbarButton Icon={ListFilter} active={open || activeFields.length > 0} aria-expanded={open} onClick={toggle}>
                Filter
                {activeFields.length > 0 && <span className="rounded bg-white/15 px-1 text-[11px] tabular-nums">{activeFields.length}</span>}
              </ToolbarButton>
            )}
          >
            <FilterBuilder fields={props.fields} values={props.filters} onChange={props.onFiltersChange} />
          </Popover>
          <DashboardsSortMenu sort={props.sort} onChange={props.onSortChange} />
          <ToolbarButton Icon={Archive} active={props.archived} aria-pressed={props.archived} onClick={() => props.onArchivedChange(!props.archived)}>
            Archived
          </ToolbarButton>
          <ToolbarSearch value={props.search} onChange={props.onSearchChange} placeholder="Search by name, description, or tag" />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ViewToggle ariaLabel="Dashboard layout" options={VIEW_OPTIONS} value={props.view} onChange={props.onViewChange} />
          <button
            type="button"
            onClick={props.onCreate}
            className="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-medium text-black hover:bg-white/85"
          >
            <Plus className="size-3.5" />
            Create
          </button>
        </div>
      </div>

      {activeFields.length > 0 && (
        <div role="group" aria-label="Applied filters" className="flex flex-wrap items-center gap-2">
          {activeFields.map((field) => {
            const labels = (props.filters[field.key] ?? []).map((value) => field.options.find((option) => option.value === value)?.label ?? value)
            const label = `${field.label}: ${labels.join(', ')}`
            return (
              <button
                key={field.key}
                type="button"
                aria-label={`Remove filter: ${label}`}
                onClick={() => props.onFiltersChange({ ...props.filters, [field.key]: [] })}
                className="flex h-7 max-w-80 cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 text-xs text-white/80 hover:bg-white/10"
              >
                <span className="truncate">{label}</span>
                <X className="size-3.5 shrink-0" />
              </button>
            )
          })}
          <button type="button" onClick={() => props.onFiltersChange({})} className="h-7 cursor-pointer rounded-lg px-2 text-xs text-white/60 hover:bg-white/10 hover:text-white">
            Clear filters
          </button>
        </div>
      )}
    </div>
  )
}
