import { useState, type ReactNode } from 'react'
import { Pencil, Trash2, Users } from 'lucide-react'
import type { SavedFilter } from '../../../../data/dashboards'
import { cn } from '../../../../lib/cn'
import { nameOf } from '../../../../lib/people'
import { editorInputClass } from '../EditorFields'

export type SavedFilterActions = {
  onRename: (name: string) => void
  onShareChange: (shared: boolean) => void
  onDelete: () => void
}

type SavedFilterRowProps = {
  savedFilter: SavedFilter
  onApply: () => void
  /** Only the creator can rename, share or delete. */
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

export function SavedFilterRow({ savedFilter, onApply, actions }: SavedFilterRowProps) {
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(savedFilter.name)

  if (renaming && actions)
    return (
      <form
        className="p-1"
        onSubmit={(event) => {
          event.preventDefault()
          if (name.trim()) actions.onRename(name.trim())
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

  return (
    <div className="group/saved flex items-center rounded-md hover:bg-white/10">
      <button type="button" onClick={onApply} className="flex min-w-0 flex-1 cursor-pointer flex-col px-2 py-1.5 text-left">
        <span className="truncate">{savedFilter.name}</span>
        {!actions && <span className="truncate text-[11px] text-white/45">Shared by {nameOf(savedFilter.createdBy)}</span>}
      </button>
      {actions && (
        <span className="mr-1 flex items-center">
          <RowAction
            label={savedFilter.shared ? 'Shared with everyone · Stop sharing' : 'Share with everyone'}
            pinned={savedFilter.shared}
            onClick={() => actions.onShareChange(!savedFilter.shared)}
          >
            <Users className="size-3.5" />
          </RowAction>
          <RowAction
            label={`Rename ${savedFilter.name}`}
            onClick={() => {
              setName(savedFilter.name)
              setRenaming(true)
            }}
          >
            <Pencil className="size-3.5" />
          </RowAction>
          <RowAction label={`Delete ${savedFilter.name}`} onClick={actions.onDelete}>
            <Trash2 className="size-3.5" />
          </RowAction>
        </span>
      )}
    </div>
  )
}
