import type { ReactNode } from 'react'
import { Check, ChevronDown, Lock, Pin, Settings2, TriangleAlert } from 'lucide-react'
import type { DashboardFilter } from '../../../data/dashboards'
import { cn } from '../../../lib/cn'
import { Popover } from '../../../ui/Popover'
import { menuItemClass, menuSurfaceClass } from '../../../ui/menuStyles'
import type { FilterColumn } from './dashboardFilters'

type FilterChipProps = {
  filter: DashboardFilter
  /** Undefined when the filter's dataset or column is no longer on the dashboard. */
  column: FilterColumn | undefined
  onValuesChange: (values: string[]) => void
  /** Editors only: open the filter's settings. */
  onEdit?: () => void
  onRemove?: () => void
  /** Viewers of a locked filter see its values but can't change them. */
  readOnly?: boolean
  /** Shown above the values, e.g. which graphs the filter reaches. */
  note?: ReactNode
  /** `tinted`: a fixed filter drawn as setup rather than as a control viewers get. */
  appearance?: 'default' | 'tinted'
  /** Replaces the chip button, keeping the same values popover. */
  trigger?: (props: { open: boolean; toggle: () => void }) => ReactNode
}

export const filterChipClass =
  'flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-[var(--dash-border)] bg-[var(--dash-card)] px-2.5 text-xs text-[var(--dash-fg)] hover:border-[var(--dash-faint)]'

export const tintedChipClass = 'border-dashed border-amber-300/35 bg-amber-300/[0.07] text-amber-50 hover:border-amber-300/60'

const footerButtonClass = 'cursor-pointer rounded px-1.5 py-1 text-xs text-white/70 hover:text-white disabled:cursor-default disabled:opacity-40'

function summary(filter: DashboardFilter) {
  if (filter.values.length === 0) return 'All'
  if (filter.values.length === 1) return filter.values[0]
  return `${filter.values.length} selected`
}

/** One dashboard filter: pick any of the values its dataset column contains — one or several, per its settings. */
export function FilterChip({ filter, column, onValuesChange, onEdit, onRemove, readOnly = false, note, appearance = 'default', trigger }: FilterChipProps) {
  const tinted = appearance === 'tinted'
  const single = filter.selection === 'single'
  const toggle = (value: string) => {
    if (filter.values.includes(value)) onValuesChange(filter.values.filter((entry) => entry !== value))
    else onValuesChange(single ? [value] : [...filter.values, value])
  }

  return (
    <Popover
      trigger={
        trigger ??
        (({ open, toggle: toggleOpen }) => (
          <button
            type="button"
            aria-expanded={open}
            onClick={toggleOpen}
            title={column ? `${column.datasetLabel} · ${column.label}` : "This filter's dataset is no longer available"}
            className={cn(filterChipClass, tinted && tintedChipClass, !column && 'border-red-400/40')}
          >
            {!column && <TriangleAlert className="size-3.5 text-red-300" aria-hidden />}
            {column && filter.fixed && <Pin className={cn('size-3', tinted ? 'text-amber-300' : 'text-[var(--dash-muted)]')} aria-label="Fixed, hidden from viewers" />}
            {column && filter.locked && !filter.fixed && <Lock className="size-3 text-[var(--dash-muted)]" aria-label="Locked for viewers" />}
            <span className={tinted ? 'text-amber-100/70' : 'text-[var(--dash-muted)]'}>{filter.label}:</span>
            <span className="max-w-40 truncate font-medium">{column ? summary(filter) : 'Unavailable'}</span>
            {!tinted && <ChevronDown className="size-3 text-[var(--dash-muted)]" aria-hidden />}
          </button>
        ))
      }
      contentClassName={cn(menuSurfaceClass, 'w-72 bg-tlai-3')}
    >
      {(close) => (
        <>
          {note}
          {readOnly && <p className="px-2 pb-1 text-xs text-white/55">Locked by the dashboard editor.</p>}
          {column ? (
            <div role="group" aria-label={filter.label} className="flex max-h-72 flex-col overflow-y-auto">
              {column.values.map((value) => {
                const checked = filter.values.includes(value)
                return (
                  <button
                    key={value}
                    type="button"
                    role={single ? 'menuitemradio' : 'menuitemcheckbox'}
                    aria-checked={checked}
                    aria-disabled={readOnly || undefined}
                    onClick={readOnly ? undefined : () => toggle(value)}
                    className={cn(menuItemClass, 'pr-8', readOnly && 'cursor-default opacity-60 hover:bg-transparent')}
                  >
                    <span
                      className={cn(
                        'flex size-4 shrink-0 items-center justify-center border border-white/30',
                        single ? 'rounded-full' : 'rounded',
                        checked && 'border-white bg-white text-black',
                      )}
                    >
                      {checked && (single ? <span className="size-1.5 rounded-full bg-black" /> : <Check className="size-3" />)}
                    </span>
                    <span className="truncate">{value}</span>
                  </button>
                )
              })}
            </div>
          ) : (
            <p className="px-2 py-1.5 text-xs text-white/60">The dataset this filter used is gone or you no longer have access to it.</p>
          )}
          {!readOnly && (
            <div className="mt-1 flex items-center gap-1 border-t border-white/10 px-1 pt-1.5">
              <button type="button" disabled={filter.values.length === 0} onClick={() => onValuesChange([])} className={footerButtonClass}>
                Show all
              </button>
              {onEdit && (
                <button
                  type="button"
                  onClick={() => {
                    close()
                    onEdit()
                  }}
                  className={cn(footerButtonClass, 'ml-auto flex items-center gap-1')}
                >
                  <Settings2 className="size-3.5" aria-hidden />
                  Edit
                </button>
              )}
              {onRemove && (
                <button type="button" onClick={onRemove} className={cn(footerButtonClass, 'text-red-300 hover:text-red-200', !onEdit && 'ml-auto')}>
                  Remove
                </button>
              )}
            </div>
          )}
        </>
      )}
    </Popover>
  )
}
