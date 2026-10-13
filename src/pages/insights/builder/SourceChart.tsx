import type { ReactNode } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { CountRow, Cell as DataCell } from '../../../data/dataSources'
import type { ChartStyle } from '../../../data/widgets'
import { cn } from '../../../lib/cn'
import { CHART_PALETTES, CHART_SINGLE_COLORS, DASHBOARD_COLORS, resolvePalette, type ChartColor, type ChartPalette } from '../../../lib/colors'
import { formatNumber, formatPercent } from '../../../lib/format'
import { ChartPanel, chartAxisProps, chartGridStroke, chartTooltipItemStyle, chartTooltipStyle } from '../../../ui/ChartPanel'
import { MetricCard } from '../../../ui/MetricCard'
import type { ChartHighlight } from './crossHighlight'

type SourceChartProps = {
  title: string
  subtitle?: string
  /** Where the data comes from — shown in the panel's info tooltip. */
  source: string
  chart: ChartStyle
  columns: string[]
  rows: DataCell[][]
  /** Every label the graph can show, in palette order, so each value keeps its color when filters hide others. */
  colorKeys?: string[]
  palette?: ChartPalette
  /** Auto-colored on a dashboard: start this far into `DASHBOARD_COLORS`, so unrelated graphs don't share colors. */
  colorOffset?: number
  /** Line, area and gauge: the picked series color, which wins over the palette and auto colors. */
  color?: ChartColor
  /** Preview: another part of the dashboard is highlighted; this graph shows how it relates. */
  highlight?: ChartHighlight
  /** Preview: clicking a bar, slice, point or row highlights that label across the dashboard. */
  onSelectLabel?: (label: string) => void
  /** Next to the title, e.g. the filters applied. */
  badge?: ReactNode
  /** Top-right controls, e.g. the graph's actions menu. */
  actions?: ReactNode
}

/** Outside a highlight a part keeps its own hue, just faded, so the palette never shifts. Palette colors are 6-digit hex. */
const fade = (color: string) => `${color}33`

/** A row of a highlighted graph: `matched` is the highlighted share of `count`, `rest` the remainder. */
type HighlightRow = CountRow & { matched: number; rest: number; lit: boolean }

/** Graph for object- and SQL-sourced widgets: a metric card, or the counts in any of the supported chart styles. */
export function SourceChart({ title, subtitle, source, chart, columns, rows, colorKeys = [], palette = 'default', colorOffset, color, highlight, onSelectLabel, badge, actions }: SourceChartProps) {
  const dimmed = highlight?.kind === 'dim'
  const match = highlight?.kind === 'match' ? highlight : undefined
  if (chart === 'metric') {
    const hasCounts = rows.every((row) => typeof row[1] === 'number')
    const total = hasCounts ? rows.reduce((sum, row) => sum + Number(row[1]), 0) : rows.length
    const matched = match ? [...match.values.values()].reduce((sum, value) => sum + value, 0) : undefined
    return (
      <div className={cn('relative grid h-full transition-opacity', dimmed && 'opacity-40')}>
        <MetricCard label={matched === undefined ? title : `${title} · of ${formatNumber(total)}`} value={formatNumber(matched ?? total)} description={subtitle ?? source} />
        {(badge || actions) && (
          <div className="absolute top-3 right-3 flex items-center gap-1">
            {badge}
            {actions}
          </div>
        )}
      </div>
    )
  }
  const counts: HighlightRow[] = rows.map(([label, count]) => {
    const value = Number(count)
    const matched = match ? (match.values.get(String(label)) ?? 0) : value
    return { label: String(label), count: value, matched, rest: Math.max(0, value - matched), lit: !match || matched > 0 }
  })
  const auto = colorOffset !== undefined
  const colors: readonly string[] = auto ? DASHBOARD_COLORS : CHART_PALETTES[resolvePalette(palette)].colors
  const start = auto ? colorOffset : 0
  const colorOf = (label: string, index: number) => {
    const position = colorKeys.indexOf(label)
    return colors[(start + (position < 0 ? index : position)) % colors.length]
  }
  return (
    <div className={cn('relative h-full transition-opacity', dimmed && 'opacity-40')}>
      <ChartPanel className="h-full" title={title} subtitle={subtitle} description={source} badge={badge}>
        <div className={cn('h-full min-h-0 w-full', onSelectLabel && '[&_.recharts-layer]:cursor-pointer')}>
          <ChartBody
            chart={chart}
            counts={counts}
            split={!!match?.additive}
            highlighting={!!match}
            columns={columns}
            rows={rows}
            colorOf={colorOf}
            accent={color ? CHART_SINGLE_COLORS[color].color : colors[start % colors.length]}
            onSelectLabel={onSelectLabel}
          />
        </div>
      </ChartPanel>
      {/* Over the header's corner, not beside the title, so the title keeps its full width. */}
      {actions && <div className="absolute top-2.5 right-3">{actions}</div>}
    </div>
  )
}

type ChartBodyProps = {
  chart: Exclude<ChartStyle, 'metric'>
  counts: HighlightRow[]
  /** Draw each bar or slice as its highlighted share plus a grey remainder (counts and sums). */
  split: boolean
  /** A highlight is active: unmatched labels turn grey. */
  highlighting: boolean
  columns: string[]
  rows: DataCell[][]
  colorOf: (label: string, index: number) => string
  /** Single-series color for line, area and gauge charts. */
  accent: string
  onSelectLabel?: (label: string) => void
}

/** Recharts hands click handlers the drawn item, with the original data row under `payload`. */
const labelOf = (entry: { payload?: { label?: unknown } }) => (entry.payload?.label === undefined ? undefined : String(entry.payload.label))

function ChartBody({ chart, counts, split, highlighting, columns, rows, colorOf, accent, onSelectLabel }: ChartBodyProps) {
  const select = (label: string | undefined) => label !== undefined && onSelectLabel?.(label)
  const fillOf = (row: HighlightRow, index: number) => (row.lit ? colorOf(row.label, index) : fade(colorOf(row.label, index)))
  // Recharts replays its grow-in on every data change, so a highlight click would make bars and slices visibly move.
  const animate = !onSelectLabel
  switch (chart) {
    case 'bar':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={counts} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} vertical={false} />
            <XAxis dataKey="label" {...chartAxisProps} interval={0} />
            <YAxis {...chartAxisProps} width={44} tickFormatter={(value) => formatNumber(Number(value))} />
            <Tooltip
              cursor={{ fill: 'var(--dash-grid)' }}
              contentStyle={chartTooltipStyle} itemStyle={chartTooltipItemStyle}
              formatter={(value, name) => [formatNumber(Number(value)), split ? (name === 'matched' ? 'Highlighted' : 'Other') : 'Count']}
            />
            <Bar
              dataKey={split ? 'matched' : 'count'}
              stackId="value"
              radius={split ? 0 : [4, 4, 0, 0]}
              maxBarSize={56}
              isAnimationActive={animate}
              onClick={(entry) => select(labelOf(entry))}
            >
              {counts.map((row, index) => (
                <Cell key={row.label} fill={fillOf(row, index)} />
              ))}
            </Bar>
            {split && (
              <Bar dataKey="rest" stackId="value" radius={[4, 4, 0, 0]} maxBarSize={56} isAnimationActive={animate} onClick={(entry) => select(labelOf(entry))}>
                {counts.map((row, index) => (
                  <Cell key={row.label} fill={fade(colorOf(row.label, index))} />
                ))}
              </Bar>
            )}
          </BarChart>
        </ResponsiveContainer>
      )
    case 'line':
    case 'area': {
      const Chart = chart === 'line' ? LineChart : AreaChart
      const base = highlighting ? fade(accent) : accent
      return (
        <ResponsiveContainer width="100%" height="100%">
          <Chart data={counts} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} onClick={(state) => state?.activeLabel !== undefined && select(String(state.activeLabel))}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} vertical={false} />
            <XAxis dataKey="label" {...chartAxisProps} interval={0} padding={{ left: 24, right: 24 }} />
            <YAxis {...chartAxisProps} width={44} tickFormatter={(value) => formatNumber(Number(value))} />
            <Tooltip contentStyle={chartTooltipStyle} itemStyle={chartTooltipItemStyle} formatter={(value, name) => [formatNumber(Number(value)), name === 'matched' ? 'Highlighted' : 'Count']} />
            {chart === 'line' ? (
              <Line type="monotone" dataKey="count" stroke={base} strokeWidth={2} dot={{ r: 3, fill: base }} isAnimationActive={animate} />
            ) : (
              <Area type="monotone" dataKey="count" stroke={base} strokeWidth={2} fill={base} fillOpacity={0.2} isAnimationActive={animate} />
            )}
            {highlighting &&
              (chart === 'line' ? (
                <Line type="monotone" dataKey="matched" stroke={accent} strokeWidth={2} dot={{ r: 3, fill: accent }} isAnimationActive={animate} />
              ) : (
                <Area type="monotone" dataKey="matched" stroke={accent} strokeWidth={2} fill={accent} fillOpacity={0.35} isAnimationActive={animate} />
              ))}
          </Chart>
        </ResponsiveContainer>
      )
    }
    case 'gauge':
      return <GaugeChart counts={highlighting ? counts.map((row) => ({ label: row.label, count: row.matched })) : counts} accent={accent} />
    case 'pie': {
      const slices = split
        ? counts.flatMap((row, index) => [
            { label: row.label, part: 'matched', value: row.matched, fill: colorOf(row.label, index) },
            { label: row.label, part: 'rest', value: row.rest, fill: fade(colorOf(row.label, index)) },
          ])
        : counts.map((row, index) => ({ label: row.label, part: 'all', value: row.count, fill: fillOf(row, index) }))
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip contentStyle={chartTooltipStyle} itemStyle={chartTooltipItemStyle} formatter={(value) => formatNumber(Number(value))} />
            <Pie
              data={slices.filter((slice) => slice.value > 0)}
              dataKey="value"
              nameKey="label"
              innerRadius="55%"
              outerRadius="85%"
              stroke="none"
              paddingAngle={split ? 1 : 2}
              isAnimationActive={animate}
              onClick={(entry) => select(labelOf(entry))}
            >
              {slices
                .filter((slice) => slice.value > 0)
                .map((slice) => (
                  <Cell key={`${slice.label}-${slice.part}`} fill={slice.fill} />
                ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      )
    }
    case 'table':
      return <ResultTable columns={columns} rows={rows} isLit={highlighting ? (row) => counts.find((entry) => entry.label === String(row[0]))?.lit ?? false : undefined} onSelectRow={onSelectLabel && ((row) => select(String(row[0])))} />
    default: {
      const unhandled: never = chart
      return unhandled
    }
  }
}

/** Half-donut showing the first group's share of all records, e.g. how many checks passed. */
function GaugeChart({ counts, accent }: { counts: CountRow[]; accent: string }) {
  const total = counts.reduce((sum, row) => sum + row.count, 0)
  const first = counts[0]
  const share = total > 0 && first ? first.count / total : 0
  const data = [{ value: share }, { value: 1 - share }]
  return (
    <div className="relative h-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" startAngle={180} endAngle={0} cy="72%" innerRadius="78%" outerRadius="100%" stroke="none">
            <Cell fill={accent} />
            <Cell fill="var(--dash-card-edge)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-x-0 top-[52%] flex flex-col items-center">
        <span className="text-2xl font-semibold text-[var(--dash-fg)] tabular-nums">{formatPercent(share * 100)}</span>
        <span className="text-xs text-[var(--dash-muted)]">{first ? `${first.label} of ${formatNumber(total)}` : 'No data'}</span>
      </div>
    </div>
  )
}

/** Rendering every row of a multi-thousand-record table stalls the page; the rest is still in CSV downloads and graphs. */
const MAX_TABLE_ROWS = 200

type ResultTableProps = {
  columns: string[]
  rows: DataCell[][]
  /** Dashboard preview highlight: rows this returns false for are dimmed. */
  isLit?: (row: DataCell[]) => boolean
  onSelectRow?: (row: DataCell[]) => void
}

export function ResultTable({ columns, rows, isLit, onSelectRow }: ResultTableProps) {
  const shown = rows.slice(0, MAX_TABLE_ROWS)
  return (
    <div className="h-full overflow-auto">
      <table className="w-full text-left text-xs">
        <thead className="sticky top-0 bg-[var(--dash-card)] text-[var(--dash-muted)]">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-2 py-1.5 font-medium">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-[var(--dash-fg)]">
          {shown.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              onClick={onSelectRow && (() => onSelectRow(row))}
              className={cn('border-t border-[var(--dash-border)] transition-opacity', isLit && !isLit(row) && 'opacity-30', onSelectRow && 'cursor-pointer hover:bg-[var(--dash-border)]')}
            >
              {row.map((cell, index) => (
                <td key={columns[index]} className={cn('px-2 py-1.5 tabular-nums', cell === null && 'text-[var(--dash-faint)]')}>
                  {cell === null ? 'null' : typeof cell === 'number' ? formatNumber(cell) : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > shown.length && (
        <p className="border-t border-[var(--dash-border)] px-2 py-2 text-xs text-[var(--dash-muted)]">
          Showing the first {formatNumber(shown.length)} of {formatNumber(rows.length)} rows
        </p>
      )}
    </div>
  )
}
