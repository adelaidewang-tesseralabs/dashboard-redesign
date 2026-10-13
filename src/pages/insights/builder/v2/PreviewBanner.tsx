import { Eye, TriangleAlert } from 'lucide-react'
import type { Dashboard } from '../../../../data/dashboards'
import { widgetProblem } from '../../../../data/dataIssues'
import { nameOf } from '../../../../lib/people'
import { PreviewPersonPicker } from './PreviewPersonPicker'

type PreviewBannerProps = {
  dashboard: Dashboard
  person: string
  onPersonChange: (user: string) => void
  onGrantAccess?: (user: string) => void
  onExit: () => void
}

/** Graphs on any page that load for the editor but not for `person`, and the datasets they're missing. */
function blockedFor(dashboard: Dashboard, person: string) {
  const labels = new Set<string>()
  let count = 0
  for (const item of dashboard.widgets ?? []) {
    const problem = widgetProblem(item, dashboard, person)
    if (problem?.reason !== 'denied' || widgetProblem(item, dashboard)) continue
    count++
    labels.add(problem.label)
  }
  return { count, labels: [...labels] }
}

export function PreviewBanner({ dashboard, person, onPersonChange, onGrantAccess, onExit }: PreviewBannerProps) {
  const blocked = blockedFor(dashboard, person)
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-amber-300/30 bg-amber-400/15 px-5 py-1.5 text-xs text-amber-100">
      <Eye className="size-3.5" />
      Viewing as
      <PreviewPersonPicker dashboard={dashboard} person={person} onChange={onPersonChange} onGrantAccess={onGrantAccess} />
      as a viewer
      {blocked.count > 0 && (
        <span className="flex min-w-0 items-center gap-1.5 font-medium text-amber-200">
          <span className="text-amber-100/40">·</span>
          <TriangleAlert className="size-3.5 shrink-0" />
          <span className="truncate">
            {blocked.count} graph{blocked.count === 1 ? '' : 's'} won't load for {nameOf(person)}: no access to {blocked.labels.join(', ')}
          </span>
        </span>
      )}
      <button type="button" onClick={onExit} className="ml-auto shrink-0 cursor-pointer font-medium text-amber-100 underline-offset-2 hover:underline">
        Back to editing
      </button>
    </div>
  )
}
