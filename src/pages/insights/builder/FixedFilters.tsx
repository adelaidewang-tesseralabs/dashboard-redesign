import { Fragment, useState, type ReactNode } from 'react'
import { ChevronDown, Pin } from 'lucide-react'
import type { DashboardFilter } from '../../../data/dashboards'
import { cn } from '../../../lib/cn'
import type { FixedFilterStyle } from '../../../lib/fixedFilterStyle'
import type { FilterChip } from './FilterChip'
import type { AddFilterPicker } from './AddFilterPicker'

type ChipOptions = Pick<Parameters<typeof FilterChip>[0], 'appearance' | 'trigger'>
type PickerVariant = Parameters<typeof AddFilterPicker>[0]['variant']

type FixedFiltersProps = {
  style: FixedFilterStyle
  filters: DashboardFilter[]
  /** True while the toolbar's "Fixed filter" choice has the picker open. */
  adding: boolean
  chip: (filter: DashboardFilter, options?: ChipOptions) => ReactNode
  picker: (variant: PickerVariant) => ReactNode
}

const HIDDEN_NOTE = "Fixed filters shape every graph they reach. Viewers don't see them."

/** Builder V6: the editor-only fixed filters, drawn in one of the styles being compared. */
export function FixedFilters({ style, filters, adding, chip, picker }: FixedFiltersProps) {
  switch (style) {
    case 'sentence':
      return (
        <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-xs text-[var(--dash-muted)]" title={HIDDEN_NOTE}>
          <Pin className="size-3.5" aria-hidden />
          <span>Only showing data where</span>
          {filters.map((filter, index) => (
            <Fragment key={filter.id}>
              {index > 0 && <span>and</span>}
              {chip(filter, { trigger: ({ open, toggle }) => <Phrase filter={filter} open={open} onClick={toggle} /> })}
            </Fragment>
          ))}
          {filters.length === 0 && <span className="italic">no fixed filters yet</span>}
          {picker('link')}
        </div>
      )
    case 'chip':
      return (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-[var(--dash-muted)]">Fixed · viewers don't see these</span>
          {filters.map((filter) => chip(filter, { appearance: 'tinted' }))}
          {picker('tinted')}
        </div>
      )
    case 'collapsed':
      return <CollapsedFixedFilters filters={filters} adding={adding} chip={chip} picker={picker} />
    default: {
      const unhandled: never = style
      return unhandled
    }
  }
}

function Phrase({ filter, open, onClick }: { filter: DashboardFilter; open: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={onClick}
      className={cn('cursor-pointer rounded px-1 py-0.5 hover:bg-white/5', open && 'bg-white/5')}
    >
      <span className="font-medium text-[var(--dash-fg)]">{filter.label}</span> is{' '}
      <span className="text-[var(--dash-fg)] underline decoration-white/25 decoration-dotted underline-offset-4">{valuesPhrase(filter.values)}</span>
    </button>
  )
}

function valuesPhrase(values: string[]) {
  if (values.length === 0) return 'any value'
  if (values.length > 3) return `${values.slice(0, 2).join(', ')} +${values.length - 2} more`
  if (values.length === 1) return values[0]
  return `${values.slice(0, -1).join(', ')} or ${values.at(-1)}`
}

function CollapsedFixedFilters({ filters, adding, chip, picker }: Omit<FixedFiltersProps, 'style'>) {
  const [expanded, setExpanded] = useState(false)
  if (adding && !expanded) setExpanded(true)
  const open = expanded || adding
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setExpanded(!open)}
        title={HIDDEN_NOTE}
        className={cn(
          'flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-[var(--dash-border)] px-3 text-xs text-[var(--dash-muted)] hover:text-[var(--dash-fg)]',
          open && 'bg-white/5 text-[var(--dash-fg)]',
        )}
      >
        <Pin className="size-3.5" aria-hidden />
        {filters.length === 1 ? '1 fixed filter' : `${filters.length} fixed filters`}
        <ChevronDown className={cn('size-3 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (
        <>
          {filters.map((filter) => chip(filter))}
          {picker('chip')}
        </>
      )}
    </div>
  )
}
