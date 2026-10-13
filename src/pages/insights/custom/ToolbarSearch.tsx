import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { ToolbarButton } from '../../../ui/ToolbarButton'

type ToolbarSearchProps = {
  value: string
  onChange: (value: string) => void
  placeholder: string
}

/** Collapsed to a "Search" action until clicked; stays open while it holds a query. */
export function ToolbarSearch({ value, onChange, placeholder }: ToolbarSearchProps) {
  const [expanded, setExpanded] = useState(false)

  if (!expanded && !value) {
    return (
      <ToolbarButton Icon={Search} onClick={() => setExpanded(true)}>
        Search
      </ToolbarButton>
    )
  }

  return (
    <label className="flex h-7 w-72 min-w-36 shrink items-center gap-1.5 px-2 text-xs">
      <Search className="size-3.5 shrink-0 text-white/60" />
      <input
        autoFocus
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={() => setExpanded(false)}
        onKeyDown={(event) => {
          if (event.key !== 'Escape') return
          onChange('')
          setExpanded(false)
        }}
        placeholder={placeholder}
        aria-label="Search dashboards"
        className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-white/40"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onChange('')}
          className="flex size-4 cursor-pointer items-center justify-center text-white/40 hover:text-white"
        >
          <X className="size-3.5" />
        </button>
      )}
    </label>
  )
}
