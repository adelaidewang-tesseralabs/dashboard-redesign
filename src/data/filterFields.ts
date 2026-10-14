import { findObject, seededRandom, sqlTable, type DataObject, type SqlResult } from './dataSources'

/** The value editor a preset filter field opens, as in the main app's FilterBuilder. */
export type FilterFieldType = 'text' | 'select' | 'number' | 'date' | 'boolean' | 'user'

/**
 * A field of the main app's Mosaic model, in its FilterBuilder order. Fields the prototype's tables already carry use
 * that column; `mock` fields aren't in the tables, so graph menus, the catalog and V6 never see them — their values are
 * generated only when a preset filter narrows on them. `options` are a select's choices, or the pool text values draw from.
 */
export type FilterFieldSpec = { key: string; label: string; type: FilterFieldType; mock?: boolean; options?: string[]; prefix?: string }

const USERS = ['Adelaide W.', 'Marco L.', 'Priya S.', 'Olivier B.', 'Sophia K.']

const AUDIT_FIELDS: FilterFieldSpec[] = [
  { key: 'created_by', label: 'Created By', type: 'user', mock: true, options: USERS },
  { key: 'created_date', label: 'Created At', type: 'date', mock: true },
  { key: 'updated_by', label: 'Updated By', type: 'user', mock: true, options: USERS },
  { key: 'updated_date', label: 'Updated', type: 'date', mock: true },
]

const MEASURE_FIELDS: FilterFieldSpec[] = [
  { key: 'total_scan', label: 'Total scan', type: 'number' },
  { key: 'issue_count', label: 'Issue count', type: 'number' },
  { key: 'score', label: 'Score', type: 'number' },
]

export const FILTER_SCHEMAS: Record<string, FilterFieldSpec[]> = {
  data_checks: [
    { key: 'id', label: 'ID', type: 'text' },
    {
      key: 'name',
      label: 'Data Check Name',
      type: 'text',
      mock: true,
      options: ['Vendor tax ID present', 'Duplicate vendor names', 'Postal code format', 'Payment terms set', 'Bank account valid', 'Company code assigned'],
    },
    { key: 'rule_id', label: 'Rule No.', type: 'text', mock: true, prefix: 'R-' },
    { key: 'library_id', label: 'Library', type: 'select', mock: true, options: ['SAP Vendor Master', 'Customer Master', 'Material Master', 'Finance GL'] },
    { key: 'category', label: 'Category', type: 'select', mock: true, options: ['Address', 'Banking', 'Tax', 'Payment', 'General'] },
    { key: 'dimension', label: 'Dimension', type: 'select' },
    {
      key: 'issue_description',
      label: 'Issue Description',
      type: 'text',
      mock: true,
      options: ['Missing tax number', 'Duplicate vendor record', 'Invalid postal code', 'Blank payment terms', 'Inactive bank account'],
    },
    {
      key: 'data_check_type',
      label: 'Data Check Type',
      type: 'select',
      mock: true,
      options: ['RFC', 'ABAP program', 'Existing SAP program', 'Custom RFC', 'File upload', 'OData', 'Foundry', 'Workflow'],
    },
    { key: 'program_id', label: 'Program', type: 'text', mock: true, prefix: 'ZDQ_PROG_' },
    { key: 'priority', label: 'Priority', type: 'select' },
    { key: 'is_global', label: 'Global', type: 'boolean', mock: true },
    { key: 'status', label: 'Status', type: 'select' },
    { key: 'usages', label: 'Used In', type: 'select', mock: true, options: ['Vendor harmonization', 'SAP BP migration', 'Finance close', 'Data quality overview'] },
    ...AUDIT_FIELDS,
    ...MEASURE_FIELDS,
  ],
  work_items: [
    { key: 'id', label: 'ID', type: 'text' },
    {
      key: 'name',
      label: 'Name',
      type: 'text',
      mock: true,
      options: ['Review vendor duplicates', 'Fix BAPI call', 'Map payment terms', 'Validate tax codes', 'Remediate sales view', 'Approve KB article'],
    },
    {
      key: 'workstream',
      label: 'Workstream',
      type: 'select',
      mock: true,
      options: ['Code Remediation', 'View Remediation', 'Knowledge Base', 'Data Harmonization', 'Migration'],
    },
    { key: 'domain', label: 'Domain', type: 'select', mock: true, options: ['Code', 'View', 'Knowledge base', 'Data', 'Migration'] },
    { key: 'status', label: 'Status', type: 'select' },
    { key: 'priority', label: 'Priority', type: 'select' },
    { key: 'assignee', label: 'Assignee', type: 'user' },
    { key: 'resource_id', label: 'Resource ID', type: 'text', mock: true, prefix: 'RES-' },
    { key: 'resource_type', label: 'Resource Type', type: 'text', mock: true, options: ['Program', 'Table', 'View', 'Document'] },
    { key: 'parent_name', label: 'Parent', type: 'text', mock: true, options: ['Vendor MDM wave 1', 'SAP BP cutover', 'Finance close Q3', 'KB cleanup'] },
    ...AUDIT_FIELDS,
    ...MEASURE_FIELDS,
  ],
}

const DAY_MS = 24 * 60 * 60 * 1000
const TODAY = Date.now()

function mockCell(spec: FilterFieldSpec, index: number, random: () => number): string {
  const pick = (values: string[]) => values[Math.floor(random() * values.length)] ?? ''
  switch (spec.type) {
    case 'boolean':
      return random() < 0.5 ? 'true' : 'false'
    case 'date':
      return new Date(TODAY - Math.floor(random() * 365) * DAY_MS).toISOString().slice(0, 10)
    case 'number':
      return String(Math.floor(random() * 1000))
    case 'select':
    case 'user':
      return pick(spec.options ?? [])
    case 'text':
      return spec.options ? pick(spec.options) : `${spec.prefix ?? `${spec.label} `}${String(index + 1).padStart(4, '0')}`
    default: {
      const unhandled: never = spec.type
      return unhandled
    }
  }
}

const mockCache = new Map<string, string[]>()

function mockColumn(object: DataObject, spec: FilterFieldSpec) {
  const cacheKey = `${object.name}.${spec.key}`
  const cached = mockCache.get(cacheKey)
  if (cached) return cached
  const random = seededRandom(cacheKey)
  const values = Array.from({ length: object.total }, (_, index) => mockCell(spec, index, random))
  mockCache.set(cacheKey, values)
  return values
}

/**
 * `result` with the mock columns among `keys` appended, so preset filters on them can narrow its rows. Only a query over
 * every row of a table gets them — rows line up with the mock values by position.
 */
export function withFilterFields(result: SqlResult, sql: string, keys: string[]): SqlResult {
  if (!result.ok || result.grouped) return result
  const object = findObject(sqlTable(sql) ?? '')
  if (!object || result.rows.length !== object.total) return result
  const specs = (FILTER_SCHEMAS[object.name] ?? []).filter((spec) => spec.mock && keys.includes(spec.key) && !result.columns.includes(spec.key))
  if (specs.length === 0) return result
  const columns = specs.map((spec) => mockColumn(object, spec))
  return {
    ...result,
    columns: [...result.columns, ...specs.map((spec) => spec.key)],
    rows: result.rows.map((row, index) => [...row, ...columns.map((values) => values[index])]),
  }
}
