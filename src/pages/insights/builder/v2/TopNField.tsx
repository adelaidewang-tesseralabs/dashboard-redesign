import { useState } from 'react'
import { cn } from '../../../../lib/cn'
import { Select } from '../../../../ui/Select'
import { fieldInputClass } from './transforms/controls'

const PRESETS = [5, 10, 20]
const ALL = 'all'
const CUSTOM = 'custom'

type TopNFieldProps = {
  /** Remembers a picked "Custom…" per graph, even before a number is typed. */
  itemId: string
  limit: number | undefined
  onChange: (limit: number | undefined) => void
}

/** How many labels the graph shows, counted after every filter, in the graph's sort order. */
export function TopNField({ itemId, limit, onChange }: TopNFieldProps) {
  const [customFor, setCustomFor] = useState<string | null>(null)
  const custom = customFor === itemId || (limit !== undefined && !PRESETS.includes(limit))
  const value = custom ? CUSTOM : limit ? String(limit) : ALL

  return (
    <>
      <span className="text-xs text-white/50">Show</span>
      <Select
        aria-label="Show"
        value={value}
        options={[
          { value: ALL, label: 'All' },
          ...PRESETS.map((preset) => ({ value: String(preset), label: `Top ${preset}` })),
          { value: CUSTOM, label: 'Custom…' },
        ]}
        onChange={(next) => {
          setCustomFor(next === CUSTOM ? itemId : null)
          if (next === ALL) onChange(undefined)
          else if (next !== CUSTOM) onChange(Number(next))
        }}
      />
      {custom && (
        <input
          type="number"
          min={1}
          autoFocus={customFor === itemId}
          aria-label="Number of top values"
          placeholder="How many"
          value={limit ?? ''}
          onChange={(event) => {
            const next = Number.parseInt(event.target.value, 10)
            onChange(Number.isNaN(next) || next <= 0 ? undefined : next)
          }}
          className={cn(fieldInputClass, 'font-sans')}
        />
      )}
    </>
  )
}
