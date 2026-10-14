import { useRef, useState } from 'react'

const MAX_LENGTH = 200

type EditableDescriptionProps = {
  value: string
  onChange: (value: string) => void
}

/** Click-to-edit description under the dashboard name. Unlike the name, it can be cleared. */
export function EditableDescription({ value, onChange }: EditableDescriptionProps) {
  /** The text being typed; null when not editing. */
  const [draft, setDraft] = useState<string | null>(null)
  // Enter and Escape blur the field right after finishing; blur runs before the re-render, so it reads this, not `draft`.
  const editing = useRef(false)

  const edit = (text: string) => {
    editing.current = true
    setDraft(text)
  }
  const finish = (save: boolean) => {
    if (!editing.current || draft === null) return
    editing.current = false
    setDraft(null)
    const next = draft.trim()
    if (save && next !== value) onChange(next)
  }

  return (
    <input
      value={draft ?? value}
      maxLength={MAX_LENGTH}
      aria-label="Dashboard description"
      title="Edit description"
      placeholder="Add a description"
      onChange={(event) => edit(event.target.value)}
      onBlur={() => finish(true)}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== 'Escape') return
        finish(event.key === 'Enter')
        event.currentTarget.blur()
      }}
      className="-ml-1.5 w-full min-w-0 truncate rounded-md border border-transparent bg-transparent px-1.5 py-0.5 text-sm text-white/50 outline-none placeholder:text-white/30 hover:border-white/15 focus:border-white/30 focus:bg-white/5 focus:text-white/80"
    />
  )
}
