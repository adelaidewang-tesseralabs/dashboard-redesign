import { isGraph, showsLegend, usesColor, usesLegend, usesSingleColor, type ChartStyle, type CanvasItem, type GraphItem } from '../../../data/widgets'
import { CHART_COLOR_IDS, CHART_PALETTES, CHART_SINGLE_COLORS, resolvePalette, type ChartColor, type ChartPalette } from '../../../lib/colors'
import { itemLabel } from './canvasItems'
import { CHART_STYLE_META } from './chartStyles'

export type WidgetEditPlan = { item?: CanvasItem; reply: string }

const STYLE_WORDS: [RegExp, ChartStyle][] = [
  [/\b(bar|column)s?\b/, 'bar'],
  [/\bline\b/, 'line'],
  [/\barea\b/, 'area'],
  [/\b(pie|donut|doughnut)\b/, 'pie'],
  [/\btable\b/, 'table'],
  [/\b(metric|kpi|number)\b/, 'metric'],
  [/\bgauge\b/, 'gauge'],
]

const withArticle = (word: string) => `${/^[aeiou]/.test(word) ? 'an' : 'a'} ${word}`

const quoted = (text: string) => text.trim().replace(/^["'“‘]|["'”’.]$/g, '').trim()

const GRAPH_STYLES: ChartStyle[] = ['bar', 'line', 'area', 'pie', 'table']

const COLOR_REQUEST = /\b(colou?rs?|colou?red|palette|scheme|combination|combo|shades?|tones?|recolou?r)\b/
const HUE_WORDS: [RegExp, ChartColor][] = [
  [/\bblue\b/, 'blue'],
  [/\bgreen\b/, 'green'],
  [/\b(purple|violet)\b/, 'purple'],
  [/\borange\b/, 'orange'],
  [/\bred\b/, 'red'],
  [/\b(teal|cyan|turquoise)\b/, 'teal'],
]
/** Multi-color graphs have no single-hue palettes, so a hue picks the palette built around it. */
const HUE_TO_PALETTE: Record<ChartColor, ChartPalette> = {
  blue: 'cool',
  green: 'cool',
  teal: 'cool',
  purple: 'cool',
  orange: 'warm',
  red: 'warm',
  yellow: 'warm',
  pink: 'warm',
  brown: 'warm',
  gray: 'default',
}
/** Only read as a color request alongside a word like "colors", so "a cool chart" or "reset the sort" don't recolor. */
const MOOD_WORDS: [RegExp, ChartPalette][] = [
  [/\bwarm(er)?\b/, 'warm'],
  [/\b(cool(er)?|cold)\b/, 'cool'],
  [/\b(vivid|bright(er)?|bold(er)?|vibrant|neon)\b/, 'vivid'],
  [/\b(default|original|reset)\b/, 'default'],
]
const PASTEL_WORDS = /\b(pastel|soft(er)?|muted|light(er)?)\b/
/** "Change the colors" with no direction steps through the palettes, so the chart visibly changes. */
const PALETTE_CYCLE: ChartPalette[] = ['default', 'cool', 'warm', 'vivid']
const PALETTE_HINT = 'You can also ask for warm, cool or vivid colors.'

function planColorEdit(text: string, item: GraphItem, name: string): WidgetEditPlan | undefined {
  const hue = HUE_WORDS.find(([pattern]) => pattern.test(text))?.[1]
  const asked = COLOR_REQUEST.test(text)
  if (!hue && !asked) return undefined
  if (!usesColor(item.chart)) {
    return { reply: `${CHART_STYLE_META[item.chart].label} graphs don't use colors. Switch ${name} to a bar, line, area or pie chart first.` }
  }
  const mood = asked ? MOOD_WORDS.find(([pattern]) => pattern.test(text))?.[1] : undefined
  if (asked && !hue && !mood && PASTEL_WORDS.test(text)) {
    return { reply: `Pastel colors are too faint to read on both light and dark dashboards, so graphs don't offer them. ${PALETTE_HINT}` }
  }
  if (usesSingleColor(item.chart)) return planSingleColorEdit(item, name, hue ?? (mood ? MOOD_TO_COLOR[mood] : undefined), !!(hue || mood))
  const current = resolvePalette(item.palette)
  const named = (hue && HUE_TO_PALETTE[hue]) ?? mood
  const palette = named ?? PALETTE_CYCLE[(PALETTE_CYCLE.indexOf(current) + 1) % PALETTE_CYCLE.length]
  const label = CHART_PALETTES[palette].label
  if (palette === current) return { reply: `${name} already uses the ${label} palette. ${PALETTE_HINT}` }
  return { item: { ...item, palette }, reply: named ? `Switched ${name} to the ${label} palette.` : `Switched ${name} to the ${label} palette. ${PALETTE_HINT}` }
}

/** Mood words a one-color graph reads as a single color; `default` goes back to auto. */
const MOOD_TO_COLOR: Record<ChartPalette, ChartColor | undefined> = {
  default: undefined,
  cool: 'teal',
  warm: 'orange',
  vivid: 'red',
}
const COLOR_HINT = `You can also ask for ${CHART_COLOR_IDS.map((id) => CHART_SINGLE_COLORS[id].label.toLowerCase()).join(', ')}, or auto.`

/** Line, area and gauge graphs draw one color: a direction picks it, none steps to the next one so the change shows. */
function planSingleColorEdit(item: GraphItem, name: string, named: ChartColor | undefined, directed: boolean): WidgetEditPlan {
  const current = item.color
  const color = directed ? named : CHART_COLOR_IDS[(current ? CHART_COLOR_IDS.indexOf(current) + 1 : 0) % CHART_COLOR_IDS.length]
  const label = color ? CHART_SINGLE_COLORS[color].label.toLowerCase() : 'its auto color'
  if (color === current) return { reply: `${name} is already ${label}. ${COLOR_HINT}` }
  const reply = `Recolored ${name} in ${label}.`
  return { item: { ...item, color }, reply: directed ? reply : `${reply} ${COLOR_HINT}` }
}

const LEGEND_REQUEST = /\b(legends?|colou?r key)\b/
const LEGEND_OFF = /\b(hide|remove|turn off|switch off|no|not|don'?t|without|drop|get rid of)\b/

function planLegendEdit(text: string, item: GraphItem, name: string): WidgetEditPlan | undefined {
  if (!LEGEND_REQUEST.test(text)) return undefined
  if (!usesLegend(item.chart)) {
    return { reply: `${CHART_STYLE_META[item.chart].label} graphs don't have a legend. Switch ${name} to a bar or pie chart first.` }
  }
  const legend = !LEGEND_OFF.test(text)
  if (legend === showsLegend(item)) return { reply: legend ? `${name} already shows its legend.` : `${name} has no legend showing.` }
  return { item: { ...item, legend }, reply: legend ? `Added a legend under ${name}.` : `Hid the legend on ${name}.` }
}

/** Up to three edits worth suggesting for this graph — enough to show what's possible without a menu of options. */
export function widgetSuggestions(item: CanvasItem): string[] {
  const description = item.showDescription ? 'Rename the title' : 'Add a short description'
  if (!isGraph(item)) return [description]
  const alternative = GRAPH_STYLES.find((style) => style !== item.chart && style !== 'table')
  const suggestions = alternative ? [`Show as ${withArticle(CHART_STYLE_META[alternative].label.toLowerCase())} chart`] : []
  if (usesSingleColor(item.chart)) suggestions.push(item.color === 'orange' ? 'Make it teal' : 'Make it orange')
  else if (usesColor(item.chart)) suggestions.push(item.palette === 'warm' ? 'Use cool colors' : 'Use warm colors')
  return [...suggestions, 'Only show the top 5', description].slice(0, 3)
}

/** Interprets a request to change one graph: its style, colors, legend, title, description, sort or top N. */
export function planWidgetEdit(prompt: string, item: CanvasItem): WidgetEditPlan {
  const text = prompt.toLowerCase()
  const name = itemLabel(item)

  const title = prompt.match(/\b(?:rename(?: (?:it|the title|this))?|title|call it)\s+(?:to\s+|as\s+)?(.+)$/i)
  if (title && !/^the title$/i.test(title[1].trim())) {
    const next = quoted(title[1])
    return { item: { ...item, title: next, showTitle: true }, reply: `Renamed the graph to “${next}”.` }
  }
  if (/\b(rename|title)\b/.test(text)) return { reply: 'What should the new title be? For example: “Rename to Open issues by priority”.' }

  const description = prompt.match(/\b(?:description|subtitle)\b\s*(?:to|:|saying|that says)?\s*(.+)$/i)
  if (description && quoted(description[1]).length > 3) {
    const next = quoted(description[1])
    return { item: { ...item, description: next, showDescription: true }, reply: 'Added the description under the title.' }
  }
  if (/\b(description|subtitle)\b/.test(text)) {
    return { item: { ...item, description: `${name} from the latest run.`, showDescription: true }, reply: 'Added a short description. Tell me what it should say to change it.' }
  }

  if (/\b(hide|remove)\b.*\btitle\b/.test(text)) return { item: { ...item, showTitle: false }, reply: 'Hid the title.' }

  if (item.source === 'media') return { reply: `I can change ${name}'s title or description. Replace the file from its settings panel.` }
  if (item.source === 'text') return { reply: 'I can change the block’s title or description. Select the block to edit its text, and use the Textbox settings for background, border and alignment.' }

  // Before chart styles: "show the legend on the pie chart" names the current style without asking to change it.
  const legendEdit = planLegendEdit(text, item, name)
  if (legendEdit) return legendEdit

  // Before chart styles: "change the pie chart's colors" names the current style without asking to change it.
  const colorEdit = planColorEdit(text, item, name)
  if (colorEdit) return colorEdit

  // "Turn this bar chart into a pie" names both; the one that isn't the current style is the request.
  const styles = STYLE_WORDS.filter(([pattern]) => pattern.test(text)).map(([, style]) => style)
  const style = styles.find((candidate) => candidate !== item.chart) ?? styles[0]
  if (style) {
    const label = CHART_STYLE_META[style].label.toLowerCase()
    if (item.chart === style) return { reply: `It's already ${withArticle(label)} chart.` }
    if (!GRAPH_STYLES.includes(style)) {
      const options = GRAPH_STYLES.map((option) => CHART_STYLE_META[option].label.toLowerCase())
      return { reply: `${name} can't be drawn as ${withArticle(label)} chart. Try ${options.join(', ')}.` }
    }
    return { item: { ...item, chart: style }, reply: `Switched ${name} to ${withArticle(label)} chart.` }
  }

  const top = text.match(/\btop\s+(\d+)\b/)
  const sorting = /\b(sort|order)\b/.test(text)
  if (top) {
    const limit = Number(top[1])
    return { item: { ...item, query: { ...item.query, limit, sort: { by: 'value', direction: 'desc' } } }, reply: `Now showing the top ${limit}, largest first.` }
  }
  if (sorting) {
    const by = /\b(alpha|name|label|a-z)/.test(text) ? 'label' : 'value'
    const direction = /\b(asc|lowest|smallest|a-z)/.test(text) ? 'asc' : by === 'label' ? 'asc' : 'desc'
    return { item: { ...item, query: { ...item.query, sort: { by, direction } } }, reply: by === 'label' ? 'Sorted alphabetically.' : `Sorted by value, ${direction === 'desc' ? 'largest' : 'smallest'} first.` }
  }

  return { reply: `I can change ${name}'s chart style, colors, legend, title, description, sort order, or limit it to the top N. What would you like?` }
}
