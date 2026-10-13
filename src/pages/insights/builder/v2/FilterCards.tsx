import { Check, Plus, X } from 'lucide-react'
import type { RowFilter } from '../../../../data/transforms'
import { cn } from '../../../../lib/cn'
import { Select } from '../../../../ui/Select'
import type { FilterColumn } from '../dashboardFilters'

const CARD_PREFIX = 'card:'

/** Card filters are `in` lists the cards own; any other graph filter is an advanced condition. */
export const isCardFilter = (filter: RowFilter) => filter.id.startsWith(CARD_PREFIX)

type FilterCardsProps = {
  /** The dataset's category columns and their values. */
  columns: FilterColumn[]
  /** Always gets a card, which can be cleared but not removed. */
  groupKey: string | undefined
  filters: RowFilter[]
  onChange: (filters: RowFilter[]) => void
}

const cardId = (column: string) => `${CARD_PREFIX}${column}`
const picked = (filter: RowFilter | undefined) => (filter?.value ? filter.value.split(',') : [])

/** Power BI-style filter cards: tick the values this graph shows. An empty card keeps every row. */
export function FilterCards({ columns, groupKey, filters, onChange }: FilterCardsProps) {
  const cards = filters.filter(isCardFilter)
  const shown = [
    ...columns.filter((column) => column.column === groupKey),
    ...cards.flatMap((card) => columns.filter((column) => column.column === card.key && column.column !== groupKey)),
  ]
  const addable = columns.filter((column) => !shown.includes(column))
  const setValues = (column: string, values: string[]) => {
    const rest = filters.filter((filter) => filter.id !== cardId(column))
    const card: RowFilter = { id: cardId(column), key: column, operator: 'in', value: values.join(',') }
    const index = filters.findIndex((filter) => filter.id === card.id)
    onChange(index < 0 ? [...rest, card] : filters.with(index, card))
  }
  const remove = (column: string) => onChange(filters.filter((filter) => filter.id !== cardId(column)))

  return (
    <div className="flex flex-col gap-2">
      {shown.map((column) => (
        <FilterCard
          key={column.column}
          column={column}
          automatic={column.column === groupKey}
          values={picked(filters.find((filter) => filter.id === cardId(column.column)))}
          onValuesChange={(values) => setValues(column.column, values)}
          onRemove={() => remove(column.column)}
        />
      ))}
      {addable.length > 0 && (
        <Select
          aria-label="Add filter card"
          value=""
          placeholder="Add field"
          options={addable.map((column) => ({ value: column.column, label: column.label, icon: <Plus className="size-3.5 text-white/55" /> }))}
          onChange={(column) => setValues(column, [])}
        />
      )}
    </div>
  )
}

type FilterCardProps = {
  column: FilterColumn
  automatic: boolean
  values: string[]
  onValuesChange: (values: string[]) => void
  onRemove: () => void
}

function FilterCard({ column, automatic, values, onValuesChange, onRemove }: FilterCardProps) {
  const toggle = (value: string) => onValuesChange(values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value])

  return (
    <section aria-label={`${column.label} filter`} className="rounded-md border border-white/10 bg-white/[0.03]">
      <header className="flex h-8 items-center gap-1.5 border-b border-white/10 pr-1 pl-2.5 text-xs">
        <span className="min-w-0 flex-1 truncate font-medium text-white/85">{column.label}</span>
        <span className="text-white/45">{values.length === 0 ? 'All' : `${values.length} of ${column.values.length}`}</span>
        {values.length > 0 && (
          <button type="button" onClick={() => onValuesChange([])} className="cursor-pointer rounded px-1 text-white/55 hover:text-white">
            Clear
          </button>
        )}
        {automatic ? (
          <span className="px-1 text-[11px] text-white/35" title="Every graph gets a card for the field it groups by">
            Auto
          </span>
        ) : (
          <button
            type="button"
            aria-label={`Remove ${column.label} filter`}
            onClick={onRemove}
            className="flex size-6 cursor-pointer items-center justify-center rounded text-white/45 hover:bg-white/10 hover:text-white"
          >
            <X className="size-3.5" />
          </button>
        )}
      </header>
      <div role="group" aria-label={column.label} className="flex max-h-44 flex-col overflow-y-auto py-1">
        {column.values.map((value) => {
          const checked = values.includes(value)
          return (
            <button
              key={value}
              type="button"
              role="checkbox"
              aria-checked={checked}
              onClick={() => toggle(value)}
              className="flex cursor-pointer items-center gap-2 px-2.5 py-1 text-left text-xs text-white/80 hover:bg-white/5"
            >
              <span className={cn('flex size-3.5 shrink-0 items-center justify-center rounded border border-white/30', checked && 'border-white bg-white text-black')}>
                {checked && <Check className="size-2.5" />}
              </span>
              <span className="truncate">{value}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
