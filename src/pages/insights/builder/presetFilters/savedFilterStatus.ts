import type { DashboardFilter, SavedFilter } from '../../../../data/dashboards'
import { narrowValues } from './narrowPresets'

const sameValues = (a: string[], b: string[]) => a.length === b.length && a.every((value) => b.includes(value))

/** What applying `savedFilter` sets `filter` to: its saved values, narrowed to the editors' preset. */
export const appliedValues = (savedFilter: SavedFilter, filter: DashboardFilter, presets: Record<string, string[]>) =>
  narrowValues(filter.operator ?? 'in', presets[filter.id] ?? [], savedFilter.values[filter.id] ?? [])

/** Whether the viewer's filters on this page are what applying `savedFilter` sets them to. */
export function matchesSavedFilter(savedFilter: SavedFilter, filters: DashboardFilter[], presets: Record<string, string[]>): boolean {
  return filters.every((filter) => sameValues(appliedValues(savedFilter, filter, presets), filter.values))
}

/**
 * Why a saved filter from this page no longer applies as saved, or undefined when it does: a field it sets is gone for
 * viewers, or some of its values now fall outside the editors' presets. On another page missing fields are expected,
 * so it's never out of date there. `labelOf` names a filter by id, including ones no longer on the page.
 */
export function savedFilterOutdated(
  savedFilter: SavedFilter,
  filters: DashboardFilter[],
  presets: Record<string, string[]>,
  pageId: string | undefined,
  labelOf: (filterId: string) => string,
): string | undefined {
  if (savedFilter.pageId && savedFilter.pageId !== pageId) return undefined
  const reasons = Object.entries(savedFilter.values).flatMap(([filterId, values]) => {
    if (values.length === 0) return []
    const filter = filters.find((entry) => entry.id === filterId)
    if (!filter) return [`${labelOf(filterId)} is no longer a filter here`]
    const applied = appliedValues(savedFilter, filter, presets)
    const dropped = values.filter((value) => !applied.includes(value))
    return dropped.length ? [`${filter.label} no longer includes ${dropped.join(', ')}`] : []
  })
  if (reasons.length === 0) return undefined
  return reasons.length === 1 ? reasons[0] : `${reasons[0]}, +${reasons.length - 1} more`
}
