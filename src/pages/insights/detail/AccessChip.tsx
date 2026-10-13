import { Building2, Lock, Users } from 'lucide-react'
import type { Dashboard } from '../../../data/dashboards'

/** Who can open the dashboard; company-wide wins over the member count because it's the wider audience. */
export function AccessChip({ dashboard, onClick }: { dashboard: Dashboard; onClick: () => void }) {
  const { Icon, label } =
    dashboard.generalAccess === 'company'
      ? { Icon: Building2, label: 'Everyone at Tessera' }
      : dashboard.members.length > 0
        ? { Icon: Users, label: `Shared · ${dashboard.members.length + 1}` }
        : { Icon: Lock, label: 'Private' }
  return (
    <button
      type="button"
      onClick={onClick}
      title="Manage access"
      className="inline-flex h-[22px] shrink-0 cursor-pointer items-center gap-1 rounded bg-white/10 px-1.5 text-xs font-medium text-white/70 hover:bg-white/15 hover:text-white"
    >
      <Icon className="size-3" aria-hidden />
      {label}
    </button>
  )
}
