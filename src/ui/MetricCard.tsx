import { ArrowDownRight, ArrowUpRight, Info, Minus } from 'lucide-react'
import { cn } from '../lib/cn'

export type MetricCardDelta = {
  value: string
  direction: 'up' | 'down' | 'flat'
  /** Whether the change is good news — more issues is a rise and a regression. */
  sentiment: 'positive' | 'negative' | 'neutral'
  periodLabel?: string
}

type MetricCardProps = {
  value: string | number
  label: string
  description?: string
  delta?: MetricCardDelta
  reserveComparisonSpace?: boolean
}

const DELTA_ICONS = { up: ArrowUpRight, down: ArrowDownRight, flat: Minus } as const
const DELTA_TEXT = { positive: 'text-status-success', negative: 'text-destructive', neutral: 'text-white/50' } as const
const COMPARISON_BAND = 'flex shrink-0 items-center justify-between gap-2 border-t border-white/5 px-3 py-2 text-xs'

/** Port of the DH `MetricCard`: centered KPI with an optional comparison footer band. */
export function MetricCard({ value, label, description, delta, reserveComparisonSpace = false }: MetricCardProps) {
  const DeltaIcon = delta ? DELTA_ICONS[delta.direction] : null

  return (
    <div className="flex min-w-0 flex-col rounded-lg border border-[var(--dash-border)] bg-[var(--dash-metric)] text-center">
      <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 p-3">
        <span className="flex items-start gap-1" title={description}>
          <span className="line-clamp-2 text-xs text-[var(--dash-muted)]">{label}</span>
          {description && <Info className="mt-0.5 size-3.5 shrink-0 text-[var(--dash-faint)]" />}
        </span>
        <span className="truncate text-2xl font-semibold text-[var(--dash-fg)] xl:text-3xl">{value}</span>
      </div>
      {delta && DeltaIcon ? (
        <div className={COMPARISON_BAND}>
          {delta.periodLabel && <span className="truncate text-white/40">{delta.periodLabel}</span>}
          <span className={cn('ml-auto flex items-center gap-1', DELTA_TEXT[delta.sentiment])}>
            <DeltaIcon className="size-3 shrink-0" aria-hidden />
            <span className="font-medium">{delta.value}</span>
          </span>
        </div>
      ) : (
        reserveComparisonSpace && (
          <div className={cn(COMPARISON_BAND, 'invisible')} aria-hidden>
            &nbsp;
          </div>
        )
      )}
    </div>
  )
}
