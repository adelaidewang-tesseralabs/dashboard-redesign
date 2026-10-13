import { useSyncExternalStore } from 'react'

const RECENT_KEY = 'insights-prototype.share-recent'
const RECENT_LIMIT = 5
const listeners = new Set<() => void>()

let recent: string[] = readRecent()
/** Not persisted: dashboards themselves reset on reload, so their removal history must too. */
let removed: Record<string, string[]> = {}

function readRecent(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

function emit() {
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Most recent first, so the person you just invited tops the list next time. */
export function rememberRecent(emails: string[]) {
  recent = [...emails.toReversed(), ...recent.filter((user) => !emails.includes(user))].slice(0, RECENT_LIMIT)
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent))
  emit()
}

export function rememberRemoved(dashboardId: string, user: string) {
  removed = { ...removed, [dashboardId]: [user, ...(removed[dashboardId] ?? []).filter((item) => item !== user)] }
  emit()
}

export function forgetRemoved(dashboardId: string, users: string[]) {
  const current = removed[dashboardId]
  if (!current?.some((user) => users.includes(user))) return
  removed = { ...removed, [dashboardId]: current.filter((user) => !users.includes(user)) }
  emit()
}

export function useRecentInvitees(): string[] {
  return useSyncExternalStore(subscribe, () => recent)
}

const NONE: string[] = []

export function useRemovedMembers(dashboardId: string): string[] {
  return useSyncExternalStore(subscribe, () => removed[dashboardId] ?? NONE)
}
