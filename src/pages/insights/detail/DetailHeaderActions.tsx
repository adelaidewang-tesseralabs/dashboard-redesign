import { Ellipsis, FileOutput, History, Send, Settings, Star } from 'lucide-react'
import { can, type Access } from '../../../data/access'
import type { Dashboard } from '../../../data/dashboards'
import { useDashboards } from '../../../data/DashboardsStore'
import { cn } from '../../../lib/cn'
import { formatDateTime } from '../../../lib/format'
import { headerActionClass } from '../../../ui/Button'
import { Menu, type MenuEntry } from '../../../ui/Menu'
import { useToast } from '../../../ui/Toast'

type DetailHeaderActionsProps = {
  dashboard: Dashboard
  role: Access
  onShare: () => void
  onPreferences: () => void
  onHistory: () => void
}

/** Top-bar actions from the dashboard route's `PageHeaderContent`. */
export function DetailHeaderActions(props: DetailHeaderActionsProps) {
  const { dashboard } = props
  return (
    <>
      <span className="hidden text-xs whitespace-nowrap text-white/50 lg:inline">
        {dashboard.lastExecution ? (
          <>
            <span className="hidden pr-1 xl:inline">Last execution:</span>
            {formatDateTime(dashboard.lastExecution)}
          </>
        ) : (
          'No executions yet'
        )}
      </span>
      <DashboardIconActions {...props} />
    </>
  )
}

/** Favorite, share and the more menu (export, history, preferences). Appearance lives on the canvas toolbar. */
export function DashboardIconActions({ dashboard, role, onShare, onPreferences, onHistory }: DetailHeaderActionsProps) {
  const toast = useToast()
  const { isFavorite, toggleFavorite } = useDashboards()
  const favorite = isFavorite(dashboard.id)

  const editorItems: MenuEntry[] = [
    { type: 'separator' },
    { label: 'Version history', Icon: History, onSelect: onHistory },
    { label: 'Dashboard preferences', Icon: Settings, onSelect: onPreferences },
  ]
  const moreItems: MenuEntry[] = [
    {
      label: 'Export',
      Icon: FileOutput,
      onSelect: () => toast('Export is out of scope for this prototype'),
    },
    ...(can(role, 'editDetails') ? editorItems : []),
  ]

  return (
    <>
      <button
        type="button"
        aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
        title={favorite ? 'Remove from favorites' : 'Add to favorites'}
        onClick={() => toast(toggleFavorite(dashboard.id) ? 'Added to favorites' : 'Removed from favorites')}
        className={headerActionClass}
      >
        <Star className={cn('size-4', favorite && 'fill-white')} />
      </button>
      <button type="button" aria-label="Share" title="Share" onClick={onShare} className={headerActionClass}>
        <Send className="size-4" />
      </button>
      <Menu
        items={moreItems}
        trigger={({ toggle }) => (
          <button type="button" aria-label="More actions" title="More actions" onClick={toggle} className={headerActionClass}>
            <Ellipsis className="size-4" />
          </button>
        )}
      />
    </>
  )
}
