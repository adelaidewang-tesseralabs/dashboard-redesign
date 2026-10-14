import { useState, type ReactNode } from 'react'
import { Button } from '../../../../ui/Button'
import { EditorCheckbox, editorInputClass } from '../EditorFields'

type SavedFilterFormProps = {
  initialName?: string
  initialShared?: boolean
  submitLabel: string
  /** Whether the person already has another saved filter with this name. */
  nameTaken: (name: string) => boolean
  onSubmit: (values: { name: string; shared: boolean }) => void
  onCancel: () => void
  note?: ReactNode
}

/** Name and sharing for a saved filter, when saving one or renaming it. */
export function SavedFilterForm({ initialName = '', initialShared = false, submitLabel, nameTaken, onSubmit, onCancel, note }: SavedFilterFormProps) {
  const [name, setName] = useState(initialName)
  const [shared, setShared] = useState(initialShared)
  const trimmed = name.trim()
  const taken = trimmed !== '' && nameTaken(trimmed)

  return (
    <form
      className="flex flex-col gap-2 p-1"
      onSubmit={(event) => {
        event.preventDefault()
        if (trimmed && !taken) onSubmit({ name: trimmed, shared })
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return
        event.stopPropagation()
        onCancel()
      }}
    >
      <input
        autoFocus
        aria-label="Saved filter name"
        aria-invalid={taken || undefined}
        value={name}
        placeholder="e.g. EMEA, last quarter"
        onChange={(event) => setName(event.target.value)}
        className={editorInputClass}
      />
      {taken && <p className="text-[11px] text-amber-300">You already have a saved filter with this name.</p>}
      <EditorCheckbox label="Share with everyone who has access to this dashboard" checked={shared} onChange={setShared} />
      {note}
      <div className="flex justify-end gap-1">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={!trimmed || taken}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
