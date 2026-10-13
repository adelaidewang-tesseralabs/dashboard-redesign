import { CALC_OPERATORS, type CalcOperator, type Calculation, type OnZero } from '../../../../../data/transforms'
import { cn } from '../../../../../lib/cn'
import { Select } from '../../../../../ui/Select'
import { AddRowButton, RemoveButton, Slot, TransformRow, columnOptions, fieldInputClass, withCurrent, type TransformColumn } from './controls'

const NUMBER_OPERAND = '__number__'

const ON_ZERO_OPTIONS: { value: OnZero; label: string }[] = [
  { value: 'empty', label: 'Leave empty' },
  { value: 'remove', label: 'Drop row' },
  { value: 'zero', label: 'Use 0' },
]

type CalculationsEditorProps = {
  calculations: Calculation[]
  /** The dataset's own columns; each calculation can also read the ones above it. */
  columns: TransformColumn[]
  onChange: (calculations: Calculation[]) => void
}

const sanitizeKey = (raw: string) =>
  raw
    .trim()
    .toLowerCase()
    .replace(/\W+/g, '_')
    .replace(/^_+|_+$/g, '')

function nextKey(taken: Set<string>) {
  let index = 1
  while (taken.has(`calc_${index}`)) index++
  return `calc_${index}`
}

/** Derived columns written as `name = a <op> b`, computed per row before filters and grouping. */
export function CalculationsEditor({ calculations, columns, onChange }: CalculationsEditorProps) {
  const taken = new Set([...columns.map((column) => column.key), ...calculations.map((calculation) => calculation.key)])

  const add = () => {
    const numeric = columns.filter((column) => column.type === 'number').map((column) => column.key)
    const seeds = numeric.length ? numeric : columns.map((column) => column.key)
    onChange([...calculations, { key: nextKey(taken), operator: '/', operands: [seeds[1] ?? seeds[0], seeds[0]] }])
  }
  const update = (index: number, next: Calculation) => onChange(calculations.map((current, at) => (at === index ? next : current)))

  const rename = (index: number, raw: string) => {
    const calculation = calculations[index]
    const key = sanitizeKey(raw)
    if (!key || key === calculation.key || taken.has(key)) return
    update(index, { ...calculation, key })
  }

  const changeOperator = (index: number, operator: CalcOperator) => {
    const { onZero, ...calculation } = calculations[index]
    update(index, operator === '/' || operator === '%' ? { ...calculation, operator, onZero } : { ...calculation, operator })
  }

  return (
    <>
      {calculations.map((calculation, index) => {
        const available = [...columns, ...calculations.slice(0, index).map((earlier) => ({ key: earlier.key, type: 'number' as const }))]
        const operand = (slot: 0 | 1) => (
          <OperandField
            label={`Operand ${slot + 1} of ${calculation.key}`}
            value={calculation.operands[slot]}
            columns={available}
            onChange={(next) => {
              const operands: [string | number, string | number] = [...calculation.operands]
              operands[slot] = next
              update(index, { ...calculation, operands })
            }}
          />
        )
        return (
          <TransformRow key={calculation.key}>
            <input
              key={calculation.key}
              aria-label="Calculation name"
              defaultValue={calculation.key}
              onBlur={(event) => rename(index, event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()}
              className={cn(fieldInputClass, 'w-36 text-tlai-mint')}
            />
            <span className="text-sm text-white/40">=</span>
            {operand(0)}
            <Slot className="w-24">
              <Select
                aria-label={`Operator of ${calculation.key}`}
                value={calculation.operator}
                options={CALC_OPERATORS.map((operator) => ({ value: operator, label: operator }))}
                onChange={(operator) => changeOperator(index, operator as CalcOperator)}
              />
            </Slot>
            {calculation.operator !== 'abs' && operand(1)}
            {(calculation.operator === '/' || calculation.operator === '%') && (
              <span className="flex items-center gap-1.5">
                <span className="text-xs text-white/40">if zero</span>
                <Slot className="w-32">
                  <Select
                    aria-label={`If zero for ${calculation.key}`}
                    value={calculation.onZero ?? 'empty'}
                    options={ON_ZERO_OPTIONS}
                    onChange={(onZero) => update(index, { ...calculation, onZero: onZero as OnZero })}
                  />
                </Slot>
              </span>
            )}
            <RemoveButton label={`Remove ${calculation.key}`} onClick={() => onChange(calculations.filter((_, at) => at !== index))} />
          </TransformRow>
        )
      })}
      <AddRowButton label="Add calculation" disabled={columns.length === 0} onClick={add} />
    </>
  )
}

type OperandFieldProps = { label: string; value: string | number; columns: TransformColumn[]; onChange: (value: string | number) => void }

/** A column, or a literal number typed beside the select. */
function OperandField({ label, value, columns, onChange }: OperandFieldProps) {
  const isNumber = typeof value === 'number'
  return (
    <>
      <Slot className={isNumber ? 'w-36' : 'w-44'}>
        <Select
          aria-label={label}
          value={isNumber ? NUMBER_OPERAND : value}
          options={[...withCurrent(columnOptions(columns), isNumber ? undefined : value), { value: NUMBER_OPERAND, label: 'Custom number' }]}
          onChange={(next) => onChange(next === NUMBER_OPERAND ? 0 : next)}
        />
      </Slot>
      {isNumber && (
        <input
          type="number"
          aria-label={`Value of ${label.toLowerCase()}`}
          value={value}
          onChange={(event) => onChange(Number(event.target.value) || 0)}
          className={cn(fieldInputClass, 'w-20')}
        />
      )}
    </>
  )
}
