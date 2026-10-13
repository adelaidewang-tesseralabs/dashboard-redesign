/*
 * Every graph color here reaches 3:1 (WCAG non-text contrast) on both the light card (#fff) and the dark
 * card (#1f1f1f), so one set serves both canvas themes. That confines them to mid-tones: no pastels or
 * light-to-dark shade ramps. Check both ratios before adding one.
 */

/** Tableau 10 with orange, teal, yellow, pink and gray deepened to pass on white. */
export const CHART_COLORS = [
  '#4E79A7',
  '#DB7900',
  '#E15759',
  '#5C9D98',
  '#59A14F',
  '#B18E00',
  '#AF7AA1',
  '#D47681',
  '#9C755F',
  '#99908B',
]

/** The main ten then ten more distinct hues, so unrelated graphs on one dashboard can each get their own colors before any repeat. */
export const DASHBOARD_COLORS = [
  ...CHART_COLORS,
  '#397852',
  '#8959BA',
  '#B54879',
  '#7382E6',
  '#7F7700',
  '#B95115',
  '#0098D9',
  '#876888',
  '#A86FCF',
  '#3D892A',
]

/** Graph color schemes people can pick in widget settings or ask Tessera AI for. Six-digit hex only: highlights append an alpha suffix. */
export const CHART_PALETTES = {
  default: { label: 'Default', colors: CHART_COLORS },
  cool: { label: 'Cool', colors: ['#4E79A7', '#5C9D98', '#59A14F', '#A272D4', '#397852', '#5F87E7', '#6E64C8', '#8B86AF'] },
  warm: { label: 'Warm', colors: ['#E15759', '#DB7900', '#B18E00', '#9C755F', '#A84D97', '#CF71BD', '#B95115', '#857500'] },
  vivid: { label: 'Vivid', colors: ['#00A67F', '#3B82F6', '#D27E00', '#EF4444', '#A855F7', '#EC4899', '#5EA300', '#9B5896'] },
} as const satisfies Record<string, { label: string; colors: readonly string[] }>

/** Line, area and gauge graphs draw one color, so they pick one of these instead of a palette. Unset means auto. */
export const CHART_SINGLE_COLORS = {
  blue: { label: 'Blue', color: CHART_COLORS[0] },
  orange: { label: 'Orange', color: CHART_COLORS[1] },
  red: { label: 'Red', color: CHART_COLORS[2] },
  teal: { label: 'Teal', color: CHART_COLORS[3] },
  green: { label: 'Green', color: CHART_COLORS[4] },
  yellow: { label: 'Yellow', color: CHART_COLORS[5] },
  purple: { label: 'Purple', color: CHART_COLORS[6] },
  pink: { label: 'Pink', color: CHART_COLORS[7] },
  brown: { label: 'Brown', color: CHART_COLORS[8] },
  gray: { label: 'Gray', color: CHART_COLORS[9] },
} as const satisfies Record<string, { label: string; color: string }>

export type ChartColor = keyof typeof CHART_SINGLE_COLORS
export const CHART_COLOR_IDS = Object.keys(CHART_SINGLE_COLORS) as ChartColor[]

export function isChartColor(value: string): value is ChartColor {
  return value in CHART_SINGLE_COLORS
}

export type ChartPalette = keyof typeof CHART_PALETTES
export const CHART_PALETTE_IDS = Object.keys(CHART_PALETTES) as ChartPalette[]

export function isChartPalette(value: string): value is ChartPalette {
  return value in CHART_PALETTES
}

/** Graphs saved with a palette that's since been removed (pastel, the shade ramps) fall back to Default. */
export function resolvePalette(palette: string | undefined): ChartPalette {
  return palette && isChartPalette(palette) ? palette : 'default'
}

export const THRESHOLD_COLORS = { low: '#DE5472', medium: '#B18E00', high: '#00A67F' } as const

const DIMENSION_ORDER = ['Accuracy', 'Completeness', 'Consistency', 'Uniqueness', 'Validity', 'Timeliness']

export function dimensionColor(dimension: string) {
  const index = DIMENSION_ORDER.indexOf(dimension)
  return CHART_COLORS[(index === -1 ? DIMENSION_ORDER.length : index) % CHART_COLORS.length]
}

/** Port of `useStringToColor` from the DH feature — stable tonal chip colors per string. */
export function stringToColor(value: string) {
  let hash = 0
  for (let i = 0; i < value.length; i++) hash = (hash * 41 + value.charCodeAt(i)) % (10 ** 9 + 7)
  const hues = [0, 40, 80, 120, 160, 200, 240, 280, 320]
  const hue = hues[Math.abs(hash) % hues.length]
  const saturation = 55 + (hash % 65)
  const lightness = 55 + (hash % 20)
  return {
    bg: `hsl(${hue}, ${saturation}%, ${lightness}%, 0.2)`,
    text: `hsl(${hue}, ${saturation}%, ${lightness + 25}%)`,
  }
}

export function scoreColor(score: number) {
  if (score >= 95) return THRESHOLD_COLORS.high
  if (score >= 85) return THRESHOLD_COLORS.medium
  return THRESHOLD_COLORS.low
}
