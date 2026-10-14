import { useState, type ReactNode } from 'react'
import { Check, Pencil, Save, Trash2, TriangleAlert, Users } from 'lucide-react'
import type { SavedFilter } from '../../../../data/dashboards'
import { cn } from '../../../../lib/cn'
import { nameOf } from '../../../../lib/people'
import { editorInputClass } from '../EditorFields'

/** Creators get every action; owners and editors managing someone else's shared filter get sharing and delete only. */
export type SavedFilterActions = {
  onRename?: (name: string) => void
  onUpdate?: () => void
  onShareChange?: (shared: boolean) => void
  onDelete?: () => void
}

export type SavedFilterState = {
  own: boolean
  /** `active` while the viewer's filters match it since applying or saving it; `edited` once they've changed one. */
  applied?: 'active' | 'edited'
  /** A field it sets is gone for viewers, or its values fall outside the presets. */
  outdated: boolean
  /** Saved on another page, so only shared fields apply here. */
  fromPage?: string
}

type SavedFilterRowProps = {
  savedFilter: SavedFilter
  state: SavedFilterState
  onApply: () => void
  actions?: SavedFilterActions
}

const ACTION_CLASS =
  'flex size-6 cursor-pointer items-center justify-center rounded text-white/45 opacity-0 group-hover/saved:opacity-100 hover:bg-white/10 hover:text-white focus-visible:opacity-100'

/** `pinned`: stays visible without hover, as a status. */
function RowAction({ label, pinned, onClick, children }: { label: string; pinned?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className={cn(ACTION_CLASS, pinned && 'text-white/70 opacity-100')}>
      {children}
    </button>
  )
}

function subtitle(savedFilter: SavedFilter, state: SavedFilterState) {
  return [
    !state.own && `Shared by ${nameOf(savedFilter.createdBy)}`,
    state.fromPage && `From ${state.fromPage}`,
    state.applied === 'edited' && 'Edited since applied',
  ]
    .filter(Boolean)
    .join(' · ')
}

export function SavedFilterRow({ savedFilter, state, onApply, actions }: SavedFilterRowProps) {
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(savedFilter.name)
  const onRename = actions?.onRename

  if (renaming && onRename)
    return (
      <form
        className="p-1"
        onSubmit={(event) => {
          event.preventDefault()
          if (name.trim()) onRename(name.trim())
          setRenaming(false)
        }}
      >
        <input
          autoFocus
          aria-label={`Rename ${savedFilter.name}`}
          value={name}
          onChange={(event) => setName(event.target.value)}
          onBlur={() => setRenaming(false)}
          onKeyDown={(event) => event.key === 'Escape' && (event.stopPropagation(), setRenaming(false))}
          className={editorInputClass}
        />
      </form>
    )

  const details = subtitle(savedFilter, state)
  return (
    <div className="group/saved flex items-center rounded-md hover:bg-white/10">
      <button type="button" onClick={onApply} aria-current={state.applied === 'active' || undefined} className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 px-2 py-1.5 text-left">
        <Check className={cn('size-3.5 shrink-0', state.applied === 'active' ? 'text-tlai-mint' : 'invisible')} aria-hidden />
        <span className="flex min-w-0 flex-col">
          <span className="truncate">{savedFilter.name}</span>
          {details && <span className="truncate text-[11px] text-white/45">{details}</span>}
        </span>
      </button>
      {state.outdated && (
        <span title="Editors changed the preset filters, so some of this no longer applies as saved." className="flex size-6 shrink-0 items-center justify-center text-amber-300">
          <TriangleAlert className="size-3.5" aria-label="Out of date" />
        </span>
      )}
      {actions && (
        <span className="mr-1 flex items-center">
          {actions.onUpdate && (
            <RowAction label="Update with current filters" onClick={actions.onUpdate}>
              <Save className="size-3.5" />
            </RowAction>
          )}
          {actions.onShareChange && (
            <RowAction
              label={savedFilter.shared ? 'Shared with everyone · Stop sharing' : 'Share with everyone'}
              pinned={savedFilter.shared && state.own}
              onClick={() => actions.onShareChange?.(!savedFilter.shared)}
            >
              <Users className="size-3.5" />
            </RowAction>
          )}
          {onRename && (
            <RowAction
              label={`Rename ${savedFilter.name}`}
              onClick={() => {
                setName(savedFilter.name)
                setRenaming(true)
              }}
            >
              <Pencil className="size-3.5" />
            </RowAction>
          )}
          {actions.onDelete && (
            <RowAction label={`Delete ${savedFilter.name}`} onClick={actions.onDelete}>
              <Trash2 className="size-3.5" />
            </RowAction>
          )}
        </span>
      )}
    </div>
  )
}
