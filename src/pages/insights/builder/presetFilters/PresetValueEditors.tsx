import { useState } from 'react'
import { Search } from 'lucide-react'
import { cn } from '../../../../lib/cn'
import { EditorCheckbox } from '../EditorFields'

const INPUT_CLASS =
  'h-8 w-full min-w-0 rounded-md border border-white/15 bg-white/[0.03] px-2.5 text-xs text-white outline-none [color-scheme:dark] placeholder:text-white/40 focus:border-white/30 disabled:opacity-60'

type EditorProps = { label: string; values: string[]; readOnly: boolean; onChange: (values: string[]) => void }

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

type Bounds = { min?: string; max?: string }

/** Select and user fields: search and tick any of the values. `keepOne`: the last ticked value can't be unticked. */
export function OptionsEditor({ label, values, readOnly, onChange, options, users, keepOne }: EditorProps & { options: string[]; users?: boolean; keepOne?: boolean }) {
  const [query, setQuery] = useState('')
  const shown = options.filter((option) => option.toLowerCase().includes(query.trim().toLowerCase()))
  const optionLabel = (option: string) =>
    users ? (
      <span className="flex items-center gap-2">
        <span aria-hidden className="flex size-5 items-center justify-center rounded-full bg-white/15 text-[9px] font-semibold text-white/80">
          {initials(option)}
        </span>
        {option}
      </span>
    ) : (
      option
    )

  return (
    <>
      <label className="flex h-8 items-center gap-2 rounded-md border border-white/15 bg-white/[0.03] px-2.5 text-xs focus-within:border-white/30">
        <Search className="size-3.5 shrink-0 text-white/45" aria-hidden />
        <input
          aria-label={`Search ${label}`}
          value={query}
          placeholder={`Search ${label}`}
          onChange={(event) => setQuery(event.target.value)}
          className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-white/40"
        />
      </label>
      <div className="flex min-h-0 flex-col gap-2 overflow-y-auto pb-1">
        {shown.length === 0 && <p className="text-xs text-white/45">No values match.</p>}
        {shown.map((option) =>
          readOnly ? (
            <span key={option} className={cn('text-sm text-white/45', values.includes(option) && 'text-white/85')}>
              {values.includes(option) ? '✓ ' : ''}
              {option}
            </span>
          ) : (
            <EditorCheckbox
              key={option}
              label={optionLabel(option)}
              checked={values.includes(option)}
              disabled={keepOne && values.length === 1 && values[0] === option}
              onChange={(checked) => onChange(checked ? [...values, option] : values.filter((entry) => entry !== option))}
            />
          ),
        )}
      </div>
    </>
  )
}

/** Text and number fields: one value, compared with the field's operator. */
export function ValueInput({ label, values, readOnly, onChange, numeric, min, max }: EditorProps & Bounds & { numeric?: boolean }) {
  return (
    <input
      aria-label={label}
      type={numeric ? 'number' : 'text'}
      value={values[0] ?? ''}
      min={min}
      max={max}
      disabled={readOnly}
      placeholder={`Filter by ${label.toLowerCase()}`}
      onChange={(event) => onChange(event.target.value === '' ? [] : [event.target.value])}
      className={INPUT_CLASS}
    />
  )
}

type DateMode = 'on' | 'between'

/** Date fields: one day, or an inclusive range. */
export function DateEditor({ label, values, readOnly, onChange, min, max }: EditorProps & Bounds) {
  const [mode, setMode] = useState<DateMode>(values.length === 2 && values[0] !== values[1] ? 'between' : 'on')
  const [from = '', to = from] = values
  const changeMode = (next: DateMode) => {
    setMode(next)
    if (from) onChange(next === 'on' ? [from] : [from, to])
  }
  const changeFrom = (value: string) => onChange(!value ? [] : mode === 'on' ? [value] : [value, to && to >= value ? to : value])
  const changeTo = (value: string) => from && onChange([from, value && value >= from ? value : from])

  return (
    <>
      <SegmentedChoice
        label={`${label} range`}
        options={[
          { value: 'on', label: 'On' },
          { value: 'between', label: 'Between' },
        ]}
        value={mode}
        disabled={readOnly}
        onChange={changeMode}
      />
      <div className="flex flex-col gap-2">
        <input aria-label={mode === 'on' ? label : `${label} from`} type="date" value={from} min={min} max={max} disabled={readOnly} onChange={(event) => changeFrom(event.target.value)} className={INPUT_CLASS} />
        {mode === 'between' && (
          <input aria-label={`${label} to`} type="date" value={to} min={from || min} max={max} disabled={readOnly || !from} onChange={(event) => changeTo(event.target.value)} className={INPUT_CLASS} />
        )}
      </div>
    </>
  )
}

/** Boolean fields: true or false. */
export function BooleanEditor({ label, values, readOnly, onChange }: EditorProps) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-col gap-2">
      {['true', 'false'].map((option) => (
        <label key={option} className={cn('flex items-center gap-2 text-sm text-white/85', !readOnly && 'cursor-pointer')}>
          <input type="radio" name={label} checked={values[0] === option} disabled={readOnly} onChange={() => onChange([option])} className="peer sr-only" />
          <span aria-hidden className={cn('flex size-4 items-center justify-center rounded-full border border-white/30 peer-focus-visible:ring-2 peer-focus-visible:ring-white/40', values[0] === option && 'border-tlai-mint')}>
            {values[0] === option && <span className="size-2 rounded-full bg-tlai-mint" />}
          </span>
          {option === 'true' ? 'True' : 'False'}
        </label>
      ))}
    </div>
  )
}

type SegmentedChoiceProps<T extends string> = { label: string; options: { value: T; label: string }[]; value: T; disabled?: boolean; onChange: (value: T) => void }

/** Like the main app's FilterBuilder operator toggle: one always picked. */
export function SegmentedChoice<T extends string>({ label, options, value, disabled, onChange }: SegmentedChoiceProps<T>) {
  return (
    <div role="group" aria-label={label} className="flex w-full gap-0.5 rounded-md border border-white/10 bg-white/5 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          disabled={disabled}
          onClick={() => onChange(option.value)}
          className={cn(
            'flex-1 cursor-pointer rounded-md border border-transparent px-2 py-0.5 text-xs text-white/70 hover:bg-white/10 hover:text-white disabled:cursor-default disabled:hover:bg-transparent',
            option.value === value && 'border-white/15 bg-white/15 text-white',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
