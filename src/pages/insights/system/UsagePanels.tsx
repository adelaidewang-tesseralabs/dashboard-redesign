import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { RankRow, UsageSeries, UsageUnit } from '../../../data/llmUsage'
import { USAGE_BARS, formatUsageAxis, usageRows } from '../../../data/llmUsage'
import { chartAxisProps, chartGridStroke, chartTooltipItemStyle, chartTooltipStyle } from '../../../ui/ChartPanel'

export function UsageBarChart({ unit }: { unit: UsageUnit }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={USAGE_BARS}>
          <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} vertical={false} />
          <XAxis dataKey="day" interval={0} {...chartAxisProps} />
          <YAxis {...chartAxisProps} width={48} tickFormatter={(value) => formatUsageAxis(Number(value), unit)} />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            contentStyle={chartTooltipStyle} itemStyle={chartTooltipItemStyle}
            formatter={(value) => formatUsageAxis(Number(value), unit)}
          />
          <Bar dataKey="input" stackId="usage" fill="#8b5cf6" name="Input" />
          <Bar dataKey="output" stackId="usage" fill="#76B7B2" name="Output" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

type UsageLineChartProps = {
  series: UsageSeries[]
  values: Record<string, number[]>
  cumulative: boolean
  unit: UsageUnit
}

export function UsageLineChart({ series, values, cumulative, unit }: UsageLineChartProps) {
  return (
    <div className="flex w-full flex-col">
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={usageRows(series, values, cumulative)} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} vertical={false} />
            <XAxis dataKey="day" interval={0} {...chartAxisProps} />
            <YAxis {...chartAxisProps} width={48} tickFormatter={(value) => formatUsageAxis(Number(value), unit)} />
            <Tooltip contentStyle={chartTooltipStyle} itemStyle={chartTooltipItemStyle} formatter={(value) => formatUsageAxis(Number(value), unit)} />
            {series.map((item) => (
              <Line key={item.key} type="monotone" dataKey={item.key} name={item.name} stroke={item.color} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex flex-wrap justify-center gap-x-3 gap-y-1 pt-2">
        {series.map((item) => (
          <li key={item.key} className="flex items-center gap-1.5 text-[11px] text-white/75">
            <span className="size-2 shrink-0 rounded-full" style={{ background: item.color }} />
            {item.name}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function RankList({ title, rows }: { title: string; rows: RankRow[] }) {
  return (
    <div className="flex flex-col rounded-lg bg-tlai-3 p-4 shadow-sm shadow-black/60">
      <h4 className="mb-3 text-sm font-semibold text-white/90">{title}</h4>
      <div className="flex flex-col gap-1.5">
        {rows.map((row) => (
          <div key={row.email ?? row.name} className="flex items-center gap-3 rounded-md border border-white/5 bg-white/[0.03] px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs text-white">{row.name}</p>
              {row.email && <p className="truncate text-[10px] text-white/40">{row.email}</p>}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs font-medium text-white tabular-nums">{row.total}</p>
              <p className="text-[10px] text-white/40 tabular-nums">{row.detail}</p>
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="py-4 text-center text-xs text-white/40">No usage for this filter.</p>}
      </div>
    </div>
  )
}
