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
  children: ReactNode
  className?: string
}

/** Port of the DH `ChartPanel` card. */
export function ChartPanel({ title, description, subtitle, badge, actions, children, className }: ChartPanelProps) {
  return (
    <div className={cn('group relative flex flex-col rounded-lg bg-[var(--dash-card)] shadow-[var(--dash-shadow)]', className)}>
      <div className="flex min-h-10 w-full justify-between gap-1 px-4 py-3">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-[var(--dash-fg)]">{title}</h4>
            {description && (
              <span title={description}>
                <Info className="size-3.5 text-[var(--dash-faint)]" />
              </span>
            )}
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
