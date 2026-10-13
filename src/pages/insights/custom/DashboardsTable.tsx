import { Link } from 'react-router-dom'
import { Ellipsis, Star } from 'lucide-react'
import type { Dashboard } from '../../../data/dashboards'
import { builderPath, useBuilderVersion } from '../../../lib/builderVersion'
import { cn } from '../../../lib/cn'
import { formatDateTime, formatRelative } from '../../../lib/format'
import { effectiveRole, useRoleOverride } from '../../../lib/roleOverride'
import { Menu } from '../../../ui/Menu'
import { TagChips } from '../../../ui/TagChips'
import { dashboardMenuItems } from './dashboardMenuItems'
import { SampleBadge } from './SampleBadge'

type DashboardsTableProps = {
  rows: Dashboard[]
  favorites: string[]
  onToggleFavorite: (id: string) => void
  onEdit: (dashboard: Dashboard) => void
  onDelete: (dashboard: Dashboard) => void
  onToggleArchived: (dashboard: Dashboard) => void
}

const GRID = 'grid grid-cols-[40px_minmax(300px,2fr)_minmax(128px,1fr)_minmax(144px,1fr)_minmax(168px,1fr)_48px]'

/** Columns match `useDashboardsColumns`: favorite, Name, Tags, Updated At, Updated By, actions. */
export function DashboardsTable({ rows, favorites, onToggleFavorite, onEdit, onDelete, onToggleArchived }: DashboardsTableProps) {
  const [builderVersion] = useBuilderVersion()
  const override = useRoleOverride()
  return (
    <div className="overflow-hidden rounded-lg border border-white/10">
      <div className={cn(GRID, 'h-10 items-center border-b border-white/10 bg-tlai-2 text-xs font-medium text-white/60 uppercase')}>
        <span className="flex justify-center">
          <Star className="size-4 text-white/70" aria-label="Favorites" />
        </span>
        <span className="px-3">Name</span>
        <span className="px-3">Tags</span>
        <span className="px-3">Updated At</span>
        <span className="px-3">Updated By</span>
        <span className="sr-only">Actions</span>
      </div>
      {rows.map((dashboard) => {
        const favorite = favorites.includes(dashboard.id)
        const menuItems = dashboardMenuItems(dashboard, effectiveRole(dashboard, override), {
          onEdit: () => onEdit(dashboard),
          onDelete: () => onDelete(dashboard),
          onToggleArchived: () => onToggleArchived(dashboard),
        })
        return (
          <div key={dashboard.id} className={cn(GRID, 'group/row h-12 items-center border-b border-white/5 text-sm last:border-b-0 hover:bg-white/[0.03]')}>
            <span className="flex justify-center">
              <button
                type="button"
                aria-pressed={favorite}
                aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
                title={favorite ? 'Remove from favorites' : 'Add to favorites'}
                onClick={() => onToggleFavorite(dashboard.id)}
                className="flex size-7 cursor-pointer items-center justify-center rounded-md hover:bg-white/10"
              >
                <Star
                  className={cn('size-4 text-white/50 group-hover/row:text-white', favorite && 'fill-white text-white opacity-80 group-hover/row:opacity-100')}
                />
              </button>
            </span>
            <span className="flex min-w-0 items-center gap-2 px-3">
              <Link
                to={builderPath(`/insights/dashboards/${dashboard.id}`, builderVersion)}
                className="truncate font-medium text-white hover:underline"
                title={dashboard.name}
              >
                {dashboard.name}
              </Link>
              {dashboard.sample && <SampleBadge />}
            </span>
            <span className="min-w-0 px-3">{dashboard.tags?.length ? <TagChips tags={dashboard.tags} /> : <span className="text-white/30">—</span>}</span>
            <span className="px-3 text-white/80" title={formatDateTime(dashboard.updatedAt)}>
              {formatRelative(dashboard.updatedAt)}
            </span>
            <span className="truncate px-3 text-white" title={dashboard.updatedBy}>
              {dashboard.updatedBy}
            </span>
            <span className="flex justify-end px-2">
              {menuItems.length > 0 && (
                <Menu
                  trigger={({ toggle }) => (
                    <button
                      type="button"
                      aria-label="Row actions"
                      onClick={toggle}
                      className="flex size-7 cursor-pointer items-center justify-center rounded-md text-white/60 hover:bg-white/10 hover:text-white"
                    >
                      <Ellipsis className="size-4" />
                    </button>
                  )}
                  items={menuItems}
                />
              )}
            </span>
          </div>
        )
      })}
    </div>
  )
}
