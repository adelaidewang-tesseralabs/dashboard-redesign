import { Funnel, Highlighter } from 'lucide-react'
import type { Dashboard } from '../../../data/dashboards'
import type { GraphItem } from '../../../data/widgets'
import { cn } from '../../../lib/cn'
import { Popover } from '../../../ui/Popover'
import { menuSurfaceClass } from '../../../ui/menuStyles'
import type { CrossHighlight } from './crossHighlight'
import { graphFilters, type AppliedFilter } from './dashboardFilters'

type GraphFilterBadgeProps = {
  dashboard: Dashboard
  item: GraphItem
  highlight?: CrossHighlight | null
}

const SCOPE_TITLES: Record<AppliedFilter['scope'], string> = {
  fixed: 'Fixed filters',
  page: 'Page filters',
  dataset: 'Dataset filters',
  graph: 'Graph filters',
}
const SCOPES = Object.keys(SCOPE_TITLES) as AppliedFilter['scope'][]

/** A funnel next to a graph's title, so anyone can tell which filters shaped the numbers they're looking at. */
export function GraphFilterBadge({ dashboard, item, highlight = null }: GraphFilterBadgeProps) {
  const filters = graphFilters(dashboard, item)
  if (filters.length === 0 && !highlight) return null

  return (
    // Opening the list mustn't select or start dragging the graph underneath.
    <div className="shrink-0" onClick={(event) => event.stopPropagation()} onMouseDown={(event) => event.stopPropagation()}>
      <Popover
        trigger={({ open, toggle }) => (
          <button
            type="button"
            aria-expanded={open}
            aria-label={filters.length === 1 ? '1 filter applied' : `${filters.length} filters applied`}
            title="Filters applied to this graph"
            onClick={toggle}
            className={cn(
              'flex h-5 cursor-pointer items-center gap-0.5 rounded px-1 text-[11px] text-[var(--dash-muted)] hover:bg-[var(--dash-border)] hover:text-[var(--dash-fg)]',
              open && 'bg-[var(--dash-border)] text-[var(--dash-fg)]',
            )}
          >
            <Funnel className="size-3" aria-hidden />
            {filters.length > 0 && filters.length}
          </button>
        )}
        contentClassName={cn(menuSurfaceClass, 'w-72 bg-tlai-3')}
      >
        <div data-popover-open className="flex flex-col gap-2 p-1 text-xs">
          {SCOPES.map((scope) => {
            const entries = filters.filter((filter) => filter.scope === scope)
            if (entries.length === 0) return null
            return (
              <section key={scope} className="flex flex-col gap-1">
                <h5 className="text-[11px] font-medium text-white/50">{SCOPE_TITLES[scope]}</h5>
                {entries.map((filter) => (
                  <p key={filter.id} className="text-white/85">
                    <span className="text-white/55">{filter.label}</span> {filter.detail}
                    {filter.via && <span className="text-white/45"> · via linked {filter.via}</span>}
                  </p>
                ))}
              </section>
            )
          })}
          {highlight && (
            <p className="flex items-center gap-1.5 border-t border-white/10 pt-2 text-white/60">
              <Highlighter className="size-3 shrink-0" aria-hidden />
              Highlighting {highlight.columnLabel}: {highlight.value}. Highlights shade graphs but don't filter them.
            </p>
          )}
        </div>
      </Popover>
    </div>
  )
}
