import { roleOf } from '../../../../data/access'
import { CURRENT_USER, TEAMMATES, type Dashboard } from '../../../../data/dashboards'
import { useRoleOverride, type RoleOverride } from '../../../../lib/roleOverride'
import { usePreviewPerson } from '../previewPerson'

/**
 * Who a prototype role switch stands for. Acting as a role you don't hold means being someone else, so it's a member
 * with that role (the owner, for owner), whose own saved filters and picks replace yours.
 */
function standIn(dashboard: Dashboard, override: RoleOverride): string {
  if (override === 'actual' || override === 'none' || roleOf(dashboard, CURRENT_USER) === override) return CURRENT_USER
  if (override === 'owner') return dashboard.owner
  const member = dashboard.members.find((entry) => entry.role === override && entry.user !== CURRENT_USER)
  const outsider = TEAMMATES.find((user) => user !== CURRENT_USER && user !== dashboard.owner && !dashboard.members.some((entry) => entry.user === user))
  return member?.user ?? outsider ?? CURRENT_USER
}

/** The person whose saved filters and filter picks the dashboard shows: whoever is previewed, else the role's stand-in. */
export function useFilterViewer(dashboard: Dashboard): string {
  const override = useRoleOverride()
  return usePreviewPerson() ?? standIn(dashboard, override)
}
