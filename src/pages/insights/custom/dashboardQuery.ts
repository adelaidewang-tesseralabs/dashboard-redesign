import { roleOf } from '../../../data/access'
import { CURRENT_USER, workstreamNames, type Dashboard } from '../../../data/dashboards'
import type { FilterField, FilterValues } from '../../../ui/FilterBuilder'

export type SortField = 'updated' | 'name' | 'score'
export type SortDirection = 'asc' | 'desc'
export type DashboardSort = { field: SortField; direction: SortDirection }

export const DEFAULT_SORT: DashboardSort = { field: 'updated', direction: 'desc' }

export const SORT_FIELDS: { id: SortField; label: string }[] = [
  { id: 'updated', label: 'Last updated' },
  { id: 'name', label: 'Name' },
  { id: 'score', label: 'Quality score' },
]

export const FILTER_KEYS = ['favorites', 'ownership', 'owner', 'workstream', 'quality'] as const

type QualityStatus = 'on-target' | 'below-target' | 'not-executed'

function qualityStatus(dashboard: Dashboard): QualityStatus {
  if (dashboard.qualityScore == null) return 'not-executed'
  return dashboard.qualityScore >= dashboard.targetScore ? 'on-target' : 'below-target'
}

export function buildFilterFields(dashboards: Dashboard[]): FilterField[] {
  const owners = [...new Set(dashboards.map((dashboard) => dashboard.owner))].sort()
  return [
    { key: 'favorites', label: 'Favorites', single: true, options: [{ value: 'favorited', label: 'Favorited' }] },
    {
      key: 'ownership',
      label: 'Ownership',
      single: true,
      options: [
        { value: 'owned', label: 'Owned by me' },
        { value: 'shared', label: 'Shared with me' },
        { value: 'company', label: 'Everyone at Tessera' },
      ],
    },
    {
      key: 'owner',
      label: 'Owner',
      options: owners.map((email) => ({ value: email, label: email === CURRENT_USER ? `${email} (you)` : email })),
    },
    { key: 'workstream', label: 'Workstream', options: workstreamNames(dashboards).map((name) => ({ value: name, label: name })) },
    {
      key: 'quality',
      label: 'Quality',
      options: [
        { value: 'on-target', label: 'On target' },
        { value: 'below-target', label: 'Below target' },
        { value: 'not-executed', label: 'Not executed' },
      ],
    },
  ]
}

function matchesFilters(dashboard: Dashboard, values: FilterValues, favoriteIds: string[]) {
  const { favorites = [], ownership = [], owner = [], workstream = [], quality = [] } = values
  if (favorites.includes('favorited') && !favoriteIds.includes(dashboard.id)) return false
  if (ownership.includes('owned') && dashboard.owner !== CURRENT_USER) return false
  if (ownership.includes('shared') && !dashboard.members.some((member) => member.user === CURRENT_USER)) return false
  if (ownership.includes('company') && dashboard.generalAccess !== 'company') return false
  if (owner.length && !owner.includes(dashboard.owner)) return false
  if (workstream.length && !workstream.includes(dashboard.workstream ?? '')) return false
  if (quality.length && !quality.includes(qualityStatus(dashboard))) return false
  return true
}

function matchesSearch(dashboard: Dashboard, search: string) {
  const needle = search.trim().toLowerCase()
  if (!needle) return true
  return [dashboard.name, dashboard.description, dashboard.workstream].some((field) => field?.toLowerCase().includes(needle))
}

function compareDashboards(a: Dashboard, b: Dashboard, field: SortField) {
  switch (field) {
    case 'name':
      return a.name.localeCompare(b.name)
    case 'updated':
      return a.updatedAt.localeCompare(b.updatedAt)
    case 'score':
      // Not-executed dashboards sort below every scored one.
      return (a.qualityScore ?? -1) - (b.qualityScore ?? -1)
    default: {
      const exhaustive: never = field
      return exhaustive
    }
  }
}

export function queryDashboards(
  dashboards: Dashboard[],
  { search, filters, archived, sort }: { search: string; filters: FilterValues; archived: boolean; sort: DashboardSort },
  favoriteIds: string[],
) {
  const sign = sort.direction === 'asc' ? 1 : -1
  return dashboards
    .filter((dashboard) => roleOf(dashboard, CURRENT_USER) !== null)
    .filter((dashboard) => dashboard.archived === archived && matchesFilters(dashboard, filters, favoriteIds) && matchesSearch(dashboard, search))
    .toSorted((a, b) => sign * compareDashboards(a, b, sort.field))
}
