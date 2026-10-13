import { RotateCcw, TriangleAlert } from 'lucide-react'
import type { Dashboard } from '../../../data/dashboards'
import { dataIssues } from '../../../data/dataIssues'
import { useDashboards } from '../../../data/DashboardsStore'
import type { DashboardVersion } from '../../../data/versions'
import { cn } from '../../../lib/cn'
import { formatDateTime } from '../../../lib/format'
import { Button } from '../../../ui/Button'
import { Dialog } from '../../../ui/Dialog'
import { useToast } from '../../../ui/Toast'

type VersionHistoryDialogProps = {
  open: boolean
  onClose: () => void
  dashboard: Dashboard
}

/** Changes listed per version before the rest collapse into "and N more". */
const SHOWN_CHANGES = 3

function nameOf(user: string) {
  const local = user.split('@')[0]
  return local.charAt(0).toUpperCase() + local.slice(1)
}

/** Every saved version, newest first. Any of them can be restored, even ones whose data the viewer can no longer reach. */
export function VersionHistoryDialog({ open, onClose, dashboard }: VersionHistoryDialogProps) {
  const { restoreVersion } = useDashboards()
  const toast = useToast()

  const restore = (version: DashboardVersion) => {
    restoreVersion(dashboard.id, version.id)
    const broken = dataIssues(version.content).length > 0
    toast(broken ? "Version restored. Some graphs can't load their data." : `Restored the version from ${formatDateTime(version.savedAt)}`)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} title="Version history" description="Every edit is live and saved here. Restoring adds a new version, so you can always go back.">
      <ol className="-mx-2 flex flex-col">
        {dashboard.versions.map((version, index) => (
          <VersionRow key={version.id} version={version} current={index === 0} onRestore={() => restore(version)} />
        ))}
      </ol>
    </Dialog>
  )
}

function VersionRow({ version, current, onRestore }: { version: DashboardVersion; current: boolean; onRestore: () => void }) {
  const issues = dataIssues(version.content)
  const changes = version.changes.slice(0, SHOWN_CHANGES)
  const more = version.changes.length - changes.length
  return (
    <li className={cn('flex items-start gap-3 rounded-lg px-2 py-2.5', !current && 'hover:bg-white/5')}>
      <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', current ? 'bg-tlai-mint' : 'bg-white/25')} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-sm text-white">
          {formatDateTime(version.savedAt)}
          {current && <span className="ml-2 text-xs text-tlai-mint">Current version</span>}
        </p>
        <p className="text-xs text-white/50">
          {nameOf(version.author)}
          {version.restoredFrom && ` · restored the version from ${formatDateTime(version.restoredFrom)}`}
        </p>
        <ul className="mt-1 flex flex-col gap-0.5 text-xs text-white/70">
          {changes.map((change) => (
            <li key={change} className="truncate">
              {change}
            </li>
          ))}
          {more > 0 && <li className="text-white/45">and {more} more</li>}
        </ul>
        {issues.length > 0 && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-amber-300">
            <TriangleAlert className="size-3.5 shrink-0" aria-hidden />
            {issues.length === 1 ? `Uses ${issues[0].label}, which you can't load now` : `Uses ${issues.length} datasets you can't load now`}
          </p>
        )}
      </div>
      {!current && (
        <Button variant="outline" size="xs" onClick={onRestore}>
          <RotateCcw className="size-3.5" />
          Restore
        </Button>
      )}
    </li>
  )
}
