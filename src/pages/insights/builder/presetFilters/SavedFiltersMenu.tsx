import { useState } from 'react'
import { Bookmark, Plus, Trash2 } from 'lucide-react'
import type { SavedFilter } from '../../../../data/dashboards'
import { cn } from '../../../../lib/cn'
import { Button } from '../../../../ui/Button'
import { Popover } from '../../../../ui/Popover'
import { editorInputClass } from '../EditorFields'
import { filterChipClass } from '../FilterChip'

type SavedFiltersMenuProps = {
  savedFilters: SavedFilter[]
  onApply: (savedFilter: SavedFilter) => void
  /** Owners and editors only: save the current picks under a name, or delete one. */
  onSave?: (name: string) => void
  onDelete?: (savedFilterId: string) => void
}

/** Named filter picks editors save on the dashboard; everyone, viewers included, can apply them. */
export function SavedFiltersMenu({ savedFilters, onApply, onSave, onDelete }: SavedFiltersMenuProps) {
  const [naming, setNaming] = useState(false)
  const [name, setName] = useState('')
  const stopNaming = () => {
    setNaming(false)
    setName('')
  }

  return (
    <Popover
      trigger={({ open, toggle }) => (
        <button type="button" aria-expanded={open} onClick={toggle} className={cn(filterChipClass, open && 'border-[var(--dash-faint)]')}>
          <Bookmark className="size-3.5 opacity-70" aria-hidden />
          Saved filters
          {savedFilters.length > 0 && <span className="rounded-md bg-[var(--dash-canvas)] px-1.5 text-[11px] tabular-nums">{savedFilters.length}</span>}
        </button>
      )}
      contentClassName="w-64 p-1"
    >
      {(close) => (
        <div className="flex flex-col text-sm">
          {savedFilters.length === 0 && <p className="px-2 py-1.5 text-xs text-white/50">{onSave ? 'Save the picks below so viewers can apply them in one click.' : 'No saved filters yet.'}</p>}
          {savedFilters.map((savedFilter) => (
            <div key={savedFilter.id} className="group/saved flex items-center rounded-md hover:bg-white/10">
              <button
                type="button"
                onClick={() => {
                  onApply(savedFilter)
                  close()
                }}
                className="min-w-0 flex-1 cursor-pointer truncate px-2 py-1.5 text-left"
              >
                {savedFilter.name}
              </button>
              {onDelete && (
                <button
                  type="button"
                  aria-label={`Delete ${savedFilter.name}`}
                  onClick={() => onDelete(savedFilter.id)}
                  className="mr-1 flex size-6 cursor-pointer items-center justify-center rounded text-white/45 opacity-0 group-hover/saved:opacity-100 hover:bg-white/10 hover:text-white focus-visible:opacity-100"
                >
                  <Trash2 className="size-3.5" />
                </button>
              )}
            </div>
          ))}
          {onSave && <div className="my-1 h-px bg-white/10" />}
          {onSave &&
            (naming ? (
              <form
                className="flex flex-col gap-2 p-1"
                onSubmit={(event) => {
                  event.preventDefault()
                  if (!name.trim()) return
                  onSave(name.trim())
                  stopNaming()
                  close()
                }}
              >
                <input autoFocus aria-label="Saved filter name" value={name} placeholder="e.g. EMEA, last quarter" onChange={(event) => setName(event.target.value)} className={editorInputClass} />
                <div className="flex justify-end gap-1">
                  <Button type="button" variant="ghost" size="sm" onClick={stopNaming}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={!name.trim()}>
                    Save
                  </Button>
                </div>
              </form>
            ) : (
              <button type="button" onClick={() => setNaming(true)} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-white/80 hover:bg-white/10 hover:text-white">
                <Plus className="size-3.5" aria-hidden />
                Save current filters
              </button>
            ))}
        </div>
      )}
    </Popover>
  )
}
