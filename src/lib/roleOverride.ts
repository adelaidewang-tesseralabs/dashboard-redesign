import { useSyncExternalStore } from 'react'
import { roleOf, type Access } from '../data/access'
import { CURRENT_USER, type Dashboard } from '../data/dashboards'

export const ROLE_OVERRIDES = ['actual', 'owner', 'editor', 'viewer', 'none'] as const
export type RoleOverride = (typeof ROLE_OVERRIDES)[number]

export const ROLE_OVERRIDE_LABELS: Record<RoleOverride, string> = {
  actual: 'My actual role',
  owner: 'Owner',
  editor: 'Editor',
  viewer: 'Viewer',
  none: 'No access',
}

/** Deliberately not persisted: every page load starts as the owner, whatever role was last demoed. */
let current: RoleOverride = 'owner'
const listeners = new Set<() => void>()

function read(): RoleOverride {
  return current
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function setRoleOverride(next: RoleOverride) {
  current = next
  listeners.forEach((listener) => listener())
}

/** Prototype-only: act as a role on every dashboard to demo what it can and can't do. */
export function useRoleOverride() {
  return useSyncExternalStore(subscribe, read)
}

export function effectiveRole(dashboard: Dashboard, override: RoleOverride): Access {
  switch (override) {
    case 'actual':
      return roleOf(dashboard, CURRENT_USER)
    case 'none':
      return null
    case 'owner':
    case 'editor':
    case 'viewer':
      return override
    default: {
      const unhandled: never = override
      return unhandled
    }
  }
}

export function useEffectiveRole(dashboard: Dashboard): Access {
  return effectiveRole(dashboard, useRoleOverride())
}
