import type { Dashboard, DashboardFilter } from '../../../../data/dashboards'
import type { PersonalFilterValues } from '../usePersonalView'
import { itemDatasetKey } from '../v2/datasets'
import { operatorsFor, presetFields, type PresetField } from './presetFields'

/** A list preset with every value ticked: it filters nothing. */
export function coversAllValues(values: string[], field: Pick<PresetField, 'type' | 'options'>): boolean {
  const listValued = field.type === 'select' || field.type === 'user'
  return listValued && field.options.length > 0 && field.options.every((option) => values.includes(option))
}

const fieldOf = (filter: DashboardFilter, fields: PresetField[]) => fields.find((field) => field.datasetKey === filter.datasetKey && field.column === filter.column)

/** Viewers get a preset that filters nothing as if there were none. */
const filtersNothing = (filter: DashboardFilter, fields: PresetField[]) => {
  const field = fieldOf(filter, fields)
  return !filter.fixed && !filter.locked && !!field && coversAllValues(filter.values, field)
}

/** A preset that picks which fields viewers get. Locked ones only constrain the data, and ones that filter nothing don't count. */
export const curatesViewerFields = (filter: DashboardFilter, fields: PresetField[]) =>
  !filter.fixed && !filter.locked && filter.values.length > 0 && !filtersNothing(filter, fields)

// Open filters aren't stored, so their ids must stay the same across visits for a viewer's picks to come back.
const openFilterId = (datasetKey: string, column: string) => `open:${datasetKey}:${column}`

const curatedDatasets = (page: Dashboard, fields: PresetField[]) =>
  new Set((page.filters ?? []).filter((filter) => curatesViewerFields(filter, fields)).map((filter) => filter.datasetKey))

/**
 * The page's filters as viewers get them, per dataset: with no preset, every field is offered as an empty filter;
 * with one, only the presets (and locked filters) are. `full` is the whole dashboard, whose fields span every page.
 */
export function withViewerFilters(page: Dashboard, full: Dashboard): Dashboard {
  const fields = presetFields(full)
  // Kept under its own id, emptied, so saved filters and picks that set it still apply.
  const filters = (page.filters ?? []).map((filter) => (filtersNothing(filter, fields) ? { ...filter, values: [] } : filter))
  const curated = curatedDatasets(page, fields)
  const onPage = new Set((page.widgets ?? []).map(itemDatasetKey))
  const taken = (datasetKey: string, column: string) => filters.some((filter) => !filter.fixed && filter.datasetKey === datasetKey && filter.column === column)
  const open = fields
    .filter((field) => onPage.has(field.datasetKey) && !curated.has(field.datasetKey) && !taken(field.datasetKey, field.column))
    .map(
      (field): DashboardFilter => ({
        id: openFilterId(field.datasetKey, field.column),
        datasetKey: field.datasetKey,
        column: field.column,
        label: field.label,
        values: [],
        operator: operatorsFor(field.type)[0],
      }),
    )
  const kept = filters.filter((filter) => !curated.has(filter.datasetKey) || filter.fixed || filter.locked || filter.values.length > 0)
  return { ...page, filters: [...kept, ...open] }
}

/** A viewer's picks on open filters of datasets that editors have since given presets, by dataset. */
export function staleOpenPicks(page: Dashboard, full: Dashboard, values: PersonalFilterValues): { filterIds: string[]; datasetKeys: string[] } {
  const curated = [...curatedDatasets(page, presetFields(full))]
  const stale = Object.keys(values).flatMap((filterId) => {
    const datasetKey = values[filterId].length > 0 ? curated.find((key) => filterId.startsWith(openFilterId(key, ''))) : undefined
    return datasetKey ? [{ filterId, datasetKey }] : []
  })
  return {
    filterIds: stale.map((entry) => entry.filterId),
    datasetKeys: [...new Set(stale.map((entry) => entry.datasetKey))],
  }
}
