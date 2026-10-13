import { externalTables } from './externalSources'

/** Mock Mosaic objects a graph can be built from — a slice of the main app's dataviz `MOSAIC_META`. */
export type DataField = { key: string; label: string; values: string[] }
export type SourceOrigin = 'mosaic' | 'foundry' | 'workflow' | 'upload'
/** `name` is the queryable table name — a dotted lake path for non-Mosaic sources. */
export type DataObject = { name: string; label: string; total: number; fields: DataField[]; origin?: SourceOrigin }

export const DATA_OBJECTS: DataObject[] = [
  {
    name: 'packages',
    label: 'Packages',
    total: 184,
    fields: [
      { key: 'status', label: 'Status', values: ['Draft', 'In review', 'Approved', 'Published'] },
      { key: 'type', label: 'Type', values: ['Process', 'Standard', 'Reference'] },
    ],
  },
  {
    name: 'documents',
    label: 'Documents',
    total: 1260,
    fields: [
      { key: 'file_type', label: 'File type', values: ['PDF', 'Word', 'Excel', 'Image'] },
      { key: 'status', label: 'Status', values: ['Indexed', 'Processing', 'Failed'] },
    ],
  },
  {
    name: 'data_checks',
    label: 'Data Checks',
    total: 312,
    fields: [
      { key: 'priority', label: 'Priority', values: ['Critical', 'High', 'Medium', 'Low'] },
      { key: 'dimension', label: 'Dimension', values: ['Accuracy', 'Completeness', 'Consistency', 'Uniqueness', 'Validity'] },
      { key: 'status', label: 'Last run status', values: ['Passed', 'Failed', 'Not run'] },
    ],
  },
  {
    name: 'work_items',
    label: 'Work Items',
    total: 948,
    fields: [
      { key: 'status', label: 'Status', values: ['Open', 'In progress', 'Blocked', 'Done'] },
      { key: 'priority', label: 'Priority', values: ['Urgent', 'High', 'Normal', 'Low'] },
      { key: 'assignee', label: 'Assignee', values: ['Adelaide W.', 'Marco L.', 'Priya S.', 'Unassigned'] },
    ],
  },
  {
    name: 'dashboards',
    label: 'Dashboards',
    total: 42,
    fields: [
      { key: 'tags', label: 'Tags', values: ['Vendor MDM', 'SAP BP Migration', 'Finance Close'] },
      { key: 'type', label: 'Type', values: ['Harmonization', 'Analytics'] },
    ],
  },
  {
    name: 'field_mappings',
    label: 'Field Mappings',
    total: 2310,
    fields: [
      { key: 'status', label: 'Status', values: ['Proposed', 'Validated', 'Rejected'] },
      { key: 'confidence', label: 'Confidence', values: ['High', 'Medium', 'Low'] },
    ],
  },
  {
    name: 'nexus_projects',
    label: 'Nexus Projects',
    total: 18,
    fields: [{ key: 'phase', label: 'Phase', values: ['Discovery', 'Mapping', 'Sign-off', 'Live'] }],
  },
]

export type CountRow = { label: string; count: number }

/** Resolves Mosaic objects and attached lake tables (Foundry, workflow outputs, uploads) by table name. */
export function findObject(name: string) {
  return DATA_OBJECTS.find((object) => object.name === name) ?? externalTables().find((object) => object.name === name)
}

/** Tables that still exist but the current user can't query, e.g. after their access was revoked. Never offered in pickers. */
const RESTRICTED_TABLES: Record<string, string> = { payroll_costs: 'Payroll Costs', 'finance.gl.journal_lines': 'GL journal lines' }

/** Tables older dashboard versions used that have since been dropped. */
const RETIRED_TABLES: Record<string, string> = { legacy_vendor_extract: 'Legacy vendor extract' }

/** Mock per-person table permissions, so previewing a dashboard as someone shows what theirs hide. */
const PERSON_DENIED_TABLES: Record<string, string[]> = {
  'olivier@tesseralabs.ai': ['work_items'],
  'sophia@tesseralabs.ai': ['data_checks'],
  'arihant@tesseralabs.ai': ['field_mappings'],
  'tracy@tesseralabs.ai': ['work_items', 'data_checks'],
}

export type TableAccess = { ok: true } | { ok: false; reason: 'denied' | 'missing'; label: string }

/**
 * Whether `user` can query `name`; queries always run with the viewer's own permissions. Unset `user` is the current
 * user, who builds dashboards and so can query everything but `RESTRICTED_TABLES`.
 */
export function tableAccess(name: string, user?: string): TableAccess {
  if (RESTRICTED_TABLES[name]) return { ok: false, reason: 'denied', label: RESTRICTED_TABLES[name] }
  const object = findObject(name)
  if (!object) return { ok: false, reason: 'missing', label: RETIRED_TABLES[name] ?? name }
  if (user && PERSON_DENIED_TABLES[user]?.includes(name)) return { ok: false, reason: 'denied', label: object.label }
  return { ok: true }
}

export function sqlTable(sql: string) {
  return /\bfrom\s+([\w.]+)/i.exec(sql)?.[1]?.toLowerCase()
}

function weight(seed: string) {
  let hash = 7
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) % 9973
  return 1 + (hash % 9)
}

/** Deterministic mock record counts per value of `field`, summing to the object's total. */
export function countsBy(object: DataObject, field: DataField): CountRow[] {
  const weights = field.values.map((value) => weight(`${object.name}.${field.key}.${value}`))
  const sum = weights.reduce((total, value) => total + value, 0)
  return field.values.map((label, index) => ({ label, count: Math.round((weights[index] / sum) * object.total) }))
}

export type Cell = string | number | null

export type SqlResult = { ok: true; columns: string[]; rows: Cell[][]; grouped: boolean } | { ok: false; error: string }

/** Measures every mock table carries, so calculations and sums have numbers to work with. */
export const NUMERIC_COLUMNS = ['total_scan', 'issue_count', 'score'] as const

export function objectColumns(object: DataObject) {
  return ['id', ...object.fields.map((field) => field.key), ...NUMERIC_COLUMNS]
}

function seededRandom(seed: string) {
  let state = 7
  for (const char of seed) state = (state * 31 + char.charCodeAt(0)) % 2147483647
  return () => {
    state = (state * 48271) % 2147483647
    return state / 2147483647
  }
}

/** Each value repeated by its `countsBy` count, shuffled, so grouping the rows reproduces the mock counts exactly. */
function fieldColumn(object: DataObject, field: DataField) {
  const values = countsBy(object, field).flatMap((row) => Array<string>(row.count).fill(row.label))
  while (values.length < object.total) values.push(field.values[field.values.length - 1])
  values.length = object.total
  const random = seededRandom(`${object.name}.${field.key}`)
  for (let index = values.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1))
    ;[values[index], values[swap]] = [values[swap], values[index]]
  }
  return values
}

const rowCache = new Map<string, Cell[][]>()

/** One deterministic row per record of the object, in `objectColumns` order. */
export function objectRows(object: DataObject): Cell[][] {
  const cached = rowCache.get(object.name)
  if (cached) return cached
  const prefix = object.label.slice(0, 2).toUpperCase()
  const columns = object.fields.map((field) => fieldColumn(object, field))
  const random = seededRandom(`${object.name}#rows`)
  const rows = Array.from({ length: object.total }, (_, index): Cell[] => {
    const totalScan = 50 + Math.floor(random() * 4950)
    const issueCount = Math.round(totalScan * random() * 0.3)
    const score = Math.round(((totalScan - issueCount) / totalScan) * 1000) / 10
    return [`${prefix}-${String(index + 1).padStart(4, '0')}`, ...columns.map((values) => values[index]), totalScan, issueCount, score]
  })
  rowCache.set(object.name, rows)
  return rows
}

export const DEFAULT_SQL = 'SELECT priority, COUNT(*) AS count\nFROM data_checks\nGROUP BY priority'

export function groupBySql(object: DataObject, field: DataField) {
  return `SELECT ${field.key}, COUNT(*) AS count\nFROM ${object.name}\nGROUP BY ${field.key}`
}

/** Prototype query engine: understands `FROM <object or lake table>` with an optional `GROUP BY <field>`. */
export function runSql(sql: string): SqlResult {
  const table = sqlTable(sql)
  if (!table) return { ok: false, error: 'Add a FROM clause, e.g. FROM data_checks.' }
  const access = tableAccess(table)
  if (!access.ok && access.reason === 'denied') return { ok: false, error: `You don't have access to ${access.label}.` }
  const object = findObject(table)
  if (!object) {
    return { ok: false, error: `Table "${table}" not found. Try ${DATA_OBJECTS.map((item) => item.name).join(', ')}, or a Foundry table path.` }
  }
  const groupKey = /\bgroup\s+by\s+(\w+)/i.exec(sql)?.[1]
  if (groupKey) {
    const field = object.fields.find((item) => item.key === groupKey.toLowerCase())
    if (!field) {
      return { ok: false, error: `Column "${groupKey}" not found on ${object.name}. Try ${object.fields.map((item) => item.key).join(', ')}.` }
    }
    return {
      ok: true,
      grouped: true,
      columns: [field.key, 'count'],
      rows: countsBy(object, field).map((row) => [row.label, row.count]),
    }
  }
  return { ok: true, grouped: false, columns: objectColumns(object), rows: objectRows(object) }
}
