import type { Dashboard, DashboardFilter, PresetOperator } from '../../../../data/dashboards'
import type { PersonalFilterValues } from '../usePersonalView'

/** Viewers can only narrow an editor's preset. A value, a text match and a single day leave nothing narrower to pick. */
export function viewerCanNarrow(operator: PresetOperator, preset: string[]): boolean {
  if (preset.length === 0) return true
  switch (operator) {
    case 'in':
    case 'gt':
    case 'gte':
    case 'lt':
    case 'lte':
      return true
    case 'between':
      return preset.length === 2 && preset[0] !== preset[1]
    case 'eq':
    case 'contains':
      return false
    default: {
      const unhandled: never = operator
      return unhandled
    }
  }
}

const atLeast = (picked: string, bound: string) => String(Math.max(Number(picked), Number(bound)))
const atMost = (picked: string, bound: string) => String(Math.min(Number(picked), Number(bound)))

/** What a viewer's pick filters by: the pick clamped inside the preset, or the preset itself when nothing of the pick fits. */
export function narrowValues(operator: PresetOperator, preset: string[], picked: string[] | undefined): string[] {
  if (!picked?.length) return preset
  if (preset.length === 0) return picked
  if (!viewerCanNarrow(operator, preset)) return preset
  const [bound, upper] = preset
  const [first, second = first] = picked
  if (operator === 'in') {
    const kept = picked.filter((value) => preset.includes(value))
    return kept.length ? kept : preset
  }
  if (operator === 'between') {
    const from = first > bound ? first : bound
    const to = second < upper ? second : upper
    return from > to ? preset : picked.length === 1 ? [from] : [from, to]
  }
  if (Number.isNaN(Number(first))) return preset
  return [operator === 'gt' || operator === 'gte' ? atLeast(first, bound) : atMost(first, bound)]
}

const narrowable = (filter: DashboardFilter) => !filter.locked && !filter.fixed

/** A viewer's picks as they actually apply: each clamped to its filter's preset. */
export function narrowedPicks(dashboard: Dashboard, values: PersonalFilterValues): PersonalFilterValues {
  return Object.fromEntries(
    (dashboard.filters ?? [])
      .filter((filter) => narrowable(filter) && values[filter.id])
      .map((filter) => [filter.id, narrowValues(filter.operator ?? 'in', filter.values, values[filter.id])]),
  )
}
