import { ChartColumn, Plus } from 'lucide-react'
import { Button } from '../../../ui/Button'

type DashboardsEmptyStateProps = {
  hasDashboards: boolean
  archived: boolean
  isNarrowed: boolean
  onCreate: () => void
  onShowAll: () => void
}

/** Same states as loom's workflows list: nothing created yet, nothing archived, or nothing matching. */
export function DashboardsEmptyState({ hasDashboards, archived, isNarrowed, onCreate, onShowAll }: DashboardsEmptyStateProps) {
  if (!hasDashboards) {
    return (
      <div className="mx-auto flex max-w-96 flex-col items-center gap-3 py-16 text-center">
        <span className="flex rounded-lg bg-white/10 p-2">
          <ChartColumn className="size-5 text-white" />
        </span>
        <p className="text-sm font-medium text-white">No Dashboards Yet</p>
        <p className="text-xs text-white/60">Group data checks into a dashboard to track quality scores over time.</p>
        <Button variant="outline" onClick={onCreate}>
          <Plus className="size-4" />
          Create Dashboard
        </Button>
      </div>
    )
  }

  const message = isNarrowed
    ? 'No dashboards match your current filter.'
    : archived
      ? 'No archived dashboards.'
      : 'No dashboards here.'

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-white/10 py-16 text-center">
      <p className="text-sm text-white/60">{message}</p>
      {(isNarrowed || archived) && (
        <Button variant="outline" size="sm" onClick={onShowAll}>
          Show all dashboards
        </Button>
      )}
    </div>
  )
}
