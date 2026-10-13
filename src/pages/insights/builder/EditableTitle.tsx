import { useState } from 'react'
import { cn } from '../../../lib/cn'

type EditableTitleProps = {
  value: string
  onChange: (value: string) => void
  label?: string
  size?: 'lg' | 'md'
}

/** Click-to-rename heading; a blank or unchanged name is discarded. */
export function EditableTitle({ value, onChange, label = 'Dashboard name', size = 'lg' }: EditableTitleProps) {
  const [draft, setDraft] = useState(value)
  const [editing, setEditing] = useState(false)
  const shown = editing ? draft : value

  const commit = () => {
    setEditing(false)
    const name = draft.trim()
    if (name && name !== value) onChange(name)
  }

  return (
    <h1 className={cn('-ml-1.5 inline-grid max-w-full min-w-24 grid-cols-[minmax(0,1fr)] text-white', size === 'lg' ? 'text-base/6 font-semibold' : 'text-base font-bold')}>
      <span aria-hidden className="invisible col-start-1 row-start-1 overflow-hidden border border-transparent px-1.5 py-0.5 whitespace-pre">
        {shown || ' '}
      </span>
      {/* size=1 drops the input's default ~20-character width, so the hidden span alone sizes the title. */}
      <input
        size={1}
        value={shown}
        aria-label={label}
        title="Rename"
        onFocus={(event) => {
          setDraft(value)
          setEditing(true)
          event.target.select()
        }}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur()
          if (event.key === 'Escape') {
            setDraft(value)
            setEditing(false)
            event.currentTarget.blur()
          }
        }}
        className="col-start-1 row-start-1 w-full min-w-0 truncate rounded-md border border-transparent bg-transparent px-1.5 py-0.5 text-white outline-none hover:border-white/15 focus:border-white/30 focus:bg-white/5"
      />
    </h1>
  )
}
