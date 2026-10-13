import { ArrowDown, ArrowUp, ArrowUpDown, Check } from 'lucide-react'
import { cn } from '../../../lib/cn'
import { Popover } from '../../../ui/Popover'
import { ToolbarButton } from '../../../ui/ToolbarButton'
import { DEFAULT_SORT, SORT_FIELDS, type DashboardSort, type SortDirection, type SortField } from './dashboardQuery'

const DIRECTION_LABELS: Record<SortField, Record<SortDirection, string>> = {
  updated: { desc: 'Newest first', asc: 'Oldest first' },
  name: { asc: 'A → Z', desc: 'Z → A' },
  score: { desc: 'Highest first', asc: 'Lowest first' },
}

const rowClass = 'flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs text-white/80 hover:bg-white/10 hover:text-white'

type DashboardsSortMenuProps = {
  sort: DashboardSort
  onChange: (sort: DashboardSort) => void
}

export function DashboardsSortMenu({ sort, onChange }: DashboardsSortMenuProps) {
  const isDefault = sort.field === DEFAULT_SORT.field && sort.direction === DEFAULT_SORT.direction
  const directions: SortDirection[] = sort.field === 'name' ? ['asc', 'desc'] : ['desc', 'asc']

  return (
    <Popover
      contentClassName="w-52 p-1"
      trigger={({ open, toggle }) => (
        <ToolbarButton Icon={ArrowUpDown} active={open || !isDefault} aria-expanded={open} onClick={toggle}>
          Sort
        </ToolbarButton>
      )}
    >
      <p className="px-2 pt-1.5 pb-1 text-[11px] text-white/40 uppercase">Sort by</p>
      {SORT_FIELDS.map((field) => (
        <button
          key={field.id}
          type="button"
          aria-pressed={field.id === sort.field}
          onClick={() => onChange({ field: field.id, direction: field.id === 'name' ? 'asc' : 'desc' })}
          className={rowClass}
        >
          <span className="flex-1">{field.label}</span>
          <Check className={cn('size-3.5', field.id !== sort.field && 'opacity-0')} />
        </button>
      ))}
      <div className="my-1 h-px bg-white/10" />
      {directions.map((direction) => (
        <button
          key={direction}
          type="button"
          aria-pressed={direction === sort.direction}
          onClick={() => onChange({ ...sort, direction })}
          className={rowClass}
        >
          {direction === 'asc' ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />}
          <span className="flex-1">{DIRECTION_LABELS[sort.field][direction]}</span>
          <Check className={cn('size-3.5', direction !== sort.direction && 'opacity-0')} />
        </button>
      ))}
    </Popover>
  )
}
