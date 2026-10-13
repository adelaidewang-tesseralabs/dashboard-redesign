import { useSearchParams } from 'react-router-dom'
import type { FilterValues } from '../../../ui/FilterBuilder'
import { DEFAULT_SORT, FILTER_KEYS, SORT_FIELDS, type DashboardSort, type SortField } from './dashboardQuery'

export type DashboardsView = 'table' | 'grid'

export const PAGE_SIZES = [25, 50, 100]
const DEFAULT_PAGE_SIZE = 25
const VIEW_KEY = 'tessera-insights-dashboards-view'

function readStoredView(): DashboardsView {
  try {
    return localStorage.getItem(VIEW_KEY) === 'grid' ? 'grid' : 'table'
  } catch {
    return 'table'
  }
}

function parseSort(value: string | null): DashboardSort {
  const [field, direction] = value?.split(':') ?? []
  if (!SORT_FIELDS.some((option) => option.id === field)) return DEFAULT_SORT
  return { field: field as SortField, direction: direction === 'asc' ? 'asc' : 'desc' }
}

/**
 * Search, filters, sort, archived, page and view all live in the URL, so a narrowed list survives
 * refresh and can be shared. The view mode also falls back to localStorage so it sticks across visits.
 */
export function useDashboardListState() {
  const [params, setParams] = useSearchParams()

  const filters: FilterValues = Object.fromEntries(
    FILTER_KEYS.map((key) => [key, params.get(key)?.split(',').filter(Boolean) ?? []]),
  )
  const viewParam = params.get('view')
  const sizeParam = Number(params.get('size'))

  const state = {
    search: params.get('q') ?? '',
    filters,
    sort: parseSort(params.get('sort')),
    archived: params.get('archived') === '1',
    page: Math.max(0, Number(params.get('page') ?? 1) - 1),
    pageSize: PAGE_SIZES.includes(sizeParam) ? sizeParam : DEFAULT_PAGE_SIZE,
    view: viewParam === 'grid' || viewParam === 'table' ? viewParam : readStoredView(),
  }

  const update = (patch: Record<string, string | null>, resetPage = true) =>
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        for (const [key, value] of Object.entries(patch)) {
          if (value) next.set(key, value)
          else next.delete(key)
        }
        if (resetPage) next.delete('page')
        return next
      },
      { replace: true },
    )

  const filterPatch = (values: FilterValues) =>
    Object.fromEntries(FILTER_KEYS.map((key) => [key, values[key]?.length ? values[key].join(',') : null]))

  return {
    ...state,
    hasActiveFilters: Object.values(filters).some((values) => values?.length),
    setSearch: (value: string) => update({ q: value || null }),
    setFilters: (values: FilterValues) => update(filterPatch(values)),
    setSort: (sort: DashboardSort) => {
      const isDefault = sort.field === DEFAULT_SORT.field && sort.direction === DEFAULT_SORT.direction
      update({ sort: isDefault ? null : `${sort.field}:${sort.direction}` })
    },
    setArchived: (archived: boolean) => update({ archived: archived ? '1' : null }),
    setPage: (value: number) => update({ page: value > 0 ? String(value + 1) : null }, false),
    setPageSize: (value: number) => update({ size: value === DEFAULT_PAGE_SIZE ? null : String(value) }),
    setView: (value: DashboardsView) => {
      try {
        localStorage.setItem(VIEW_KEY, value)
      } catch {
        /* ignore */
      }
      update({ view: value }, false)
    },
    showAll: () => update({ q: null, archived: null, ...filterPatch({}) }),
  }
}
