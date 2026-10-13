import { CalendarDays, X } from 'lucide-react'
import { DIMENSIONS, PRIORITIES } from '../../../data/dashboardDetail'
import { Menu } from '../../../ui/Menu'

export type OverviewFilters = { range: string; dimension: string; priority: string }

export const DEFAULT_FILTERS: OverviewFilters = { range: 'Last 30 days', dimension: 'All', priority: 'All' }

const RANGES = ['Last 7 days', 'Last 30 days', 'Last 90 days', 'All time']

type FilterBarProps = { filters: OverviewFilters; onChange: (filters: OverviewFilters) => void }

const triggerClass =
  'flex h-8 cursor-pointer items-center gap-2 rounded-md border border-white/10 bg-tlai-3 px-3 text-xs text-white/80 hover:bg-white/10'

/** Global filters row (`dashboard/filters/FilterBar`): date + select filters applied to every graph. */
export function FilterBar({ filters, onChange }: FilterBarProps) {
  const dirty =
    filters.dimension !== DEFAULT_FILTERS.dimension ||
    filters.priority !== DEFAULT_FILTERS.priority ||
    filters.range !== DEFAULT_FILTERS.range

  const select = (key: keyof OverviewFilters, label: string, options: readonly string[]) => (
    <Menu
      align="start"
      trigger={({ toggle }) => (
        <button type="button" className={triggerClass} onClick={toggle}>
          <span className="text-white/45">{label}</span>
          {filters[key]}
        </button>
      )}
      items={options.map((option) => ({
        label: option,
        active: option === filters[key],
        onSelect: () => onChange({ ...filters, [key]: option }),
      }))}
    />
  )

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-tlai-3 p-2">
      <Menu
        align="start"
        trigger={({ toggle }) => (
          <button type="button" className={triggerClass} onClick={toggle}>
            <CalendarDays className="size-3.5 text-white/50" />
            {filters.range}
          </button>
        )}
        items={RANGES.map((range) => ({
          label: range,
          active: range === filters.range,
          onSelect: () => onChange({ ...filters, range }),
        }))}
      />
      {select('dimension', 'Dimension', ['All', ...DIMENSIONS])}
      {select('priority', 'Priority', ['All', ...PRIORITIES])}
      {dirty && (
        <button
          type="button"
          onClick={() => onChange(DEFAULT_FILTERS)}
          className="flex h-8 cursor-pointer items-center gap-1 rounded-md px-2 text-xs text-white/50 hover:text-white"
        >
          <X className="size-3.5" />
          Clear
        </button>
      )}
    </div>
  )
}
