import { useState, type ReactNode } from 'react'
import { Check, Pencil, Trash2, TriangleAlert, Users, UserX } from 'lucide-react'
import type { SavedFilter } from '../../../../data/dashboards'
import { cn } from '../../../../lib/cn'
import { nameOf } from '../../../../lib/people'
import { SavedFilterForm } from './SavedFilterForm'

/** Creators get every action; owners and editors managing someone else's shared filter can stop sharing or delete it. */
export type SavedFilterActions = {
  onRename?: (name: string) => void
  onUpdate?: () => void
  onShare?: () => void
  onStopSharing?: () => void
  onDelete?: () => void
}

export type SavedFilterState = {
  own: boolean
  /** `active` while the viewer's filters match it since applying or saving it; `edited` once they've changed one. */
  applied?: 'active' | 'edited'
  /** Why it no longer applies as saved: a field it sets is gone, or its values fall outside the presets. */
  outdated?: string
  /** Saved on another page, so only shared fields apply here. */
  fromPage?: string
}

type SavedFilterRowProps = {
  savedFilter: SavedFilter
  state: SavedFilterState
  onApply: () => void
  actions?: SavedFilterActions
  nameTaken: (name: string, exceptId?: string) => boolean
}

function RowAction({ label, name, onClick, children }: { label: string; name: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={`${label} ${name}`}
      title={label}
      onClick={onClick}
      className="flex size-6 cursor-pointer items-center justify-center rounded text-white/45 opacity-0 group-hover/saved:opacity-100 hover:bg-white/10 hover:text-white focus-visible:opacity-100"
    >
      {children}
    </button>
  )
}

function subtitle(savedFilter: SavedFilter, state: SavedFilterState) {
  return [
    savedFilter.shared && (state.own ? 'By you' : `By ${nameOf(savedFilter.createdBy)}`),
    state.fromPage && `From ${state.fromPage}`,
    state.applied === 'edited' && 'Edited since applied',
  ]
    .filter(Boolean)
    .join(' · ')
}

export function SavedFilterRow({ savedFilter, state, onApply, actions, nameTaken }: SavedFilterRowProps) {
  const [editing, setEditing] = useState(false)
  const onRename = actions?.onRename

  if (editing && onRename)
    return (
      <SavedFilterForm
        initialName={savedFilter.name}
        submitLabel="Save"
        nameTaken={(name) => nameTaken(name, savedFilter.id)}
        onSubmit={({ name }) => {
          onRename(name)
          setEditing(false)
        }}
        onCancel={() => setEditing(false)}
      />
    )

  const details = subtitle(savedFilter, state)
  const canUpdate = actions?.onUpdate && (state.applied === 'edited' || (state.applied === 'active' && state.outdated))
  return (
    <div className="group/saved flex items-center rounded-md hover:bg-white/10">
      <button type="button" onClick={onApply} aria-current={state.applied === 'active' || undefined} className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 px-2 py-1.5 text-left">
        <Check className={cn('size-3.5 shrink-0', state.applied === 'active' ? 'text-tlai-mint' : 'invisible')} aria-hidden />
        <span className="flex min-w-0 flex-col">
          <span className="truncate">{savedFilter.name}</span>
          {details && <span className="truncate text-[11px] text-white/45">{details}</span>}
          {state.outdated && (
            <span className="flex items-start gap-1 text-[11px] text-amber-300">
              <TriangleAlert className="mt-px size-3 shrink-0" aria-hidden />
              <span>Out of date: {state.outdated}</span>
            </span>
          )}
        </span>
      </button>
      {actions && (
        <span className="mr-1 flex shrink-0 items-center">
          {canUpdate && (
            <button
              type="button"
              title="Save your current filters to it"
              onClick={actions.onUpdate}
              className="h-6 cursor-pointer rounded px-1.5 text-[11px] font-medium text-tlai-mint hover:bg-white/10"
            >
              Update
            </button>
          )}
          {actions.onShare && (
            <RowAction label="Share with everyone" name={savedFilter.name} onClick={actions.onShare}>
              <Users className="size-3.5" />
            </RowAction>
          )}
          {actions.onStopSharing && (
            <RowAction label="Stop sharing" name={savedFilter.name} onClick={actions.onStopSharing}>
              <UserX className="size-3.5" />
            </RowAction>
          )}
          {onRename && (
            <RowAction label="Rename" name={savedFilter.name} onClick={() => setEditing(true)}>
              <Pencil className="size-3.5" />
            </RowAction>
          )}
          {actions.onDelete && (
            <RowAction label="Delete" name={savedFilter.name} onClick={actions.onDelete}>
              <Trash2 className="size-3.5" />
            </RowAction>
          )}
        </span>
      )}
    </div>
  )
}
