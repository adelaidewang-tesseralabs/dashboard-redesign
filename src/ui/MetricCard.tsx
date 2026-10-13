import type { ReactNode } from 'react'
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
  /** Behind the info icon, like `ChartPanel`'s description. */
  description?: string
  /** Visible text under the label. */
  subtitle?: string
  /** Small text under the value, e.g. what a highlighted count is out of. */
  note?: string
  /** Next to the label, e.g. the filters applied. */
  badge?: ReactNode
  /** Top-right controls, e.g. a graph's actions menu. */
  actions?: ReactNode
  /** Fills its parent's height, shrinking the value when the card is short. */
  fill?: boolean
  delta?: MetricCardDelta
  reserveComparisonSpace?: boolean
}

const DELTA_ICONS = { up: ArrowUpRight, down: ArrowDownRight, flat: Minus } as const
const DELTA_TEXT = { positive: 'text-status-success', negative: 'text-destructive', neutral: 'text-white/50' } as const
const COMPARISON_BAND = 'flex shrink-0 items-center justify-between gap-2 border-t border-white/5 px-3 py-2 text-xs'

/** Port of the DH `MetricCard`: the `ChartPanel` header, a centered KPI, and an optional comparison footer band. */
export function MetricCard({ value, label, description, subtitle, note, badge, actions, fill = false, delta, reserveComparisonSpace = false }: MetricCardProps) {
  const DeltaIcon = delta ? DELTA_ICONS[delta.direction] : null

  return (
    <div className={cn('flex min-w-0 flex-col rounded-lg border border-[var(--dash-border)] bg-[var(--dash-metric)]', fill && 'h-full [container-type:size]')}>
      <div className="flex min-h-10 w-full justify-between gap-1 px-4 py-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex min-w-0 items-center gap-2">
            <h4 className="truncate text-sm font-semibold text-[var(--dash-fg)]">{label}</h4>
            {description && (
              <span title={description} className="shrink-0">
                <Info className="size-3.5 text-[var(--dash-faint)]" />
              </span>
            )}
            {badge}
          </div>
          {subtitle && <p className="truncate text-xs text-[var(--dash-muted)]">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-start">{actions}</div>}
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-3 pb-3">
        <span
          className={cn(
            'max-w-full truncate text-2xl font-semibold text-[var(--dash-fg)] xl:text-3xl',
            fill && '[@container(max-height:140px)]:text-xl!',
          )}
        >
          {value}
        </span>
        {note && <span className="truncate text-xs text-[var(--dash-muted)]">{note}</span>}
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
