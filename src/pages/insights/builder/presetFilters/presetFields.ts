import type { Dashboard, PresetOperator } from '../../../../data/dashboards'
import { FILTER_SCHEMAS, type FilterFieldType } from '../../../../data/filterFields'
import { columnTypes } from '../../../../data/transforms'
import { filterColumns } from '../dashboardFilters'
import { datasetResult, listDatasets } from '../v2/datasets'

/** A field the preset filter builder lists. `options` are a select or user field's choices. */
export type PresetField = { datasetKey: string; column: string; label: string; type: FilterFieldType; options: string[] }

const OPERATORS: Record<FilterFieldType, PresetOperator[]> = {
  text: ['contains', 'eq'],
  number: ['gte', 'lte', 'eq', 'gt', 'lt'],
  select: ['in'],
  user: ['in'],
  boolean: ['eq'],
  date: ['between'],
}

/** The operators a field offers; the first is its default. */
export const operatorsFor = (type: FilterFieldType) => OPERATORS[type]

/**
 * Every field of every dataset: Mosaic tables with a main-app schema list it in that order, including filter-only fields
 * the table doesn't carry; other datasets offer their short-list text columns and numeric columns.
 */
export function presetFields(dashboard: Dashboard): PresetField[] {
  const pickLists = filterColumns(dashboard)
  return listDatasets(dashboard).flatMap((dataset): PresetField[] => {
    const result = datasetResult(dataset, dashboard)
    if (!result.ok) return []
    const picks = pickLists.filter((column) => column.datasetKey === dataset.key)
    const optionsOf = (column: string) => picks.find((entry) => entry.column === column)?.values ?? []
    const schema = dataset.kind === 'table' ? FILTER_SCHEMAS[dataset.object.name] : undefined
    if (schema)
      return schema
        .filter((spec) => spec.mock || result.columns.includes(spec.key))
        .map((spec) => ({
          datasetKey: dataset.key,
          column: spec.key,
          label: spec.label,
          type: spec.type,
          options: spec.type === 'select' || spec.type === 'user' ? (spec.mock ? (spec.options ?? []) : optionsOf(spec.key)) : [],
        }))
    const types = columnTypes(result)
    const numeric = result.columns
      .filter((column) => column !== 'id' && types.get(column) === 'number')
      .map((column): PresetField => ({ datasetKey: dataset.key, column, label: column, type: 'number', options: [] }))
    return [...picks.map((pick): PresetField => ({ datasetKey: dataset.key, column: pick.column, label: pick.label, type: 'select', options: pick.values })), ...numeric]
  })
}
