import { useState } from 'react'
import { Lock, Search, Trash2 } from 'lucide-react'
import type { DashboardFilter } from '../../../../data/dashboards'
import { EditorCheckbox } from '../EditorFields'
import type { FilterColumn } from '../dashboardFilters'

type FieldValuePanelProps = {
  filter: DashboardFilter
  column: FilterColumn | undefined
  /** Viewers can't change a locked filter. */
  readOnly: boolean
  onValuesChange: (values: string[]) => void
  /** Editors only. */
  onRemove?: () => void
  /** Editors only: show the filter on every page, or only the open one. */
  onAllPagesChange?: (allPages: boolean) => void
  datasetLabel: string
}

/** Right side of the filter builder: search and tick the values one field keeps. */
export function FieldValuePanel({ filter, column, readOnly, onValuesChange, onRemove, onAllPagesChange, datasetLabel }: FieldValuePanelProps) {
  const [query, setQuery] = useState('')
  const values = column?.values ?? []
  const shown = values.filter((value) => value.toLowerCase().includes(query.trim().toLowerCase()))
  const toggle = (value: string, checked: boolean) => {
    if (filter.selection === 'single') return onValuesChange(checked ? [value] : [])
    onValuesChange(checked ? [...filter.values, value] : filter.values.filter((entry) => entry !== value))
  }

  return (
    <div className="flex min-h-0 w-full flex-col gap-3 text-left">
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">{filter.label}</span>
        {onRemove && (
          <button type="button" aria-label={`Remove ${filter.label}`} title="Remove field" onClick={onRemove} className="flex size-6 cursor-pointer items-center justify-center rounded text-white/50 hover:bg-white/10 hover:text-white">
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>
      {!column ? (
        <p className="text-xs text-white/50">This field is no longer in the dataset.</p>
      ) : (
        <>
          <label className="flex h-8 items-center gap-2 rounded-md border border-white/15 bg-white/[0.03] px-2.5 text-xs focus-within:border-white/30">
            <Search className="size-3.5 shrink-0 text-white/45" aria-hidden />
            <input
              aria-label={`Search ${filter.label}`}
              value={query}
              placeholder={`Search ${filter.label}`}
              onChange={(event) => setQuery(event.target.value)}
              className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-white/40"
            />
          </label>
          {readOnly && (
            <p className="flex items-center gap-1.5 text-xs text-white/50">
              <Lock className="size-3" aria-hidden />
              Set by the dashboard's editors
            </p>
          )}
          <div className="flex max-h-48 flex-col gap-2 overflow-y-auto pb-2">
            {shown.length === 0 && <p className="text-xs text-white/45">No values match.</p>}
            {shown.map((value) =>
              readOnly ? (
                <span key={value} className="text-sm text-white/60">
                  {filter.values.includes(value) ? '✓ ' : ''}
                  {value}
                </span>
              ) : (
                <EditorCheckbox key={value} label={value} checked={filter.values.includes(value)} onChange={(checked) => toggle(value, checked)} />
              ),
            )}
          </div>
        </>
      )}
      {onAllPagesChange && (
        <div className="flex flex-col gap-1 border-t border-white/10 pt-3">
          <EditorCheckbox label="Apply to all pages" checked={!!filter.allPages} onChange={onAllPagesChange} />
          {filter.allPages && <p className="pl-6 text-[11px] text-white/45">Applies to {datasetLabel} graphs on every page.</p>}
        </div>
      )}
    </div>
  )
}
