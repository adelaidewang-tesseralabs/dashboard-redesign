import type { Dashboard } from './dashboards'

export const ROLES = ['owner', 'editor', 'viewer'] as const
export type Role = (typeof ROLES)[number]
/** `null` means the user can't open the dashboard. */
export type Access = Role | null

export const ROLE_LABELS: Record<Role, string> = { owner: 'Owner', editor: 'Can edit', viewer: 'Can view' }

export type AccessAction =
  | 'view'
  | 'edit'
  | 'share'
  | 'changeGeneralAccess'
  | 'transferOwnership'
  | 'archive'
  | 'delete'
  | 'editDetails'

/** Owner, then a named member's role, then company-wide view access. */
export function roleOf(dashboard: Dashboard, user: string): Access {
  if (dashboard.owner === user) return 'owner'
  const member = dashboard.members.find((entry) => entry.user === user)
  if (member) return member.role
  return dashboard.generalAccess === 'company' ? 'viewer' : null
}

/** Editors can share but not widen access: only the owner turns on company-wide view, transfers, archives or deletes. */
export function can(role: Access, action: AccessAction): boolean {
  if (role === null) return false
  switch (action) {
    case 'view':
      return true
    case 'edit':
    case 'share':
    case 'editDetails':
      return role !== 'viewer'
    case 'changeGeneralAccess':
    case 'transferOwnership':
    case 'archive':
    case 'delete':
      return role === 'owner'
    default: {
      const unhandled: never = action
      return unhandled
    }
  }
}
