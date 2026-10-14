import { useState } from 'react'
import { CURRENT_USER, type Dashboard } from '../../../data/dashboards'

/**
 * Each person's own view of a dashboard, saved in this browser. In production this is one row per (user, dashboard).
 * Filter values and the last page are stored apart so the canvas and the builder can each own theirs.
 */
const storageKey = (dashboardId: string, part: 'filters' | 'page') => `tessera-insights-view:${CURRENT_USER}:${dashboardId}:${part}`

function read<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key)
    return stored ? (JSON.parse(stored) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore */
  }
}

export type PersonalFilterValues = Record<string, string[]>

/**
 * Values a person picked on unlocked filters while viewing. Entries for deleted filters are simply never read.
 * Without `persist` (an editor previewing), picks start from the dashboard's defaults and are dropped on leaving.
 */
export function usePersonalFilters(dashboardId: string, persist = true) {
  const key = storageKey(dashboardId, 'filters')
  const [values, setValues] = useState<PersonalFilterValues>(() => (persist ? read(key, {}) : {}))
  const save = (next: PersonalFilterValues) => {
    setValues(next)
    if (persist) write(key, next)
  }
  return {
    values,
    setFilterValues: (filterId: string, picked: string[]) => save({ ...values, [filterId]: picked }),
    setManyFilterValues: (picked: PersonalFilterValues) => save({ ...values, ...picked }),
    reset: (filterIds: string[]) => save(Object.fromEntries(Object.entries(values).filter(([filterId]) => !filterIds.includes(filterId)))),
  }
}

export function usePersonalPage(dashboardId: string) {
  const key = storageKey(dashboardId, 'page')
  const [pageId, setPageId] = useState<string | null>(() => read(key, null))
  const save = (next: string) => {
    setPageId(next)
    write(key, next)
  }
  return [pageId, save] as const
}

/** The filters as this person sees them: their own picks on unlocked filters, the editor's defaults everywhere else. */
export function withPersonalValues(dashboard: Dashboard, values: PersonalFilterValues): Dashboard {
  if (!dashboard.filters?.length) return dashboard
  return { ...dashboard, filters: dashboard.filters.map((filter) => (!filter.locked && !filter.fixed && values[filter.id] ? { ...filter, values: values[filter.id] } : filter)) }
}

const sameValues = (a: string[], b: string[]) => a.length === b.length && a.every((value) => b.includes(value))

/** Filters on this page where the person's picks differ from the defaults everyone else opens with. */
export function personalOverrides(dashboard: Dashboard, values: PersonalFilterValues): string[] {
  return (dashboard.filters ?? []).filter((filter) => !filter.locked && !filter.fixed && values[filter.id] && !sameValues(values[filter.id], filter.values)).map((filter) => filter.id)
}
