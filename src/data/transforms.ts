import type { Cell, SqlResult } from './dataSources'

/** Dataset transforms (calculations, filters, result shape) and graph queries, mirroring production's graph Data step. */

export type ColumnType = 'number' | 'text'

export const CALC_OPERATORS = ['+', '-', '*', '/', '%', 'concat', 'abs'] as const
export type CalcOperator = (typeof CALC_OPERATORS)[number]
export type OnZero = 'empty' | 'remove' | 'zero'
/** Operands are column keys or numeric literals; `abs` reads only the first. */
export type Calculation = { key: string; operator: CalcOperator; operands: [string | number, string | number]; onZero?: OnZero }

export const FILTER_OPERATORS = ['eq', 'ne', 'lt', 'lte', 'gt', 'gte', 'in', 'not_in', 'like', 'is_null', 'is_not_null'] as const
export type FilterOperator = (typeof FILTER_OPERATORS)[number]
export type RowFilter = { id: string; key: string; operator: FilterOperator; value: string }

export const AGGREGATE_FNS = ['count', 'count_distinct', 'sum', 'avg', 'min', 'max'] as const
export type AggregateFn = (typeof AGGREGATE_FNS)[number]
/** `count` counts rows and has no field. */
export type Aggregate = { fn: AggregateFn; field?: string }

export type SortDirection = 'asc' | 'desc'
export type SortRule = { key: string; direction: SortDirection }
export type Pivot = { columnsFrom: string; valuesFrom: string; fn: AggregateFn; totals: boolean }
export type ResultShape = { groupBy: string[]; aggregates: Aggregate[]; orderBy: SortRule[]; limit?: number; distinct: boolean; pivot?: Pivot }
export type DatasetTransforms = { calculations: Calculation[]; filters: RowFilter[]; shape: ResultShape }

export const EMPTY_TRANSFORMS: DatasetTransforms = {
  calculations: [],
  filters: [],
  shape: { groupBy: [], aggregates: [], orderBy: [], distinct: false },
}

export type GraphSort = { by: 'label' | 'value'; direction: SortDirection }
/** Per-graph query on top of the dataset result; unset fields keep the default count of rows. */
/** `groupBy` is for SQL graphs only; object graphs group by their field. `calculations` are this graph's own, unlike the dataset's. */
export type GraphQuery = { groupBy?: string; value?: Aggregate; calculations?: Calculation[]; filters?: RowFilter[]; sort?: GraphSort; limit?: number }

export const FILTER_OPERATOR_LABELS: Record<FilterOperator, string> = {
  eq: 'equals',
  ne: 'not equals',
  lt: 'less than',
  lte: 'at most',
  gt: 'greater than',
  gte: 'at least',
  in: 'in list',
  not_in: 'not in list',
  like: 'contains',
  is_null: 'is empty',
  is_not_null: 'is not empty',
}

export const AGGREGATE_LABELS: Record<AggregateFn, string> = {
  count: 'Count of rows',
  count_distinct: 'Count distinct',
  sum: 'Sum',
  avg: 'Average',
  min: 'Min',
  max: 'Max',
}

export function aggregateKey({ fn, field }: Aggregate) {
  return fn === 'count' || !field ? 'count' : `${fn}_${field}`
}

export function aggregateLabel(aggregate: Aggregate) {
  return aggregate.fn === 'count' || !aggregate.field ? AGGREGATE_LABELS.count : `${AGGREGATE_LABELS[aggregate.fn]} of ${aggregate.field}`
}

export function operatorsFor(type: ColumnType | undefined): FilterOperator[] {
  return type === 'number'
    ? ['eq', 'ne', 'lt', 'lte', 'gt', 'gte', 'in', 'not_in', 'is_null', 'is_not_null']
    : ['eq', 'ne', 'in', 'not_in', 'like', 'is_null', 'is_not_null']
}

export function aggregatesFor(type: ColumnType | undefined): AggregateFn[] {
  return type === 'number' ? ['sum', 'avg', 'min', 'max', 'count_distinct'] : ['count_distinct', 'min', 'max']
}

export const isListOperator = (operator: FilterOperator) => operator === 'in' || operator === 'not_in'
export const isNullOperator = (operator: FilterOperator) => operator === 'is_null' || operator === 'is_not_null'

/** A column is numeric when its first non-empty cell is a number. */
export function columnTypes(result: SqlResult) {
  const types = new Map<string, ColumnType>()
  if (!result.ok) return types
  result.columns.forEach((column, index) => {
    const sample = result.rows.find((row) => row[index] !== null && row[index] !== '')?.[index]
    types.set(column, typeof sample === 'number' ? 'number' : 'text')
  })
  return types
}

export function transformCount(transforms: DatasetTransforms | undefined) {
  if (!transforms) return 0
  const { shape } = transforms
  return (
    transforms.calculations.length +
    transforms.filters.length +
    shape.groupBy.length +
    shape.aggregates.length +
    shape.orderBy.length +
    (shape.limit ? 1 : 0) +
    (shape.distinct ? 1 : 0) +
    (shape.pivot ? 1 : 0)
  )
}

type Frame = { columns: string[]; rows: Cell[][] }

const REMOVE = Symbol('remove')

function calculate(calculation: Calculation, row: Cell[], columns: string[]): Cell | typeof REMOVE {
  const read = (operand: string | number): Cell => (typeof operand === 'number' ? operand : (row[columns.indexOf(operand)] ?? null))
  const left = read(calculation.operands[0])
  const right = read(calculation.operands[1])
  if (calculation.operator === 'concat') return `${left ?? ''}${right ?? ''}`
  if (typeof left !== 'number') return null
  if (calculation.operator === 'abs') return Math.abs(left)
  if (typeof right !== 'number') return null
  switch (calculation.operator) {
    case '+':
      return left + right
    case '-':
      return left - right
    case '*':
      return left * right
    case '/':
    case '%': {
      if (right !== 0) return calculation.operator === '/' ? Math.round((left / right) * 10000) / 10000 : left % right
      const onZero = calculation.onZero ?? 'empty'
      switch (onZero) {
        case 'empty':
          return null
        case 'remove':
          return REMOVE
        case 'zero':
          return 0
        default: {
          const unhandled: never = onZero
          return unhandled
        }
      }
    }
    default: {
      const unhandled: never = calculation.operator
      return unhandled
    }
  }
}

function applyCalculations(frame: Frame, calculations: Calculation[]): Frame {
  return calculations.reduce<Frame>((current, calculation) => {
    const rows: Cell[][] = []
    for (const row of current.rows) {
      const value = calculate(calculation, row, current.columns)
      if (value !== REMOVE) rows.push([...row, value])
    }
    return { columns: [...current.columns, calculation.key], rows }
  }, frame)
}

function compareCells(left: Cell, right: Cell) {
  if (left === right) return 0
  if (left === null || left === '') return 1
  if (right === null || right === '') return -1
  if (typeof left === 'number' && typeof right === 'number') return left - right
  return String(left).localeCompare(String(right), undefined, { numeric: true })
}

function matches(filter: RowFilter, cell: Cell): boolean {
  const empty = cell === null || cell === ''
  const list = () => filter.value.split(',').map((value) => value.trim())
  const target = typeof cell === 'number' ? Number(filter.value) : filter.value
  switch (filter.operator) {
    case 'is_null':
      return empty
    case 'is_not_null':
      return !empty
    case 'in':
      return list().includes(String(cell))
    case 'not_in':
      return !list().includes(String(cell))
    case 'like':
      return String(cell ?? '').toLowerCase().includes(filter.value.toLowerCase())
    case 'eq':
      return cell === target
    case 'ne':
      return cell !== target
    case 'lt':
      return !empty && compareCells(cell, target) < 0
    case 'lte':
      return !empty && compareCells(cell, target) <= 0
    case 'gt':
      return !empty && compareCells(cell, target) > 0
    case 'gte':
      return !empty && compareCells(cell, target) >= 0
    default: {
      const unhandled: never = filter.operator
      return unhandled
    }
  }
}

/** Filters on a missing column, or still waiting for a value, are skipped rather than emptying the result. */
function applyFilters(frame: Frame, filters: RowFilter[] = []): Frame {
  const active = filters
    .map((filter) => ({ filter, index: frame.columns.indexOf(filter.key) }))
    .filter(({ filter, index }) => index >= 0 && (isNullOperator(filter.operator) || filter.value.trim() !== ''))
  if (active.length === 0) return frame
  return { ...frame, rows: frame.rows.filter((row) => active.every(({ filter, index }) => matches(filter, row[index]))) }
}

function aggregateCells(fn: AggregateFn, cells: Cell[]): Cell {
  if (fn === 'count') return cells.length
  if (fn === 'count_distinct') return new Set(cells.filter((cell) => cell !== null).map(String)).size
  const numbers = cells.filter((cell): cell is number => typeof cell === 'number')
  switch (fn) {
    case 'sum':
      return numbers.reduce((total, value) => total + value, 0)
    case 'avg':
      return numbers.length ? Math.round((numbers.reduce((total, value) => total + value, 0) / numbers.length) * 100) / 100 : null
    case 'min':
    case 'max': {
      const present = cells.filter((cell) => cell !== null && cell !== '')
      if (present.length === 0) return null
      const sorted = present.toSorted(compareCells)
      return fn === 'min' ? sorted[0] : sorted[sorted.length - 1]
    }
    default: {
      const unhandled: never = fn
      return unhandled
    }
  }
}

function groupFrame(frame: Frame, groupBy: string[], aggregates: Aggregate[]): Frame {
  const keys = groupBy.filter((key) => frame.columns.includes(key))
  const keyIndexes = keys.map((key) => frame.columns.indexOf(key))
  const valid = aggregates.filter((aggregate) => aggregate.fn === 'count' || (aggregate.field && frame.columns.includes(aggregate.field)))
  const measures = valid.length ? valid : [{ fn: 'count' as const }]
  const groups = new Map<string, { keyCells: Cell[]; rows: Cell[][] }>()
  for (const row of frame.rows) {
    const keyCells = keyIndexes.map((index) => row[index])
    const id = JSON.stringify(keyCells)
    const group = groups.get(id) ?? { keyCells, rows: [] }
    group.rows.push(row)
    groups.set(id, group)
  }
  return {
    columns: [...keys, ...measures.map(aggregateKey)],
    rows: [...groups.values()].map(({ keyCells, rows }) => [
      ...keyCells,
      ...measures.map((measure) => {
        const index = measure.field ? frame.columns.indexOf(measure.field) : -1
        return aggregateCells(measure.fn, index >= 0 ? rows.map((row) => row[index]) : rows.map(() => null))
      }),
    ]),
  }
}

function distinctFrame(frame: Frame): Frame {
  const seen = new Set<string>()
  return {
    ...frame,
    rows: frame.rows.filter((row) => {
      const id = JSON.stringify(row)
      if (seen.has(id)) return false
      seen.add(id)
      return true
    }),
  }
}

/** One column per distinct `columnsFrom` value, each holding the aggregated `valuesFrom` cells for the remaining columns. */
function pivotFrame(frame: Frame, pivot: Pivot): Frame {
  const columnIndex = frame.columns.indexOf(pivot.columnsFrom)
  const valueIndex = frame.columns.indexOf(pivot.valuesFrom)
  if (columnIndex < 0 || valueIndex < 0 || columnIndex === valueIndex) return frame
  const restIndexes = frame.columns.map((_, index) => index).filter((index) => index !== columnIndex && index !== valueIndex)
  const pivotValues = [...new Set(frame.rows.map((row) => String(row[columnIndex] ?? '')))].toSorted((a, b) => compareCells(a, b))
  const groups = new Map<string, { rest: Cell[]; cells: Map<string, Cell[]>; all: Cell[] }>()
  for (const row of frame.rows) {
    const rest = restIndexes.map((index) => row[index])
    const id = JSON.stringify(rest)
    const group = groups.get(id) ?? { rest, cells: new Map<string, Cell[]>(), all: [] as Cell[] }
    const pivotValue = String(row[columnIndex] ?? '')
    group.cells.set(pivotValue, [...(group.cells.get(pivotValue) ?? []), row[valueIndex]])
    group.all.push(row[valueIndex])
    groups.set(id, group)
  }
  return {
    columns: [...restIndexes.map((index) => frame.columns[index]), ...pivotValues, ...(pivot.totals ? ['Total'] : [])],
    rows: [...groups.values()].map((group) => [
      ...group.rest,
      ...pivotValues.map((value) => aggregateCells(pivot.fn, group.cells.get(value) ?? [])),
      ...(pivot.totals ? [aggregateCells(pivot.fn, group.all)] : []),
    ]),
  }
}

function sortFrame(frame: Frame, rules: SortRule[]): Frame {
  const active = rules.map((rule) => ({ ...rule, index: frame.columns.indexOf(rule.key) })).filter((rule) => rule.index >= 0)
  if (active.length === 0) return frame
  return {
    ...frame,
    rows: frame.rows.toSorted((left, right) => {
      for (const rule of active) {
        const order = compareCells(left[rule.index], right[rule.index])
        if (order !== 0) return rule.direction === 'asc' ? order : -order
      }
      return 0
    }),
  }
}

const limitFrame = (frame: Frame, limit: number | undefined): Frame => (limit && limit > 0 ? { ...frame, rows: frame.rows.slice(0, limit) } : frame)

/** Runs a dataset's transforms in production's order: calculations, filters, group and aggregate, distinct, pivot, order, limit. */
export function applyTransforms(result: SqlResult, transforms: DatasetTransforms | undefined): SqlResult {
  if (!result.ok || !transforms) return result
  const { shape } = transforms
  let frame = applyFilters(applyCalculations(result, transforms.calculations), transforms.filters)
  const grouping = shape.groupBy.length > 0 || shape.aggregates.length > 0
  if (grouping) frame = groupFrame(frame, shape.groupBy, shape.aggregates)
  if (shape.distinct) frame = distinctFrame(frame)
  if (shape.pivot) frame = pivotFrame(frame, shape.pivot)
  frame = limitFrame(sortFrame(frame, shape.orderBy), shape.limit)
  return { ok: true, columns: frame.columns, rows: frame.rows, grouped: result.grouped || shape.groupBy.length > 0 }
}

/** What a graph plots when it sets no value: the dataset's own measure when it is already grouped, else a row count. */
export function defaultGraphValue(result: SqlResult, groupKey: string): Aggregate {
  if (!result.ok || !result.grouped) return { fn: 'count' }
  const types = columnTypes(result)
  const measure = result.columns.find((column) => column !== groupKey && types.get(column) === 'number')
  return measure ? { fn: 'sum', field: measure } : { fn: 'count' }
}

/**
 * Two columns ready to chart: `groupKey` (or the first column, when the graph sets a value on a SQL result) and the
 * aggregated value. Without a group key or value, the result passes through with only filters, sort and limit applied.
 * `labelOrder` keeps a field's natural value order when the graph sets no sort.
 */
export function graphResult(result: SqlResult, groupKey: string | undefined, query: GraphQuery = {}, labelOrder?: string[]): SqlResult {
  if (!result.ok) return result
  let frame = applyFilters(applyCalculations(result, query.calculations ?? []), query.filters)
  const key = groupKey ?? query.groupBy ?? (query.value ? frame.columns[0] : undefined)
  if (key) {
    if (!frame.columns.includes(key)) return { ok: false, error: `Column "${key}" isn't in this dataset's result.` }
    frame = groupFrame(frame, [key], [query.value ?? defaultGraphValue(result, key)])
  }
  if (query.sort) {
    const index = query.sort.by === 'label' ? 0 : frame.columns.length - 1
    frame = sortFrame(frame, [{ key: frame.columns[index], direction: query.sort.direction }])
  } else if (labelOrder) {
    const rank = (cell: Cell) => {
      const position = labelOrder.indexOf(String(cell))
      return position < 0 ? labelOrder.length : position
    }
    frame = { ...frame, rows: frame.rows.toSorted((left, right) => rank(left[0]) - rank(right[0])) }
  }
  frame = limitFrame(frame, query.limit)
  return { ok: true, columns: frame.columns, rows: frame.rows, grouped: result.grouped || Boolean(key) }
}
