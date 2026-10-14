import { useState } from 'react'
import { cn } from '../../../../lib/cn'
import type { FilterColumn } from '../dashboardFilters'

type AddFieldPanelProps = {
  /** The dataset's filterable columns that aren't preset yet. */
  columns: FilterColumn[]
  onAdd: (column: FilterColumn, allPages: boolean) => void
}

/** Editors pick a column of the dataset to preset, on this page or every page. */
export function AddFieldPanel({ columns, onAdd }: AddFieldPanelProps) {
  const [allPages, setAllPages] = useState(false)
  return (
    <div className="flex w-full flex-col gap-3 text-left">
      <span className="text-sm font-medium text-white">Add a field</span>
      <div role="radiogroup" aria-label="Applies to" className="grid grid-cols-2 gap-0.5 rounded-md bg-white/5 p-0.5 text-xs">
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
        <p className="text-xs text-white/50">Every field with a short list of values is already here.</p>
      ) : (
        <ul className="flex max-h-48 flex-col gap-0.5 overflow-y-auto">
          {columns.map((column) => (
            <li key={column.column}>
              <button
                type="button"
                onClick={() => onAdd(column, allPages)}
                className="flex min-h-[30px] w-full cursor-pointer items-center justify-between gap-2 rounded px-1.5 text-xs text-white/80 hover:bg-white/10 hover:text-white"
              >
                <span className="truncate">{column.label}</span>
                <span className="shrink-0 text-[11px] text-white/45">{column.values.length} values</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
