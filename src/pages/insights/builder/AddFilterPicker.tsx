import { useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import type { DashboardFilter } from '../../../data/dashboards'
import { cn } from '../../../lib/cn'
import { menuGroupLabelClass, menuItemClass, menuSurfaceClass } from '../../../ui/menuStyles'
import type { FilterColumn } from './dashboardFilters'
import { filterChipClass, tintedChipClass } from './FilterChip'

type AddFilterPickerProps = {
  label?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  columns: FilterColumn[]
  existing: DashboardFilter[]
  onPick: (column: FilterColumn, allPages: boolean) => void
  /** `link`: plain text, so it doesn't read as a filter control; `tinted`: matches tinted fixed chips. */
  variant?: 'chip' | 'link' | 'tinted'
}

const TRIGGER_CLASSES = {
  chip: cn(filterChipClass, 'border-dashed text-[var(--dash-muted)]'),
  tinted: cn(filterChipClass, tintedChipClass, 'text-amber-100/70'),
  link: 'flex h-7 cursor-pointer items-center gap-1 rounded px-1.5 text-xs text-[var(--dash-muted)] hover:text-[var(--dash-fg)]',
}

/** Filters can only be built on a dataset column already on the dashboard; controlled so the toolbar's filter tool can open it. */
export function AddFilterPicker({ label = 'Add filter', open, onOpenChange, columns, existing, onPick, variant = 'chip' }: AddFilterPickerProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [allPages, setAllPages] = useState(false)

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
      <button type="button" aria-expanded={open} onClick={() => onOpenChange(!open)} className={TRIGGER_CLASSES[variant]}>
        <Plus className="size-3.5" aria-hidden />
        {label}
      </button>
      {open && (
        <div role="menu" aria-label={label} className={cn(menuSurfaceClass, 'absolute top-full left-0 z-40 mt-2 max-h-80 w-64 overflow-y-auto bg-tlai-3')}>
          <div role="radiogroup" aria-label="Applies to" className="mb-1 grid grid-cols-2 gap-0.5 rounded-md bg-white/5 p-0.5 text-xs">
            {[false, true].map((option) => (
              <button
                key={String(option)}
                type="button"
                role="radio"
                aria-checked={allPages === option}
                onClick={() => setAllPages(option)}
                className={cn('h-6 cursor-pointer rounded text-white/55 hover:text-white', allPages === option && 'bg-white/10 text-white')}
              >
                {option ? 'All pages' : 'This page'}
              </button>
            ))}
          </div>
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
                    onPick(column, allPages)
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
