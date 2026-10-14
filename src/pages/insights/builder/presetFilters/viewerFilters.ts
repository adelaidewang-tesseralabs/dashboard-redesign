import type { Dashboard, DashboardFilter } from '../../../../data/dashboards'
import type { PersonalFilterValues } from '../usePersonalView'
import { itemDatasetKey } from '../v2/datasets'
import { operatorsFor, presetFields } from './presetFields'

/** A preset that picks which fields viewers get. Locked ones only constrain the data, so they don't. */
export const curatesViewerFields = (filter: DashboardFilter) => !filter.fixed && !filter.locked && filter.values.length > 0

// Open filters aren't stored, so their ids must stay the same across visits for a viewer's picks to come back.
const openFilterId = (datasetKey: string, column: string) => `open:${datasetKey}:${column}`

const curatedDatasets = (page: Dashboard) => new Set((page.filters ?? []).filter(curatesViewerFields).map((filter) => filter.datasetKey))

/**
 * The page's filters as viewers get them, per dataset: with no preset, every field is offered as an empty filter;
 * with one, only the presets (and locked filters) are. `full` is the whole dashboard, whose fields span every page.
 */
export function withViewerFilters(page: Dashboard, full: Dashboard): Dashboard {
  const filters = page.filters ?? []
  const curated = curatedDatasets(page)
  const onPage = new Set((page.widgets ?? []).map(itemDatasetKey))
  const taken = (datasetKey: string, column: string) => filters.some((filter) => !filter.fixed && filter.datasetKey === datasetKey && filter.column === column)
  const open = presetFields(full)
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
export function staleOpenPicks(page: Dashboard, values: PersonalFilterValues): { filterIds: string[]; datasetKeys: string[] } {
  const curated = [...curatedDatasets(page)]
  const stale = Object.keys(values).flatMap((filterId) => {
    const datasetKey = values[filterId].length > 0 ? curated.find((key) => filterId.startsWith(openFilterId(key, ''))) : undefined
    return datasetKey ? [{ filterId, datasetKey }] : []
  })
  return {
    filterIds: stale.map((entry) => entry.filterId),
    datasetKeys: [...new Set(stale.map((entry) => entry.datasetKey))],
  }
}
