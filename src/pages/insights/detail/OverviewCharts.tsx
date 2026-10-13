import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { DataCheck, DimensionScore, ExecutionPoint } from '../../../data/dashboardDetail'
import { PRIORITIES } from '../../../data/dashboardDetail'
import { CHART_COLORS, dimensionColor, scoreColor } from '../../../lib/colors'
import { formatNumber, formatShortDate } from '../../../lib/format'
import { cn } from '../../../lib/cn'
import { ChartPanel, chartAxisProps, chartGridStroke, chartTooltipItemStyle, chartTooltipStyle } from '../../../ui/ChartPanel'

type FillProps = {
  /** Stretch to the parent's height instead of the fixed chart height, e.g. inside a resizable grid tile. */
  fill?: boolean
  /** Replaces the default panel title. */
  title?: string
  subtitle?: string
}

const chartBox = (fill = false) => (fill ? 'h-full min-h-0 w-full' : 'h-64 w-full')
const panelClass = (fill = false) => (fill ? 'h-full' : undefined)

export function QualityTrendChart({
  trend,
  targetScore,
  baselineScore,
  fill,
  title,
  subtitle,
}: FillProps & {
  trend: ExecutionPoint[]
  targetScore: number
  baselineScore: number
}) {
  const data = trend.map((point) => ({ ...point, label: formatShortDate(point.date) }))
  const floor = Math.max(0, Math.floor(Math.min(baselineScore, ...trend.map((point) => point.score)) / 5) * 5 - 5)
  const ticks = Array.from({ length: (100 - floor) / 5 + 1 }, (_, index) => floor + index * 5)

  return (
    <ChartPanel className={panelClass(fill)} title={title ?? 'Quality score trend'} subtitle={subtitle} description="Data quality score per execution, against target and baseline">
      <div className={chartBox(fill)}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} vertical={false} />
            <XAxis dataKey="label" {...chartAxisProps} minTickGap={24} />
            <YAxis domain={[floor, 100]} ticks={ticks} {...chartAxisProps} width={40} tickFormatter={(value) => `${value}%`} />
            <Tooltip contentStyle={chartTooltipStyle} itemStyle={chartTooltipItemStyle} formatter={(value) => [`${value}%`, 'Score']} />
            <ReferenceLine
              y={targetScore}
              stroke="#2CBA92"
              strokeDasharray="4 4"
              label={{ value: `Target ${targetScore}%`, position: 'insideTopRight', fill: '#2CBA92', fontSize: 11 }}
            />
            <ReferenceLine
              y={baselineScore}
              stroke="rgba(255,255,255,0.35)"
              strokeDasharray="4 4"
              label={{
                value: `Baseline ${baselineScore}%`,
                position: 'insideBottomRight',
                fill: 'rgba(255,255,255,0.5)',
                fontSize: 11,
              }}
            />
            <Line type="monotone" dataKey="score" stroke={CHART_COLORS[0]} strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartPanel>
  )
}

export function DimensionScoreChart({ dimensions, fill, title, subtitle }: FillProps & { dimensions: DimensionScore[] }) {
  const data = dimensions.map((row) => ({ ...row, score: Number(row.score.toFixed(1)) }))
  return (
    <ChartPanel className={panelClass(fill)} title={title ?? 'Quality by dimension'} subtitle={subtitle} description="Share of scanned records passing, per data quality dimension">
      <div className={chartBox(fill)}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} vertical={false} />
            <XAxis dataKey="dimension" {...chartAxisProps} />
            <YAxis domain={[0, 100]} {...chartAxisProps} width={40} tickFormatter={(value) => `${value}%`} />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              contentStyle={chartTooltipStyle} itemStyle={chartTooltipItemStyle}
              formatter={(value) => [`${value}%`, 'Score']}
            />
            <Bar dataKey="score" radius={[4, 4, 0, 0]} maxBarSize={56}>
              {data.map((row) => (
                <Cell key={row.dimension} fill={`${dimensionColor(row.dimension)}c0`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartPanel>
  )
}

export function IssuesByPriorityChart({ checks, fill, title, subtitle }: FillProps & { checks: DataCheck[] }) {
  const data = PRIORITIES.map((priority, index) => ({
    priority,
    issues: checks.filter((check) => check.priority === priority).reduce((sum, check) => sum + check.issueCount, 0),
    color: [CHART_COLORS[2], CHART_COLORS[1], CHART_COLORS[5], CHART_COLORS[9]][index],
  })).filter((row) => row.issues > 0)

  return (
    <ChartPanel className={panelClass(fill)} title={title ?? 'Issues by priority'} subtitle={subtitle}>
      <div className={cn('flex items-center gap-4', chartBox(fill))}>
        <div className="h-full flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip contentStyle={chartTooltipStyle} itemStyle={chartTooltipItemStyle} formatter={(value) => formatNumber(Number(value))} />
              <Pie data={data} dataKey="issues" nameKey="priority" innerRadius="58%" outerRadius="85%" stroke="none" paddingAngle={2}>
                {data.map((row) => (
                  <Cell key={row.priority} fill={row.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="flex w-36 flex-col gap-2 pr-2">
          {data.map((row) => (
            <li key={row.priority} className="flex items-center gap-2 text-xs text-white/75">
              <span className="size-2 shrink-0 rounded-full" style={{ background: row.color }} />
              <span className="flex-1">{row.priority}</span>
              <span className="tabular-nums text-white">{formatNumber(row.issues)}</span>
            </li>
          ))}
        </ul>
      </div>
    </ChartPanel>
  )
}

export function TopFailingChecksChart({ checks, fill, title, subtitle }: FillProps & { checks: DataCheck[] }) {
  const data = checks
    .filter((check) => check.issueCount > 0)
    .toSorted((a, b) => b.issueCount - a.issueCount)
    .slice(0, 6)
    .map((check) => ({ name: check.ruleId, description: check.description, issues: check.issueCount, score: check.qualityScore ?? 0 }))

  return (
    <ChartPanel className={panelClass(fill)} title={title ?? 'Top failing data checks'} subtitle={subtitle} description="Data checks with the most open issues in the latest execution">
      <div className={chartBox(fill)}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} horizontal={false} />
            <XAxis type="number" {...chartAxisProps} tickFormatter={(value) => formatNumber(Number(value))} />
            <YAxis type="category" dataKey="name" {...chartAxisProps} width={64} />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              contentStyle={chartTooltipStyle} itemStyle={chartTooltipItemStyle}
              labelFormatter={(_, payload) => payload?.[0]?.payload.description ?? ''}
              formatter={(value) => [formatNumber(Number(value)), 'Issues']}
            />
            <Bar dataKey="issues" radius={[0, 4, 4, 0]} maxBarSize={22}>
              {data.map((row) => (
                <Cell key={row.name} fill={scoreColor(row.score)} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartPanel>
  )
}
