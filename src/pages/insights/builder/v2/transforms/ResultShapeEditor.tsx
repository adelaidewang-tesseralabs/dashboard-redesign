import { X } from 'lucide-react'
import {
  AGGREGATE_FNS,
  AGGREGATE_LABELS,
  aggregateKey,
  type Aggregate,
  type AggregateFn,
  type ResultShape,
  type SortDirection,
} from '../../../../../data/transforms'
import { Select } from '../../../../../ui/Select'
import { EditorCheckbox } from '../../EditorFields'
import { AddRowButton, FieldLabel, RemoveButton, Slot, TransformRow, columnOptions, fieldInputClass, withCurrent, type TransformColumn } from './controls'

const DIRECTION_OPTIONS: { value: SortDirection; label: string }[] = [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
]

const NUMERIC_ONLY = new Set<AggregateFn>(['sum', 'avg'])

type ResultShapeEditorProps = {
  shape: ResultShape
  /** Columns after calculations: what can be grouped and aggregated. */
  columns: TransformColumn[]
  /** Columns after grouping: what a pivot can spread and fill. */
  groupedColumns: TransformColumn[]
  /** Final columns: what rows can be ordered by. */
  outputColumns: TransformColumn[]
  onChange: (shape: ResultShape) => void
  /**
   * Off in builder V6: the limit runs before page filters, so they'd only narrow the first N rows. An existing limit
   * still shows, so it can be cleared.
   */
  rowLimit?: boolean
}

export function ResultShapeEditor({ shape, columns, groupedColumns, outputColumns, onChange, rowLimit = true }: ResultShapeEditorProps) {
  const set = (patch: Partial<ResultShape>) => onChange({ ...shape, ...patch })
  const ungrouped = columns.filter((column) => !shape.groupBy.includes(column.key))
  const unsorted = outputColumns.filter((column) => !shape.orderBy.some((rule) => rule.key === column.key))

  const setLimit = (raw: string) => {
    const limit = Number.parseInt(raw, 10)
    const next: Partial<ResultShape> = { limit: Number.isNaN(limit) || limit <= 0 ? undefined : limit }
    // A Top N without ordering returns arbitrary rows, so default to the first measure, largest first.
    if (next.limit && shape.orderBy.length === 0 && shape.aggregates[0]) next.orderBy = [{ key: aggregateKey(shape.aggregates[0]), direction: 'desc' }]
    set(next)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <FieldLabel>Group by</FieldLabel>
        <div className="flex flex-wrap items-center gap-2">
          {shape.groupBy.map((key) => (
            <span key={key} className="flex h-8 items-center gap-1 rounded-md border border-white/10 bg-white/[0.06] pr-1 pl-2.5 font-mono text-[13px] text-white">
              {key}
              <button
                type="button"
                aria-label={`Stop grouping by ${key}`}
                onClick={() => set({ groupBy: shape.groupBy.filter((current) => current !== key) })}
                className="flex size-6 cursor-pointer items-center justify-center rounded text-white/45 hover:bg-white/10 hover:text-white"
              >
                <X className="size-3.5" />
              </button>
            </span>
          ))}
          {ungrouped.length > 0 && (
            <Slot className="w-full">
              <Select
                key={shape.groupBy.length}
                aria-label="Add group by column"
                value=""
                placeholder={shape.groupBy.length ? 'Then by…' : 'No grouping'}
                options={columnOptions(ungrouped)}
                onChange={(key) => set({ groupBy: [...shape.groupBy, key] })}
              />
            </Slot>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel>Aggregates</FieldLabel>
        {shape.aggregates.map((aggregate, index) => (
          <AggregateRow
            key={`${aggregateKey(aggregate)}-${index}`}
            aggregate={aggregate}
            columns={ungrouped}
            onChange={(next) => set({ aggregates: shape.aggregates.map((current, at) => (at === index ? next : current)) })}
            onRemove={() => set({ aggregates: shape.aggregates.filter((_, at) => at !== index) })}
          />
        ))}
        <AddRowButton
          label={shape.aggregates.length === 0 && shape.groupBy.length > 0 ? 'Add aggregate (default: count)' : 'Add aggregate'}
          onClick={() => set({ aggregates: [...shape.aggregates, { fn: 'count' }] })}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel>Order by</FieldLabel>
        <div className="flex flex-wrap items-center gap-2">
          {shape.orderBy.map((rule, index) => (
            <span key={rule.key} className="flex w-full items-center gap-1.5">
              <Slot className="min-w-0 flex-1">
                <Select
                  aria-label={`Order by column ${index + 1}`}
                  value={rule.key}
                  options={[{ value: '', label: 'Remove sort' }, ...withCurrent(columnOptions([outputColumns.find((column) => column.key === rule.key) ?? { key: rule.key, type: 'text' }, ...unsorted]), rule.key)]}
                  onChange={(key) =>
                    set({ orderBy: key ? shape.orderBy.map((current, at) => (at === index ? { ...current, key } : current)) : shape.orderBy.filter((_, at) => at !== index) })
                  }
                />
              </Slot>
              <Slot className="w-32">
                <Select
                  aria-label={`Order by direction ${index + 1}`}
                  value={rule.direction}
                  options={DIRECTION_OPTIONS}
                  onChange={(direction) =>
                    set({ orderBy: shape.orderBy.map((current, at) => (at === index ? { ...current, direction: direction as SortDirection } : current)) })
                  }
                />
              </Slot>
            </span>
          ))}
          {unsorted.length > 0 && (
            <Slot className="w-full">
              <Select
                key={shape.orderBy.length}
                aria-label="Add sort column"
                value=""
                placeholder={shape.orderBy.length ? 'Then by…' : 'No ordering'}
                options={columnOptions(unsorted)}
                onChange={(key) => set({ orderBy: [...shape.orderBy, { key, direction: 'asc' }] })}
              />
            </Slot>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        {(rowLimit || shape.limit) && (
          <label className="flex w-full flex-col gap-1.5">
            <FieldLabel>Limit</FieldLabel>
            <input
              type="number"
              min={1}
              aria-label="Row limit"
              placeholder="All rows"
              value={shape.limit ?? ''}
              onChange={(event) => setLimit(event.target.value)}
              className={fieldInputClass}
            />
          </label>
        )}
        <div className="flex h-8 items-center rounded-md border border-white/10 bg-white/[0.03] px-3">
          <EditorCheckbox label="Distinct rows" checked={shape.distinct} onChange={(distinct) => set({ distinct })} />
        </div>
      </div>

      <PivotCard shape={shape} columns={groupedColumns} onChange={set} />
    </div>
  )
}

type AggregateRowProps = { aggregate: Aggregate; columns: TransformColumn[]; onChange: (aggregate: Aggregate) => void; onRemove: () => void }

function AggregateRow({ aggregate, columns, onChange, onRemove }: AggregateRowProps) {
  const fieldColumns = NUMERIC_ONLY.has(aggregate.fn) ? columns.filter((column) => column.type === 'number') : columns
  const changeFn = (fn: AggregateFn) => {
    if (fn === 'count') return onChange({ fn })
    const keepField = aggregate.field && (!NUMERIC_ONLY.has(fn) || columns.find((column) => column.key === aggregate.field)?.type === 'number')
    const fallback = (NUMERIC_ONLY.has(fn) ? columns.filter((column) => column.type === 'number') : columns)[0]?.key
    onChange({ fn, field: keepField ? aggregate.field : fallback })
  }
  return (
    <TransformRow>
      <Slot className="w-[calc(100%-2.25rem)]">
        <Select
          aria-label="Aggregate function"
          value={aggregate.fn}
          options={AGGREGATE_FNS.map((fn) => ({ value: fn, label: AGGREGATE_LABELS[fn] }))}
          onChange={(fn) => changeFn(fn as AggregateFn)}
        />
      </Slot>
      <RemoveButton label={`Remove ${aggregateKey(aggregate)}`} onClick={onRemove} />
      {aggregate.fn !== 'count' && (
        <div className="flex w-full items-center gap-2">
          <span className="shrink-0 text-xs text-white/40">of</span>
          <Slot className="min-w-0 flex-1">
            <Select
              aria-label="Aggregate column"
              value={aggregate.field ?? ''}
              placeholder="Pick a column"
              options={withCurrent(columnOptions(fieldColumns), aggregate.field)}
              onChange={(field) => onChange({ ...aggregate, field })}
            />
          </Slot>
        </div>
      )}
      <span className="font-mono text-xs text-white/40">→ {aggregateKey(aggregate)}</span>
    </TransformRow>
  )
}

type PivotCardProps = { shape: ResultShape; columns: TransformColumn[]; onChange: (patch: Partial<ResultShape>) => void }

/** Spreads one column's values into columns of their own, e.g. a status per column with counts in the cells. */
function PivotCard({ shape, columns, onChange }: PivotCardProps) {
  const { pivot } = shape
  const toggle = (on: boolean) => {
    if (!on) return onChange({ pivot: undefined })
    const label = columns.find((column) => column.type === 'text') ?? columns[0]
    const value = columns.find((column) => column.type === 'number' && column.key !== label?.key) ?? columns[0]
    if (!label || !value) return
    onChange({ pivot: { columnsFrom: label.key, valuesFrom: value.key, fn: 'sum', totals: false } })
  }
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <div className="flex flex-col gap-1">
        <EditorCheckbox label="Pivot" checked={Boolean(pivot)} onChange={toggle} />
        <span className="pl-6 text-xs text-white/45">Turn one column's values into columns</span>
      </div>
      {pivot && (
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <FieldLabel>Columns from</FieldLabel>
            <Slot className="w-full">
              <Select
                aria-label="Pivot columns from"
                value={pivot.columnsFrom}
                options={withCurrent(columnOptions(columns), pivot.columnsFrom)}
                onChange={(columnsFrom) => onChange({ pivot: { ...pivot, columnsFrom } })}
              />
            </Slot>
          </label>
          <label className="flex flex-col gap-1.5">
            <FieldLabel>Values from</FieldLabel>
            <Slot className="w-full">
              <Select
                aria-label="Pivot values from"
                value={pivot.valuesFrom}
                options={withCurrent(columnOptions(columns), pivot.valuesFrom)}
                onChange={(valuesFrom) => onChange({ pivot: { ...pivot, valuesFrom } })}
              />
            </Slot>
          </label>
          <label className="flex flex-col gap-1.5">
            <FieldLabel>Aggregate</FieldLabel>
            <Slot className="w-full">
              <Select
                aria-label="Pivot aggregate"
                value={pivot.fn}
                options={AGGREGATE_FNS.map((fn) => ({ value: fn, label: AGGREGATE_LABELS[fn] }))}
                onChange={(fn) => onChange({ pivot: { ...pivot, fn: fn as AggregateFn } })}
              />
            </Slot>
          </label>
          <div className="flex h-8 items-center">
            <EditorCheckbox label="Totals column" checked={pivot.totals} onChange={(totals) => onChange({ pivot: { ...pivot, totals } })} />
          </div>
        </div>
      )}
    </div>
  )
}
