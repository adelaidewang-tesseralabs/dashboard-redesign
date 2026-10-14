import type { DashboardFilter, SavedFilter } from '../../../../data/dashboards'
import { narrowValues } from './narrowPresets'

const sameValues = (a: string[], b: string[]) => a.length === b.length && a.every((value) => b.includes(value))

/** Whether the viewer's filters on this page are exactly what `savedFilter` sets them to. */
export function matchesSavedFilter(savedFilter: SavedFilter, filters: DashboardFilter[]): boolean {
  return filters.every((filter) => sameValues(savedFilter.values[filter.id] ?? [], filter.values))
}

/**
 * A saved filter from this page that no longer applies as saved: a field it sets is gone for viewers, or its values
 * now fall outside the editors' presets. On another page, missing fields are expected, so it's never out of date there.
 */
export function savedFilterOutdated(savedFilter: SavedFilter, filters: DashboardFilter[], presets: Record<string, string[]>, pageId: string | undefined): boolean {
  if (savedFilter.pageId && savedFilter.pageId !== pageId) return false
  return Object.entries(savedFilter.values).some(([filterId, values]) => {
    if (values.length === 0) return false
    const filter = filters.find((entry) => entry.id === filterId)
    return !filter || !sameValues(narrowValues(filter.operator ?? 'in', presets[filterId] ?? [], values), values)
  })
}
