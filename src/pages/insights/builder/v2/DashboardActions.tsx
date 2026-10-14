import { useEffect, useState, type ReactNode } from 'react'
import { Check, Eye, EyeOff, Pencil, RefreshCw } from 'lucide-react'
import type { Dashboard } from '../../../../data/dashboards'
import { useDashboards } from '../../../../data/DashboardsStore'
import { cn } from '../../../../lib/cn'
import { formatRelative } from '../../../../lib/format'
import { Button } from '../../../../ui/Button'
import { useToast } from '../../../../ui/Toast'

/** How long the widgets show their loading state, so a refresh reads as a refresh. */
const REFRESH_MS = 900

type DashboardActionsProps = {
  dashboard: Dashboard
  previewing: boolean
  /** Omitted for viewers, who only ever see the viewer layout. */
  onPreviewChange?: (previewing: boolean) => void
  refreshing: boolean
  onRefreshingChange: (refreshing: boolean) => void
  /** Favorite, share and more — placed between refresh and preview. */
  iconActions?: ReactNode
  /** Final builder: preview is the default, so the switch reads "Edit" / "Done" instead of an eye icon. */
  labeledModeSwitch?: boolean
}

/** Builder header actions: refresh, page icon actions and "View as viewer". Every edit is live, so there's nothing to publish. */
export function DashboardActions({ dashboard, previewing, onPreviewChange, refreshing, onRefreshingChange, iconActions, labeledModeSwitch = false }: DashboardActionsProps) {
  const { refresh } = useDashboards()
  const toast = useToast()
  const refreshedLabel = useRefreshedLabel(dashboard)

  const startRefresh = () => {
    onRefreshingChange(true)
    window.setTimeout(() => {
      refresh(dashboard.id)
      onRefreshingChange(false)
      toast('Dashboard refreshed')
    }, REFRESH_MS)
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs whitespace-nowrap text-white/45">{refreshing ? 'Refreshing…' : refreshedLabel}</span>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Refresh dashboard"
        title="Refresh dashboard"
        disabled={refreshing}
        onClick={startRefresh}
        className="size-8"
      >
        <RefreshCw className={cn('size-4', refreshing && 'animate-spin')} />
      </Button>
      {iconActions}
      {onPreviewChange && labeledModeSwitch && (
        <>
          <span className="mx-1 h-5 w-px bg-white/10" />
          <Button variant={previewing ? 'default' : 'outline'} size="sm" onClick={() => onPreviewChange(!previewing)}>
            {previewing ? <Pencil className="size-3.5" /> : <Check className="size-3.5" />}
            {previewing ? 'Edit' : 'Done'}
          </Button>
        </>
      )}
      {onPreviewChange && !labeledModeSwitch && (
        <>
          <span className="mx-1 h-5 w-px bg-white/10" />
          <Button
            variant={previewing ? 'default' : 'outline'}
            size="icon"
            aria-pressed={previewing}
            aria-label={previewing ? 'Back to editing' : 'View as viewer'}
            title={previewing ? 'Back to editing' : 'View as viewer'}
            onClick={() => onPreviewChange(!previewing)}
            className="size-8"
          >
            {previewing ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </Button>
        </>
      )}
    </div>
  )
}

function timeAgo(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  return `${Math.round(minutes / 60)} h ago`
}

/** Re-renders every 30s so "just now" ages without another refresh. */
function useRefreshedLabel(dashboard: Dashboard) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const timer = window.setInterval(() => setTick((tick) => tick + 1), 30000)
    return () => window.clearInterval(timer)
  }, [])
  if (dashboard.refreshedAt) return `Refreshed ${timeAgo(dashboard.refreshedAt)}`
  return dashboard.lastExecution ? `Refreshed ${formatRelative(dashboard.lastExecution)}` : 'Not refreshed yet'
}
