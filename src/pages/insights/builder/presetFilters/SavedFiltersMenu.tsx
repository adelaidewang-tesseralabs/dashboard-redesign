import { useState } from 'react'
import { Bookmark, Plus } from 'lucide-react'
import type { SavedFilter } from '../../../../data/dashboards'
import { cn } from '../../../../lib/cn'
import { Button } from '../../../../ui/Button'
import { Popover } from '../../../../ui/Popover'
import { EditorCheckbox, editorInputClass } from '../EditorFields'
import { filterChipClass } from '../FilterChip'
import { SavedFilterRow, type SavedFilterActions, type SavedFilterState } from './SavedFilterRow'

type SavedFiltersMenuProps = {
  /** The person's own saved filters, then ones others shared. */
  savedFilters: SavedFilter[]
  onApply: (savedFilter: SavedFilter) => void
  onSave: (name: string, shared: boolean) => void
  actionsFor: (savedFilter: SavedFilter) => SavedFilterActions | undefined
  stateOf: (savedFilter: SavedFilter) => SavedFilterState
  /** False until the person has picked a filter value. */
  canSave: boolean
  /** Set when the dashboard has several pages, since a saved filter holds the current page's picks. */
  pageName?: string
}

/** Named filter picks anyone can save for themselves, and share with everyone on the dashboard. */
export function SavedFiltersMenu({ savedFilters, onApply, onSave, actionsFor, stateOf, canSave, pageName }: SavedFiltersMenuProps) {
  const [naming, setNaming] = useState(false)
  const [name, setName] = useState('')
  const [shared, setShared] = useState(false)
  const stopNaming = () => {
    setNaming(false)
    setName('')
    setShared(false)
  }
  const own = savedFilters.filter((savedFilter) => stateOf(savedFilter).own)
  const others = savedFilters.filter((savedFilter) => !stateOf(savedFilter).own)
  const groups = [
    { title: 'Yours', entries: own },
    { title: 'Shared with everyone', entries: others },
  ].filter((group) => group.entries.length > 0)

  return (
    <Popover
      trigger={({ open, toggle }) => (
        <button type="button" aria-expanded={open} onClick={toggle} className={cn(filterChipClass, open && 'border-[var(--dash-faint)]')}>
          <Bookmark className="size-3.5 opacity-70" aria-hidden />
          Saved filters
          {savedFilters.length > 0 && <span className="rounded-md bg-[var(--dash-canvas)] px-1.5 text-[11px] tabular-nums">{savedFilters.length}</span>}
        </button>
      )}
      contentClassName="w-72 p-1"
    >
      {(close) => (
        <div className="flex flex-col text-sm">
          {savedFilters.length === 0 && <p className="px-2 py-1.5 text-xs text-white/50">Save your current filters to reuse them.</p>}
          {groups.map((group) => (
            <div key={group.title} className="flex flex-col">
              {others.length > 0 && <p className="px-2 pt-1.5 pb-0.5 text-[11px] text-white/45">{group.title}</p>}
              {group.entries.map((savedFilter) => (
                <SavedFilterRow
                  key={savedFilter.id}
                  savedFilter={savedFilter}
                  state={stateOf(savedFilter)}
                  actions={actionsFor(savedFilter)}
                  onApply={() => {
                    onApply(savedFilter)
                    close()
                  }}
                />
              ))}
            </div>
          ))}
          <div className="my-1 h-px bg-white/10" />
          {naming ? (
            <form
              className="flex flex-col gap-2 p-1"
              onSubmit={(event) => {
                event.preventDefault()
                if (!name.trim()) return
                onSave(name.trim(), shared)
                stopNaming()
                close()
              }}
            >
              <input autoFocus aria-label="Saved filter name" value={name} placeholder="e.g. EMEA, last quarter" onChange={(event) => setName(event.target.value)} className={editorInputClass} />
              <EditorCheckbox label="Share with everyone who has access to this dashboard" checked={shared} onChange={setShared} />
              {pageName && <p className="text-[11px] text-white/45">Saves the filters on {pageName}.</p>}
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
            <button
              type="button"
              disabled={!canSave}
              onClick={() => setNaming(true)}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-white/80 hover:bg-white/10 hover:text-white disabled:cursor-default disabled:text-white/40 disabled:hover:bg-transparent"
            >
              <Plus className="size-3.5" aria-hidden />
              <span className="flex flex-col">
                Save current filters
                {!canSave && <span className="text-[11px]">Pick some filters first</span>}
              </span>
            </button>
          )}
        </div>
      )}
    </Popover>
  )
}
