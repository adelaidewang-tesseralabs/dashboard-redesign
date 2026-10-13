import { TriangleAlert } from 'lucide-react'
import type { Dashboard } from '../../../data/dashboards'
import { dataIssues, problemMessage } from '../../../data/dataIssues'

type DataIssuesBannerProps = {
  dashboard: Dashboard
  /** Editors get a way back to a working version. */
  onOpenHistory?: () => void
}

/** Shown whenever the dashboard reads data the viewer can't reach, e.g. after restoring a version built on a dropped or restricted table. */
export function DataIssuesBanner({ dashboard, onOpenHistory }: DataIssuesBannerProps) {
  const issues = dataIssues(dashboard)
  if (issues.length === 0) return null
  const broken = new Set(issues.flatMap((issue) => issue.widgetIds)).size

  return (
    <div role="alert" className="flex shrink-0 items-start gap-2 border-b border-red-400/20 bg-red-500/10 px-5 py-2 text-xs text-red-100">
      <TriangleAlert className="mt-px size-3.5 shrink-0 text-red-300" aria-hidden />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="font-medium">{broken === 0 ? 'Some datasets are unavailable.' : `${broken} ${broken === 1 ? "graph can't" : "graphs can't"} load.`}</p>
        {issues.map((issue) => (
          <p key={`${issue.reason}:${issue.label}`} className="text-red-100/75">
            {problemMessage(issue)}
          </p>
        ))}
      </div>
      {onOpenHistory && (
        <button type="button" onClick={onOpenHistory} className="shrink-0 cursor-pointer font-medium text-red-100 underline-offset-2 hover:underline">
          Version history
        </button>
      )}
    </div>
  )
}
