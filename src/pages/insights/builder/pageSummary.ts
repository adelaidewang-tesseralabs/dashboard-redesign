import type { Dashboard } from '../../../data/dashboards'
import { runSql, type SqlResult } from '../../../data/dataSources'
import { applyTransforms, graphResult } from '../../../data/transforms'
import { isGraph, type GraphItem } from '../../../data/widgets'
import { resolveObjectItem } from './canvasItems'
import { objectGraphQuery } from './graphColors'
import { sqlKey, tableKey } from './v2/datasets'

type Bar = { label: string; value: number }
type Series = { subject: string; dimension: string; bars: Bar[]; total: number }
type Tone = 'good' | 'bad' | 'pending'

const TONES: Record<string, Tone> = {
  passed: 'good',
  pass: 'good',
  done: 'good',
  complete: 'good',
  completed: 'good',
  closed: 'good',
  resolved: 'good',
  fixed: 'good',
  approved: 'good',
  success: 'good',
  failed: 'bad',
  fail: 'bad',
  error: 'bad',
  blocked: 'bad',
  rejected: 'bad',
  overdue: 'bad',
  open: 'pending',
  'in progress': 'pending',
  pending: 'pending',
  'not run': 'pending',
  new: 'pending',
  'to do': 'pending',
  waiting: 'pending',
  queued: 'pending',
  draft: 'pending',
}

/** Reads better after "are": "most checks are passing", not "are passed". */
const STATUS_WORDS: Record<string, string> = { passed: 'passing', failed: 'failing' }

/** A sizable minority: enough failures to call out even when most rows pass. */
const NOTABLE_SHARE = 0.15
/** Below this, finished rows read as "few". */
const FEW_SHARE = 0.25
/** A category leads clearly when it holds this share and beats the runner-up by half again. */
const LEAD_SHARE = 0.35
const LEAD_RATIO = 1.5

/**
 * What the page's summary was written from: its graphs' data definitions and the last refresh. Titles, colors and chart
 * styles are left out, so restyling a graph doesn't make an edited summary ask to be rewritten.
 */
export function summaryBasis(dashboard: Dashboard): string {
  const graphs = (dashboard.widgets ?? []).filter(isGraph).map((item) => {
    const { title, description, showTitle, showDescription, palette, color, chart, ...data } = item
    return { ...data, plotted: chart !== 'metric' && chart !== 'gauge' }
  })
  return JSON.stringify({ graphs, refreshedAt: dashboard.refreshedAt, transforms: dashboard.datasetTransforms, datasets: dashboard.sqlDatasets })
}

/**
 * Up to two sentences on the story the page's graphs tell, or null when no graph has a breakdown to read. Reads each
 * graph's own data without dashboard or viewer filters, so everyone sees the same summary.
 */
export function summarizePage(dashboard: Dashboard): string | null {
  const groups = groupBySubject((dashboard.widgets ?? []).filter(isGraph).flatMap((item) => seriesOf(item, dashboard) ?? []))
  const [primary, secondary] = groups
  if (!primary) return null
  const [first, second, third] = primary
  const opening = sentence(clause(first, 'subject') + (second ? `, and ${clause(second, 'pronoun')}` : ''))
  const follow = secondary ? clause(secondary[0], 'subject', true) : third && clause(third, 'pronoun', true)
  return follow ? `${opening} ${sentence(follow)}` : opening
}

function seriesOf(item: GraphItem, dashboard: Dashboard): Series | null {
  if (item.chart === 'metric' || item.chart === 'gauge') return null
  if (item.source === 'object') {
    const resolved = resolveObjectItem(item)
    if (!resolved) return null
    const { object, field } = resolved
    const rows = applyTransforms(runSql(`SELECT * FROM ${object.name}`), dashboard.datasetTransforms?.[tableKey(object.name)])
    return toSeries(object.label, field.label, graphResult(rows, field.key, objectGraphQuery(item), field.values))
  }
  const dataset = item.datasetId ? dashboard.sqlDatasets?.find((entry) => entry.id === item.datasetId) : undefined
  if (item.datasetId && !dataset) return null
  const rows = applyTransforms(runSql(dataset?.sql ?? item.sql), item.datasetId ? dashboard.datasetTransforms?.[sqlKey(item.datasetId)] : undefined)
  const result = graphResult(rows, undefined, item.query)
  return result.ok ? toSeries(dataset?.label ?? item.title, result.columns[0] ?? '', result) : null
}

function toSeries(subject: string, dimension: string, result: SqlResult): Series | null {
  if (!result.ok || result.columns.length < 2) return null
  const bars = result.rows.map((row) => ({ label: String(row[0]), value: Number(row[row.length - 1]) })).filter((bar) => Number.isFinite(bar.value) && bar.value > 0)
  const total = bars.reduce((sum, bar) => sum + bar.value, 0)
  if (bars.length < 2 || total === 0) return null
  return { subject: subject.toLowerCase(), dimension: dimension.toLowerCase(), bars: bars.toSorted((a, b) => b.value - a.value), total }
}

/** Graphs of the same data, in page order; two graphs of the same breakdown (a pie and a table) count once. */
function groupBySubject(series: Series[]): Series[][] {
  const groups = new Map<string, Series[]>()
  for (const entry of series) {
    const group = groups.get(entry.subject) ?? []
    if (!group.some((other) => other.dimension === entry.dimension)) groups.set(entry.subject, [...group, entry])
  }
  return [...groups.values()]
}

function toneOf(label: string): Tone | undefined {
  return TONES[label.trim().toLowerCase()]
}

function statusWord(label: string) {
  const word = label.trim().toLowerCase()
  return STATUS_WORDS[word] ?? word
}

/** One finding about a graph, led by its subject ("work items …") or, after the first finding, by "they". */
function clause(series: Series, lead: 'subject' | 'pronoun', withTakeaway = false): string {
  const [top, runnerUp] = series.bars
  const share = (bar: Bar | undefined) => (bar ? bar.value / series.total : 0)
  const tones = series.bars.filter((bar) => toneOf(bar.label))
  const topTone = toneOf(top.label)
  const most = lead === 'subject' ? `most ${series.subject} are` : 'most are'
  if (tones.length >= 2 && topTone) {
    const good = series.bars.find((bar) => toneOf(bar.label) === 'good')
    const bad = series.bars.find((bar) => toneOf(bar.label) === 'bad')
    switch (topTone) {
      case 'good':
        return `${most} ${statusWord(top.label)}` + (bad && share(bad) >= NOTABLE_SHARE ? `, though ${statusWord(bad.label)} ones are still a sizable share` : '')
      case 'pending':
        return (
          `${most} still ${statusWord(top.label)}` +
          (good && share(good) < FEW_SHARE ? ` and few are ${statusWord(good.label)}` : '') +
          (withTakeaway ? ', so the work is underway but not landing yet' : '')
        )
      case 'bad':
        return `${most} ${statusWord(top.label)}, which needs attention first`
      default: {
        const unhandled: never = topTone
        return unhandled
      }
    }
  }
  const who = lead === 'subject' ? series.subject : 'they'
  if (share(top) >= LEAD_SHARE && top.value >= runnerUp.value * LEAD_RATIO) return `${who} skew toward ${top.label} ${series.dimension}`
  return `${who} spread fairly evenly across ${series.dimension}, led by ${top.label} and ${runnerUp.label}`
}

function sentence(text: string) {
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}.`
}
