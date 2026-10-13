import type { Dashboard } from './dashboards'

export const DIMENSIONS = ['Accuracy', 'Completeness', 'Consistency', 'Uniqueness', 'Validity'] as const
export type Dimension = (typeof DIMENSIONS)[number]

export const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'] as const
export type Priority = (typeof PRIORITIES)[number]

export type ExecutionStatus = 'COMPLETED' | 'FAILED' | 'NOT_EXECUTED'

export type DataCheck = {
  id: string
  ruleId: string
  description: string
  dimension: Dimension
  priority: Priority
  type: 'SQL' | 'Python' | 'Rule'
  totalScanned: number
  issueCount: number
  qualityScore: number | null
  lastExecuted?: string
  status: ExecutionStatus
}

export type ExecutionPoint = { date: string; score: number; issues: number }

export type DashboardDetail = {
  checks: DataCheck[]
  trend: ExecutionPoint[]
}

const RULE_TEMPLATES: { text: string; dimension: Dimension; field: string }[] = [
  { text: 'Tax number must be populated for domestic records', dimension: 'Completeness', field: 'STCD1' },
  { text: 'Postal code matches country format', dimension: 'Validity', field: 'PSTLZ' },
  { text: 'No duplicate records on name + address', dimension: 'Uniqueness', field: 'NAME1' },
  { text: 'Payment terms exist in configuration table', dimension: 'Consistency', field: 'ZTERM' },
  { text: 'Bank account IBAN passes checksum', dimension: 'Accuracy', field: 'IBAN' },
  { text: 'Reconciliation account is set', dimension: 'Completeness', field: 'AKONT' },
  { text: 'Email address is well-formed', dimension: 'Validity', field: 'SMTP_ADDR' },
  { text: 'Company code assignment matches source', dimension: 'Consistency', field: 'BUKRS' },
  { text: 'Search term is not blank', dimension: 'Completeness', field: 'SORTL' },
  { text: 'Region code valid for country', dimension: 'Accuracy', field: 'REGIO' },
  { text: 'Blocked records have a block reason', dimension: 'Consistency', field: 'SPERR' },
  { text: 'Phone number in E.164 format', dimension: 'Validity', field: 'TELF1' },
  { text: 'Single active record per legacy ID', dimension: 'Uniqueness', field: 'ALTKN' },
  { text: 'Currency matches company code currency', dimension: 'Accuracy', field: 'WAERS' },
]

function seededRandom(seed: string) {
  let state = 0
  for (let i = 0; i < seed.length; i++) state = (state * 31 + seed.charCodeAt(i)) >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function daysBefore(iso: string, days: number) {
  return new Date(new Date(iso).getTime() - days * 864e5).toISOString()
}

function buildChecks(dashboard: Dashboard, rand: () => number): DataCheck[] {
  const count = 8 + Math.floor(rand() * 6)
  const executed = dashboard.lastExecution
  const offset = Math.floor(rand() * RULE_TEMPLATES.length)
  return Array.from({ length: count }, (_, index) => {
    const template = RULE_TEMPLATES[(index + offset) % RULE_TEMPLATES.length]
    const totalScanned = 2000 + Math.floor(rand() * 48000)
    const failRate = dashboard.qualityScore == null ? 0 : ((100 - dashboard.qualityScore) / 100) * rand() * 2.2
    const issueCount = Math.round(totalScanned * failRate)
    const notExecuted = !executed || rand() < 0.08
    const failed = !notExecuted && rand() < 0.07
    return {
      id: `${dashboard.id}-check-${index}`,
      ruleId: `${dashboard.rulePrefix}-${String(index + 1).padStart(3, '0')}`,
      description: template.text,
      dimension: template.dimension,
      priority: PRIORITIES[Math.floor(rand() * PRIORITIES.length)],
      type: (['SQL', 'Python', 'Rule'] as const)[Math.floor(rand() * 3)],
      totalScanned: notExecuted || failed ? 0 : totalScanned,
      issueCount: notExecuted || failed ? 0 : issueCount,
      qualityScore: notExecuted || failed ? null : ((totalScanned - issueCount) / totalScanned) * 100,
      lastExecuted: notExecuted ? undefined : executed,
      status: notExecuted ? 'NOT_EXECUTED' : failed ? 'FAILED' : 'COMPLETED',
    }
  })
}

function buildTrend(dashboard: Dashboard, rand: () => number): ExecutionPoint[] {
  if (!dashboard.lastExecution || dashboard.qualityScore == null) return []
  const end = dashboard.qualityScore
  const start = dashboard.baselineScore
  return Array.from({ length: 12 }, (_, index) => {
    const progress = index / 11
    const jitter = index === 11 ? 0 : (rand() - 0.5) * 3
    const score = Math.min(100, start + (end - start) * progress + jitter)
    return {
      date: daysBefore(dashboard.lastExecution!, (11 - index) * 3),
      score: Number(score.toFixed(1)),
      issues: Math.round((100 - score) * 42),
    }
  })
}

const cache = new Map<string, DashboardDetail>()

export function getDashboardDetail(dashboard: Dashboard): DashboardDetail {
  const cacheKey = `${dashboard.id}:${dashboard.lastExecution ?? ''}`
  const cached = cache.get(cacheKey)
  if (cached) return cached
  const rand = seededRandom(dashboard.id)
  const detail = { checks: buildChecks(dashboard, rand), trend: buildTrend(dashboard, rand) }
  cache.set(cacheKey, detail)
  return detail
}

export type DimensionScore = { dimension: Dimension; score: number; scanned: number; issues: number }

export function scoreByDimension(checks: DataCheck[]): DimensionScore[] {
  return DIMENSIONS.flatMap((dimension) => {
    const rows = checks.filter((check) => check.dimension === dimension && check.totalScanned > 0)
    if (!rows.length) return []
    const scanned = rows.reduce((sum, row) => sum + row.totalScanned, 0)
    const issues = rows.reduce((sum, row) => sum + row.issueCount, 0)
    return [{ dimension, scanned, issues, score: ((scanned - issues) / scanned) * 100 }]
  })
}

export function summarize(checks: DataCheck[]) {
  const executed = checks.filter((check) => check.totalScanned > 0)
  const scanned = executed.reduce((sum, row) => sum + row.totalScanned, 0)
  const issues = executed.reduce((sum, row) => sum + row.issueCount, 0)
  return {
    scanned,
    issues,
    score: scanned ? ((scanned - issues) / scanned) * 100 : null,
    executedCount: executed.length,
    failedCount: checks.filter((check) => check.status === 'FAILED').length,
  }
}
