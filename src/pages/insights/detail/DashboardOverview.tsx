import { useState, type ReactNode } from 'react'
import { ChartSpline, ChevronDown } from 'lucide-react'
import type { Dashboard } from '../../../data/dashboards'
import type { DashboardDetail } from '../../../data/dashboardDetail'
import { scoreByDimension, summarize } from '../../../data/dashboardDetail'
import { cn } from '../../../lib/cn'
import { formatNumber, formatPercent } from '../../../lib/format'
import { MetricCard, type MetricCardDelta } from '../../../ui/MetricCard'
import { FilterBar, type OverviewFilters } from './FilterBar'
import { DimensionScoreChart, IssuesByPriorityChart, QualityTrendChart, TopFailingChecksChart } from './OverviewCharts'

type DashboardOverviewProps = {
  dashboard: Dashboard
  detail: DashboardDetail
  showFilters: boolean
  filters: OverviewFilters
  onFiltersChange: (filters: OverviewFilters) => void
}

export function DashboardOverview({ dashboard, detail, showFilters, filters, onFiltersChange }: DashboardOverviewProps) {
  const checks = detail.checks.filter(
    (check) =>
      (filters.dimension === 'All' || check.dimension === filters.dimension) &&
      (filters.priority === 'All' || check.priority === filters.priority),
  )
  const summary = summarize(checks)

  if (!dashboard.lastExecution) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-white/10 py-20 text-center">
        <ChartSpline className="size-6 text-white/30" />
        <p className="text-sm text-white">No executions yet</p>
        <p className="max-w-sm text-xs text-white/50">
          Graphs fill in after the dashboard's data checks run for the first time.
        </p>
      </div>
    )
  }

  const filtered = filters.dimension !== 'All' || filters.priority !== 'All'
  const latest = detail.trend.at(-1)
  const previous = detail.trend.at(-2)
  const score = filtered ? summary.score : dashboard.qualityScore
  const comparable = !filtered && latest && previous

  return (
    <div className="flex flex-col gap-3">
      {showFilters && <FilterBar filters={filters} onChange={onFiltersChange} />}

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <MetricCard
          label="Data Quality Score"
          description="Records passing ÷ records scanned, across the latest execution of each data check"
          value={formatPercent(score)}
          delta={comparable ? toDelta(latest.score - previous.score, 'pts', true) : undefined}
          reserveComparisonSpace
        />
        <MetricCard label="Total Scanned" value={formatNumber(summary.scanned)} reserveComparisonSpace />
        <MetricCard
          label="Total Issues"
          value={formatNumber(summary.issues)}
          delta={comparable ? toDelta(((latest.issues - previous.issues) / previous.issues) * 100, '%', false) : undefined}
          reserveComparisonSpace
        />
        <MetricCard
          label="Data Checks Executed"
          value={`${summary.executedCount} / ${checks.length}`}
          delta={
            summary.failedCount > 0
              ? { value: `${summary.failedCount} failed`, direction: 'flat', sentiment: 'negative', periodLabel: 'Latest run' }
              : undefined
          }
          reserveComparisonSpace
        />
      </div>

      <GraphSection title="Quality overview" count={2}>
        <QualityTrendChart trend={detail.trend} targetScore={dashboard.targetScore} baselineScore={dashboard.baselineScore} />
        <DimensionScoreChart dimensions={scoreByDimension(checks)} />
      </GraphSection>

      <GraphSection title="Issues" count={2}>
        <IssuesByPriorityChart checks={checks} />
        <TopFailingChecksChart checks={checks} />
      </GraphSection>
    </div>
  )
}

function toDelta(change: number, unit: 'pts' | '%', higherIsBetter: boolean): MetricCardDelta {
  const rounded = Number(change.toFixed(1))
  const direction = rounded > 0 ? 'up' : rounded < 0 ? 'down' : 'flat'
  const good = higherIsBetter ? rounded > 0 : rounded < 0
  const formatted = unit === 'pts' ? `${Math.abs(rounded).toFixed(1)} pts` : `${Math.abs(rounded).toFixed(1)}%`
  return {
    value: `${rounded > 0 ? '+' : rounded < 0 ? '−' : ''}${formatted}`,
    direction,
    sentiment: rounded === 0 ? 'neutral' : good ? 'positive' : 'negative',
    periodLabel: 'vs previous execution',
  }
}

/** Collapsible `GraphType.SECTION` divider followed by its graphs. */
function GraphSection({ title, count, children }: { title: string; count: number; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  return (
    <>
      <div className="flex h-11 items-center gap-2 rounded-lg bg-tlai-3 px-4">
        <button
          type="button"
          aria-expanded={!collapsed}
          onClick={() => setCollapsed((current) => !current)}
          className="-m-1 flex cursor-pointer items-center gap-2 rounded p-1 hover:bg-white/5"
        >
          <ChevronDown className={cn('size-4 text-white/50 transition-transform duration-200', collapsed && '-rotate-90')} />
          <span className="text-sm font-semibold text-white/90">{title}</span>
        </button>
        <span className={cn('text-xs text-white/40', !collapsed && 'invisible')}>{count} hidden</span>
      </div>
      {!collapsed && <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">{children}</div>}
    </>
  )
}
