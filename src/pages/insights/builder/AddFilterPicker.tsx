import { useEffect, useRef } from 'react'
import { Plus } from 'lucide-react'
import type { DashboardFilter } from '../../../data/dashboards'
import { cn } from '../../../lib/cn'
import { menuGroupLabelClass, menuItemClass, menuSurfaceClass } from '../../../ui/menuStyles'
import type { FilterColumn } from './dashboardFilters'
import { filterChipClass } from './FilterChip'

type AddFilterPickerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  columns: FilterColumn[]
  existing: DashboardFilter[]
  onPick: (column: FilterColumn) => void
}

/** Filters can only be built on a dataset column already on the dashboard; controlled so the toolbar's filter tool can open it. */
export function AddFilterPicker({ open, onOpenChange, columns, existing, onPick }: AddFilterPickerProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) onOpenChange(false)
    }
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onOpenChange(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onOpenChange])

  const used = (column: FilterColumn) => existing.some((filter) => filter.datasetKey === column.datasetKey && filter.column === column.column)

  return (
    <div ref={rootRef} className="relative">
      <button type="button" aria-expanded={open} onClick={() => onOpenChange(!open)} className={cn(filterChipClass, 'border-dashed text-[var(--dash-muted)]')}>
        <Plus className="size-3.5" aria-hidden />
        Add filter
      </button>
      {open && (
        <div role="menu" aria-label="Add filter" className={cn(menuSurfaceClass, 'absolute top-full left-0 z-40 mt-2 max-h-80 w-64 overflow-y-auto bg-tlai-3')}>
          {columns.length === 0 ? (
            <p className="px-2 py-1.5 text-xs text-white/60">Add a dataset first. Filters use columns from this dashboard's datasets.</p>
          ) : (
            columns.map((column, index) => (
              <div key={`${column.datasetKey}:${column.column}`}>
                {column.datasetKey !== columns[index - 1]?.datasetKey && (
                  <div className={cn(menuGroupLabelClass, index > 0 && 'mt-1')}>{column.datasetLabel}</div>
                )}
                <button
                  type="button"
                  role="menuitem"
                  disabled={used(column)}
                  onClick={() => {
                    onPick(column)
                    onOpenChange(false)
                  }}
                  className={cn(menuItemClass, 'justify-between disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent')}
                >
                  <span className="truncate">{column.label}</span>
                  <span className="shrink-0 text-[11px] text-white/45">{used(column) ? 'Added' : `${column.values.length} values`}</span>
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
