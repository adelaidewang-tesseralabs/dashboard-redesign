import { useState } from 'react'
import { Check, Minus, Search } from 'lucide-react'
import { cn } from '../lib/cn'
import { selectAllLabel, selectAllState, toggleAll } from '../lib/selectAll'
import { Button } from './Button'

export type FilterField = {
  key: string
  label: string
  /** Radio instead of checkboxes. */
  single?: boolean
  options: { value: string; label: string }[]
}

export type FilterValues = Partial<Record<string, string[]>>

type FilterBuilderProps = {
  fields: FilterField[]
  values: FilterValues
  onChange: (values: FilterValues) => void
}

/** Port of modus `FilterBuilder`: field list on the left, the picked field's options on the right. */
export function FilterBuilder({ fields, values, onChange }: FilterBuilderProps) {
  const [selectedKey, setSelectedKey] = useState(fields[0]?.key ?? null)
  const selected = fields.find((field) => field.key === selectedKey)
  const hasAnyValues = Object.values(values).some((picked) => picked?.length)

  return (
    <div className="flex min-h-55 w-120 overflow-hidden text-white/80">
      <div className="flex w-40 shrink-0 flex-col gap-2 border-r border-white/10 p-3 text-xs">
        <ul className="flex flex-1 flex-col gap-1">
          {fields.map((field) => {
            const count = values[field.key]?.length ?? 0
            return (
              <li key={field.key}>
                <button
                  type="button"
                  aria-pressed={field.key === selectedKey}
                  onClick={() => setSelectedKey(field.key)}
                  className={cn(
                    'flex min-h-[30px] w-full cursor-pointer items-center justify-between gap-2 rounded px-1.5 text-left hover:bg-white/10',
                    field.key === selectedKey && 'bg-white/10 text-white',
                  )}
                >
                  <span className="truncate">{field.label}</span>
                  {count > 0 && <span className="rounded bg-white/15 px-1.5 text-[11px] text-white tabular-nums">{count}</span>}
                </button>
              </li>
            )
          })}
        </ul>
        <Button variant="ghost" size="sm" disabled={!hasAnyValues} onClick={() => onChange({})} className="self-start">
          Clear All
        </Button>
      </div>
      {selected ? (
        <FieldPanel
          key={selected.key}
          field={selected}
          value={values[selected.key] ?? []}
          onChange={(picked) => onChange({ ...values, [selected.key]: picked })}
        />
      ) : (
        <p className="flex flex-1 items-center justify-center p-4 text-xs">Select a field to start creating a filter.</p>
      )}
    </div>
  )
}

function FieldPanel({ field, value, onChange }: { field: FilterField; value: string[]; onChange: (value: string[]) => void }) {
  const [query, setQuery] = useState('')
  const needle = query.trim().toLowerCase()
  const options = field.options.filter((option) => option.label.toLowerCase().includes(needle))
  const shownValues = options.map((option) => option.value)
  const allState = selectAllState(value, shownValues)

  const toggle = (optionValue: string) => {
    if (field.single) return onChange(value.includes(optionValue) ? [] : [optionValue])
    onChange(value.includes(optionValue) ? value.filter((item) => item !== optionValue) : [...value, optionValue])
  }

  return (
    <div className="flex flex-1 flex-col gap-3 p-3 text-xs">
      <label className="flex h-8 items-center gap-2 border-b border-white/20 px-1 focus-within:border-white/50">
        <Search className="size-3.5 shrink-0 text-white/40" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search ${field.label}`}
          aria-label={`Search ${field.label}`}
          className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-white/40"
        />
      </label>
      {!field.single && options.length > 1 && (
        <button
          type="button"
          role="checkbox"
          aria-checked={allState === 'all' ? true : allState === 'some' ? 'mixed' : false}
          onClick={() => onChange(toggleAll(value, shownValues))}
          className="-mt-1 flex cursor-pointer items-center gap-2 rounded border-b border-white/10 px-1 py-1 pb-2 text-left hover:bg-white/5"
        >
          <span className={cn('flex size-4 shrink-0 items-center justify-center rounded-sm border border-white/30', allState !== 'none' && 'border-white bg-white text-black')}>
            {allState === 'all' && <Check className="size-3" strokeWidth={3} />}
            {allState === 'some' && <Minus className="size-3" strokeWidth={3} />}
          </span>
          <span className="truncate">{selectAllLabel(needle !== '', options.length)}</span>
        </button>
      )}
      <div role={field.single ? 'radiogroup' : 'group'} aria-label={field.label} className="flex max-h-48 flex-col gap-1 overflow-y-auto">
        {options.map((option) => {
          const checked = value.includes(option.value)
          return (
            <button
              key={option.value}
              type="button"
              role={field.single ? 'radio' : 'checkbox'}
              aria-checked={checked}
              onClick={() => toggle(option.value)}
              className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-left hover:bg-white/5"
            >
              <span
                className={cn(
                  'flex size-4 shrink-0 items-center justify-center border border-white/30',
                  field.single ? 'rounded-full' : 'rounded-sm',
                  checked && 'border-white bg-white text-black',
                )}
              >
                {checked && (field.single ? <span className="size-1.5 rounded-full bg-black" /> : <Check className="size-3" strokeWidth={3} />)}
              </span>
              <span className="truncate">{option.label}</span>
            </button>
          )
        })}
        {options.length === 0 && <span className="text-white/40">No matches</span>}
      </div>
      <Button variant="ghost" size="sm" disabled={value.length === 0} onClick={() => onChange([])} className="mt-auto self-start">
        Clear
      </Button>
    </div>
  )
}
