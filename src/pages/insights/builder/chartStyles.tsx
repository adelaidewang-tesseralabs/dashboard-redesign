import type { LucideIcon } from 'lucide-react'
import { ChartArea, ChartColumn, ChartLine, ChartPie, Gauge, Hash, Table } from 'lucide-react'
import { CHART_STYLES, type ChartStyle } from '../../../data/widgets'
import type { SelectOption } from '../../../ui/Select'

type ChartStyleMeta = { label: string; description: string; Icon: LucideIcon; group: string }

/** Graph styles the main app supports today, grouped as in its "What should this graph show?" picker. */
export const CHART_STYLE_META: Record<ChartStyle, ChartStyleMeta> = {
  bar: { label: 'Bar', description: 'Compare categories side by side', Icon: ChartColumn, group: 'Comparison' },
  line: { label: 'Line', description: 'Change over time', Icon: ChartLine, group: 'Comparison' },
  area: { label: 'Area', description: 'Cumulative change over time', Icon: ChartArea, group: 'Comparison' },
  metric: { label: 'Metric card', description: 'One number with context', Icon: Hash, group: 'Single value & data' },
  gauge: { label: 'Gauge', description: 'A value against a range', Icon: Gauge, group: 'Single value & data' },
  pie: { label: 'Pie / donut', description: 'Proportions of a whole', Icon: ChartPie, group: 'Single value & data' },
  table: { label: 'Table', description: 'Exact values in rows', Icon: Table, group: 'Single value & data' },
}

export const CHART_STYLE_OPTIONS: SelectOption[] = CHART_STYLES.map((style) => {
  const { label, description, Icon, group } = CHART_STYLE_META[style]
  return { value: style, label, description, group, icon: <Icon /> }
})
