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
import { DashboardPreview } from './DashboardPreview'
import { SampleBadge } from './SampleBadge'

type DashboardsGridProps = {
  rows: Dashboard[]
  favorites: string[]
  onToggleFavorite: (id: string) => void
  onEdit: (dashboard: Dashboard) => void
  onDelete: (dashboard: Dashboard) => void
  onToggleArchived: (dashboard: Dashboard) => void
}

/** Card grid modeled on production's `SystemsGrid` / `SystemCard`. */
export function DashboardsGrid({ rows, favorites, onToggleFavorite, onEdit, onDelete, onToggleArchived }: DashboardsGridProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {rows.map((dashboard) => (
        <DashboardCard
          key={dashboard.id}
          dashboard={dashboard}
          favorite={favorites.includes(dashboard.id)}
          onToggleFavorite={() => onToggleFavorite(dashboard.id)}
          onEdit={() => onEdit(dashboard)}
          onDelete={() => onDelete(dashboard)}
          onToggleArchived={() => onToggleArchived(dashboard)}
        />
      ))}
    </div>
  )
}

type DashboardCardProps = {
  dashboard: Dashboard
  favorite: boolean
  onToggleFavorite: () => void
  onEdit: () => void
  onDelete: () => void
  onToggleArchived: () => void
}

function DashboardCard({ dashboard, favorite, onToggleFavorite, onEdit, onDelete, onToggleArchived }: DashboardCardProps) {
  const [builderVersion] = useBuilderVersion()
  const menuItems = dashboardMenuItems(dashboard, effectiveRole(dashboard, useRoleOverride()), { onEdit, onDelete, onToggleArchived })
  return (
    // The title link is stretched over the card; star and menu sit above it with `relative z-10`.
    <article className="group relative flex h-full flex-col gap-3 rounded-lg border border-white/10 bg-tlai-card p-3 transition-colors focus-within:ring-2 focus-within:ring-white/40 hover:bg-white/5">
      <DashboardPreview dashboard={dashboard} />
      <header className="flex items-start gap-2 px-1">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <Link
            to={builderPath(`/insights/dashboards/${dashboard.id}`, builderVersion)}
            title={dashboard.name}
            className="truncate text-sm font-medium text-white outline-none after:absolute after:inset-0 after:rounded-lg"
          >
            {dashboard.name}
          </Link>
          <p className="truncate text-xs text-white/60" title={dashboard.description}>
            {dashboard.description ?? 'No description'}
          </p>
        </div>
        <div className="relative z-10 flex shrink-0 items-center">
          <button
            type="button"
            aria-pressed={favorite}
            aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
            title={favorite ? 'Remove from favorites' : 'Add to favorites'}
            onClick={onToggleFavorite}
            className="flex size-7 cursor-pointer items-center justify-center rounded-md hover:bg-white/10"
          >
            <Star className={cn('size-4 text-white/50 group-hover:text-white', favorite && 'fill-white text-white opacity-80')} />
          </button>
          {menuItems.length > 0 && (
            <Menu
              trigger={({ toggle }) => (
                <button
                  type="button"
                  aria-label="Dashboard actions"
                  onClick={toggle}
                  className="flex size-7 cursor-pointer items-center justify-center rounded-md text-white/60 hover:bg-white/10 hover:text-white"
                >
                  <Ellipsis className="size-4" />
                </button>
              )}
              items={menuItems}
            />
          )}
        </div>
      </header>

      <footer className="mt-auto flex items-center justify-between gap-2 px-1">
        <span className="flex min-w-0 flex-1 items-center gap-1.5">
          {dashboard.sample && <SampleBadge />}
          {dashboard.tags?.length ? <TagChips tags={dashboard.tags} /> : null}
        </span>
        <span className="truncate font-mono text-[11px] text-white/50" title={`${formatDateTime(dashboard.updatedAt)} · ${dashboard.updatedBy}`}>
          Updated {formatRelative(dashboard.updatedAt)}
        </span>
      </footer>
    </article>
  )
}
