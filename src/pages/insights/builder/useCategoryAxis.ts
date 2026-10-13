import { useState } from 'react'

/** Matches `chartAxisProps.tick.fontSize`. */
const TICK_FONT_PX = 11
/** Matches the charts' `YAxis` width. */
const Y_AXIS_PX = 44
/** Free space a label needs on each side to read as separate from its neighbours. */
const LABEL_GAP_PX = 6
/** Room each vertical label takes along the axis. */
const ROTATED_LINE_PX = 14
const MAX_ROTATED_PX = 80

let context: CanvasRenderingContext2D | null = null
const widths = new Map<string, number>()

function textWidth(text: string) {
  const cached = widths.get(text)
  if (cached !== undefined) return cached
  context ??= document.createElement('canvas').getContext('2d')
  if (!context) return text.length * TICK_FONT_PX * 0.6
  context.font = `${TICK_FONT_PX}px ${getComputedStyle(document.body).fontFamily}`
  const width = context.measureText(text).width
  widths.set(text, width)
  return width
}

function clip(label: string) {
  if (textWidth(label) <= MAX_ROTATED_PX) return label
  let end = label.length
  while (end > 1 && textWidth(`${label.slice(0, end)}…`) > MAX_ROTATED_PX) end--
  return `${label.slice(0, end)}…`
}

type CategoryAxisOptions = {
  /** Horizontal space inside the chart that isn't plot: margins plus axis padding. */
  insetPx: number
  /** Labels sit on points spread edge to edge (line, area) rather than centred in equal bands (bar). */
  points?: boolean
  /** Something else names every label (a legend), so crowded labels are dropped rather than turned vertical. */
  hideWhenCrowded?: boolean
}

/**
 * X-axis props that keep category labels readable as a chart narrows: side by side while they fit, then vertical
 * (capped, with "…"), then every nth label once even vertical ones would collide. Pass `onResize` to the
 * chart's `ResponsiveContainer`.
 */
export function useCategoryAxis(labels: string[], { insetPx, points = false, hideWhenCrowded = false }: CategoryAxisOptions) {
  const [chartWidth, setChartWidth] = useState(0)
  const onResize = (width: number) => setChartWidth(width)
  const plot = chartWidth - Y_AXIS_PX - insetPx
  const slot = plot / Math.max(1, points ? labels.length - 1 : labels.length)
  const labelWidths = labels.map(textWidth)
  const fits = chartWidth === 0 || labelWidths.every((width) => width + LABEL_GAP_PX <= slot)
  if (fits) return { onResize, axis: { interval: 0 } as const }
  if (hideWhenCrowded) return { onResize, axis: { tick: false, height: 8 } as const }
  const step = slot > 0 ? Math.ceil(ROTATED_LINE_PX / slot) : 1
  return {
    onResize,
    axis: {
      interval: step - 1,
      angle: -90,
      textAnchor: 'end',
      height: Math.min(MAX_ROTATED_PX, Math.max(...labelWidths)) + 12,
      tickFormatter: (label: unknown) => clip(String(label)),
    } as const,
  }
}
