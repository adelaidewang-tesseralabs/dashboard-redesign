import type { ReactNode } from 'react'
import { Info } from 'lucide-react'
import { cn } from '../lib/cn'

type ChartPanelProps = {
  title: string
  description?: string
  /** Visible text under the title, unlike `description` which sits behind the info icon. */
  subtitle?: string
  /** Always-visible status next to the title, e.g. the filters applied. */
  badge?: ReactNode
  /** Top-right controls, e.g. a graph's actions menu. */
  actions?: ReactNode
  /** Ends the title row early so a "…" button floating over the corner never covers the info icon. */
  reserveActionSpace?: boolean
  children: ReactNode
  className?: string
}

/** Port of the DH `ChartPanel` card. */
export function ChartPanel({ title, description, subtitle, badge, actions, reserveActionSpace = false, children, className }: ChartPanelProps) {
  return (
    <div className={cn('group relative flex flex-col rounded-lg bg-[var(--dash-card)] shadow-[var(--dash-shadow)]', className)}>
      <div className="flex min-h-10 w-full justify-between gap-1 px-4 py-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div data-card-heading className={cn('flex min-w-0 items-center gap-2', reserveActionSpace && 'pr-6')}>
            <CardTitle title={title} />
            {description && <InfoTip description={description} />}
            {badge}
          </div>
          {subtitle && <p className="truncate text-xs text-[var(--dash-muted)]">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-start">{actions}</div>}
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden px-3 pb-3">{children}</div>
    </div>
  )
}

/** A card's one-line title; `IconTooltips` shows the full title on hover once it's cut off. */
export function CardTitle({ title }: { title: string }) {
  return (
    <h4 data-overflow-tip className="truncate text-sm font-semibold text-[var(--dash-fg)]">
      {title}
    </h4>
  )
}

/** The info icon after a card's title; `IconTooltips` shows the description on hover or keyboard focus. */
export function InfoTip({ description }: { description: string }) {
  return (
    <span role="img" tabIndex={0} aria-label={description} data-tip className="shrink-0 cursor-help rounded-full outline-none focus-visible:ring-1 focus-visible:ring-white/40">
      <Info className="size-3.5 text-[var(--dash-faint)]" />
    </span>
  )
}

export const chartAxisProps = {
  tick: { fill: 'var(--dash-axis)', fontSize: 11 },
  tickLine: false,
  axisLine: false,
} as const

export const chartTooltipStyle = {
  background: 'var(--dash-tooltip-bg)',
  border: '1px solid var(--dash-tooltip-border)',
  borderRadius: 6,
  fontSize: 12,
  color: 'var(--dash-tooltip-fg)',
}

/** Recharts colors tooltip rows with the series fill, which is unreadable once a highlight fades it. */
export const chartTooltipItemStyle = { color: 'var(--dash-muted)' }

export const chartGridStroke = 'var(--dash-grid)'
