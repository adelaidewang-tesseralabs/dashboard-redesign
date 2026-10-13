import type { Dashboard } from '../../../../data/dashboards'
import { DATA_OBJECTS, findObject, type DataField, type DataObject } from '../../../../data/dataSources'
import { externalTables } from '../../../../data/externalSources'
import { DATA_CHECKS_TABLE, objectItem, sameSource, type CanvasItem } from '../../../../data/widgets'
import type { ChatChoice, ChatSource } from '../ChatPanel'
import { describe, matchObjects, planWidgets } from '../planWidgets'
import { ORIGIN_META } from '../sourceKinds'
import type { ChatPlan, ChatPlanner } from '../useBuilderChat'

/** Business terms per lake table — the stand-in for semantic search over table descriptions. Plurals match too. */
const TABLE_TERMS: Record<string, string[]> = {
  'cvi_dt.vendor_core.lfa1_clean': ['vendor', 'supplier', 'vendor master'],
  'cvi_dt.vendor_core.lfb1_clean': ['company code', 'vendor company code'],
  'cvi_dt.vendor_core.vendor_dedup': ['duplicate', 'dedup', 'vendor duplicate'],
  'sap_ecc.master_data.but000': ['business partner', 'bp'],
  'sap_ecc.master_data.kna1': ['customer'],
  'sap_ecc.master_data.mara': ['material', 'product'],
  'wf.vendor_harmonization.merge_vendors_golden_records_parquet': ['golden record', 'merged vendor'],
  'wf.vendor_harmonization.merge_vendors_duplicates_csv': ['duplicate', 'merge candidate'],
  'wf.vendor_harmonization.validate_exceptions_csv': ['exception', 'validation exception'],
  'wf.bp_migration_load.transform_bp_staging_parquet': ['business partner', 'staging', 'bp migration'],
  'wf.bp_migration_load.load_load_errors_csv': ['load error', 'failed load'],
  'wf.gl_reconciliation.reconcile_unmatched_entries_csv': ['unmatched', 'reconciliation', 'general ledger'],
}

const MAX_CHOICES = 4

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const mentions = (text: string, term: string) => new RegExp(`\\b${escape(term)}s?\\b`).test(text)

/** Table names are searchable too ("kna1", an upload's file name), minus generic path noise. */
function nameTerms(table: DataObject) {
  return table.label
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((part) => part.length >= 3 && !['clean', 'batch', 'csv', 'parquet'].includes(part))
}

/** Word-weighted term hits; already-attached datasets win ties so the dashboard's own data comes first. */
function score(table: DataObject, text: string, attached: Set<string>) {
  const terms = [...(TABLE_TERMS[table.name] ?? []), ...nameTerms(table)]
  const hits = terms.filter((term) => mentions(text, term)).reduce((total, term) => total + term.split(' ').length, 0)
  return hits && hits + (attached.has(table.name) ? 0.5 : 0)
}

function requestedField(table: DataObject, text: string): DataField | undefined {
  return table.fields.find((field) => text.includes(`by ${field.label.toLowerCase()}`) || text.includes(`by ${field.key}`))
}

/** `@sap_ecc.master_data.kna1` or `@kna1`. Multi-word Mosaic mentions ("@Work Items") are left to `matchObjects`. */
function mentionedTable(text: string) {
  const match = /@([\w.]+)/.exec(text)
  if (!match) return undefined
  const name = match[1].toLowerCase()
  return findObject(name) ?? externalTables().find((table) => table.label.toLowerCase() === name)
}

const toSource = (table: DataObject, label = table.label): ChatSource => ({ label, origin: table.origin ?? 'mosaic', table: table.name })

/** Every source the assistant read lands in Data, so the dashboard keeps it even if the graph goes. */
function withAttached(plan: ChatPlan, dashboard: Dashboard): ChatPlan {
  const attach = (plan.sources ?? []).flatMap((source) =>
    source.table && !dashboard.sources?.some((existing) => existing.table === source.table) ? [{ table: source.table, label: source.label }] : [],
  )
  if (!attach.length) return plan
  const where = attach.length === 1 ? `${attach[0].label} now appears` : 'They now appear'
  return { ...plan, attach, reply: `${plan.reply} ${where} in Data.` }
}

function chartTable(table: DataObject, text: string, dashboard: Dashboard): ChatPlan {
  const attachedLabel = dashboard.sources?.find((source) => source.table === table.name)?.label
  const label = attachedLabel ?? table.label
  const requested = requestedField(table, text)
  const field = requested ?? table.fields[0]
  const item: CanvasItem = { ...objectItem(table.name, field.key), title: `${label} by ${field.label}` }
  const fallback = !requested && /\bby \w/.test(text) ? ` It has no field like that, so I grouped by ${field.label}.` : ''
  const where = `${label} (${ORIGIN_META[table.origin ?? 'mosaic'].label})`
  const sources = [toSource(table, label)]
  if ((dashboard.widgets ?? []).some((widget) => sameSource(widget, item))) {
    return { items: [], reply: `The dashboard already shows ${item.title}.`, sources }
  }
  return { items: [item], sources, reply: `Added ${item.title}, from ${where}.${fallback}` }
}

function askWhich(candidates: DataObject[], text: string): ChatPlan {
  const choices = candidates.slice(0, MAX_CHOICES).map((table): ChatChoice => {
    const field = requestedField(table, text)
    return {
      label: table.label,
      detail: `${ORIGIN_META[table.origin ?? 'mosaic'].label} · ${table.name}`,
      prompt: `@${table.name}${field ? ` by ${field.label}` : ''}`,
    }
  })
  return { items: [], choices, reply: `${choices.length} sources match. Which one should I use?` }
}

/**
 * Builder V2 assistant: reads any source the tenant can access, not only what's attached.
 * Order: an explicit @table, then Mosaic objects, then the best catalog match, then Data Checks graphs.
 */
export const planFromCatalog: ChatPlanner = (prompt, dashboard) => withAttached(plan(prompt, dashboard), dashboard)

function plan(prompt: string, dashboard: Dashboard): ChatPlan {
  const text = prompt.toLowerCase()

  const mentioned = mentionedTable(prompt)
  if (mentioned) return chartTable(mentioned, text, dashboard)

  const objectItems = matchObjects(prompt)
  if (objectItems.length) {
    const sources = DATA_OBJECTS.filter((object) => objectItems.some((item) => item.source === 'object' && item.objectName === object.name)).map((object) => toSource(object))
    const added = objectItems.filter((item) => !(dashboard.widgets ?? []).some((widget) => sameSource(widget, item)))
    if (!added.length) return { items: [], sources, reply: `The dashboard already shows ${describe(objectItems)}.` }
    return { items: added, sources, reply: `Added ${describe(added)}, counted from the live records.` }
  }

  const attached = new Set((dashboard.sources ?? []).map((source) => source.table))
  const ranked = externalTables()
    .map((table) => ({ table, score: score(table, text, attached) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
  if (ranked.length) {
    const best = ranked.filter((entry) => entry.score === ranked[0].score).map((entry) => entry.table)
    return best.length === 1 ? chartTable(best[0], text, dashboard) : askWhich(best, text)
  }

  const insights = planWidgets(prompt, dashboard.widgets ?? [])
  return { ...insights, sources: [{ label: 'Data Checks', origin: 'mosaic', table: DATA_CHECKS_TABLE }] }
}
