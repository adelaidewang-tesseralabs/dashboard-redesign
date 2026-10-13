import type { DatasetTransforms } from './transforms'
import { seedVersions, type DashboardVersion } from './versions'
import { DATA_CHECKS_TABLE, type CanvasItem, type ChartStyle, type WidgetRect } from './widgets'

const SEEDED_GRAPHS: { fieldKey: string; chart: ChartStyle }[] = [
  { fieldKey: 'priority', chart: 'bar' },
  { fieldKey: 'dimension', chart: 'bar' },
  { fieldKey: 'status', chart: 'pie' },
]

/** One canvas graph of the Data Checks dataset so existing dashboards open in the same builder as a newly created one. */
function seedGraph(id: string): CanvasItem {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  const { fieldKey, chart } = SEEDED_GRAPHS[hash % SEEDED_GRAPHS.length]
  return { id: `${id}-checks`, source: 'object', objectName: DATA_CHECKS_TABLE, fieldKey, chart }
}

const checksGraph = (id: string, fieldKey: string, chart: ChartStyle): CanvasItem => ({ id, source: 'object', objectName: DATA_CHECKS_TABLE, fieldKey, chart })

/** Dashboards seeded with several graphs instead of one: linked Data Checks graphs, plus Work Items, which relates to none of them. */
const SEED_WIDGETS: Record<string, CanvasItem[]> = {
  'data-quality-overview': [
    checksGraph('dqo-total', 'status', 'metric'),
    checksGraph('dqo-status', 'status', 'pie'),
    checksGraph('dqo-priority', 'priority', 'bar'),
    checksGraph('dqo-dimension', 'dimension', 'bar'),
    { id: 'dqo-work-items', source: 'object', objectName: 'work_items', fieldKey: 'status', chart: 'bar' },
  ],
}

/** `table` is the lake table name; `label` is the user's data source name, defaulting to the table's. */
export type DashboardSource = { table: string; label: string }

/** A named, reusable query that any number of graphs can chart (builder V2's Data tab). */
export type SqlDataset = { id: string; label: string; sql: string }

/** Identifies a dataset for removal: an attached table, or a saved SQL query. */
export type DatasetRef = { kind: 'table'; table: string } | { kind: 'sql'; id: string }

export type FavoriteVignette = 'last-execution' | 'quality-score' | 'data-checks'

/** Canvas theme. `system` follows the viewer's color scheme. */
export type DashboardAppearance = 'light' | 'dark' | 'system'

export const DASHBOARD_APPEARANCES = ['light', 'dark', 'system'] as const

/**
 * A page filter on one dataset column; every graph on the page whose dataset has that column, directly or through a
 * linked field, keeps only rows in `values`. Empty `values` means all.
 */
export type DashboardFilter = {
  id: string
  datasetKey: string
  column: string
  label: string
  values: string[]
  /** `single` keeps at most one value picked. Unset means multiple. */
  selection?: 'multiple' | 'single'
  /** Unset or unknown means the first page. */
  pageId?: string
  /** Viewers see the filter but can't change its values. */
  locked?: boolean
  /** Set by editors to shape the graphs; viewers never see or change it. */
  fixed?: boolean
  /** Shown on every page instead of only `pageId`'s. */
  allPages?: boolean
}

/** A tab of the dashboard; each has its own graphs, layout and filters. */
export type DashboardPage = { id: string; name: string; hidden?: boolean }

export type FieldRef = { datasetKey: string; column: string }

/** Two columns that mean the same thing in different datasets, so one filter narrows both. Values match by exact text. */
export type FieldLink = { id: string; fields: [FieldRef, FieldRef] }

/** A titled section row on a page; it holds the graphs below it, down to the next section. */
export type GraphGroup = { id: string; name: string; pageId?: string; hidden?: boolean }

export type MemberRole = 'editor' | 'viewer'
export type DashboardMember = { user: string; role: MemberRole }
export type GeneralAccess = 'restricted' | 'company'

export type Dashboard = {
  id: string
  name: string
  description?: string
  tags?: string[]
  updatedAt: string
  updatedBy: string
  /** Exactly one per dashboard; transferable to a member. Not repeated in `members`. */
  owner: string
  members: DashboardMember[]
  /** `company`: everyone at the tenant can view, on top of `members`. */
  generalAccess: GeneralAccess
  archived: boolean
  /** Teaching dashboards listed only while the user has none of their own. */
  sample: boolean
  /** Canvas graphs. Seeded dashboards get one so they open in the same builder as a new dashboard. */
  widgets?: CanvasItem[]
  /** Attached Foundry tables, workflow outputs and uploads, offered in the Add graph menu. */
  sources?: DashboardSource[]
  sqlDatasets?: SqlDataset[]
  /** Calculations, filters and result shape per dataset, keyed by dataset key (`table:<name>` / `sql:<id>`). */
  datasetTransforms?: Record<string, DatasetTransforms>
  /** Canvas grid placement per widget; widgets missing here are packed into the first free spot. */
  layout?: WidgetRect[]
  filters?: DashboardFilter[]
  /** Unset means one page holding everything. */
  pages?: DashboardPage[]
  /** Section rows; their grid rows live in `layout` under the group id. */
  groups?: GraphGroup[]
  fieldLinks?: FieldLink[]
  /** Newest first; `versions[0]` always matches the live content. Every entry can be restored. */
  versions: DashboardVersion[]
  refreshedAt?: string
  lastExecution?: string
  qualityScore: number | null
  targetScore: number
  baselineScore: number
  vignette: FavoriteVignette
  /** Light / dark / system for the canvas. Defaults to dark. */
  appearance?: DashboardAppearance
  /** Prefix for generated rule numbers, e.g. `VM` → `VM-001`. */
  rulePrefix: string
  table: string
}

export const TAGS = ['Vendor MDM', 'Olivier', 'SAP BP Migration', 'Finance Close']

/**
 * The built-in tags plus any a dashboard carries. A tag someone adds lives only on the dashboards using it,
 * so it drops off the list once none does. Case-insensitive: the first spelling wins.
 */
export function tagNames(dashboards: { tags?: string[] }[], extra: string[] = []): string[] {
  const names = new Map<string, string>()
  for (const name of [...TAGS, ...dashboards.flatMap((dashboard) => dashboard.tags ?? []), ...extra]) {
    const key = name.trim().toLowerCase()
    if (key && !names.has(key)) names.set(key, name.trim())
  }
  return [...names.values()]
}

export const CURRENT_USER = 'adelaide@tesseralabs.ai'

/** Teammates to share with; the owner of each seeded dashboard is whoever last updated it. */
export const TEAMMATES = [
  'adelaide@tesseralabs.ai',
  'arihant@tesseralabs.ai',
  'neeraj@tesseralabs.ai',
  'olivier@tesseralabs.ai',
  'sophia@tesseralabs.ai',
  'priya@tesseralabs.ai',
]

/** Everyone at the company, for people search; most have no dashboards shared with them. */
export const ORG_PEOPLE = [
  ...TEAMMATES,
  'david@tesseralabs.ai',
  'carmen@tesseralabs.ai',
  'harry@tesseralabs.ai',
  'tracy@tesseralabs.ai',
  'michael@tesseralabs.ai',
  'jane@tesseralabs.ai',
]

/** The current user's role on dashboards owned by someone else. */
const CURRENT_USER_ROLES: Record<string, MemberRole> = {
  'vendor-master-data': 'editor',
  'dh-mcp-tool-test': 'editor',
  'customer-bp-quality': 'viewer',
  'gl-account-harmonization': 'viewer',
}

/** Seeded dashboards everyone at the company can view. */
const COMPANY_WIDE = new Set(['material-master-sync', 'bank-master-validation', 'ap-open-items'])

/** A couple of other teammates per dashboard so the share list isn't empty. */
function seedMembers(id: string, owner: string): DashboardMember[] {
  const others = TEAMMATES.filter((user) => user !== owner && user !== CURRENT_USER)
  const start = id.length % others.length
  const members: DashboardMember[] = [
    { user: others[start], role: 'editor' },
    { user: others[(start + 1) % others.length], role: 'viewer' },
  ]
  const mine = CURRENT_USER_ROLES[id]
  return owner !== CURRENT_USER && mine ? [{ user: CURRENT_USER, role: mine }, ...members] : members
}

const ARCHIVED = new Set(['dh-mcp-tool-test', 'employee-org-integrity'])

const SEED: Omit<Dashboard, 'owner' | 'members' | 'generalAccess' | 'archived' | 'sample' | 'versions'>[] = [
  {
    id: 'data-quality-overview',
    name: 'Data Quality Overview',
    description: 'Data checks by status, priority and dimension, next to open work items',
    tags: ['Vendor MDM', 'SAP BP Migration'],
    updatedAt: '2026-10-08T09:00:00-07:00',
    updatedBy: 'adelaide@tesseralabs.ai',
    lastExecution: '2026-10-08T06:00:00-07:00',
    qualityScore: 90.8,
    targetScore: 97,
    baselineScore: 78,
    vignette: 'data-checks',
    rulePrefix: 'DQ',
    table: 'LFA1',
  },
  {
    id: 'vendor-master-data',
    name: 'Vendor Master Data',
    description: 'Core vendor master quality across ECC and S/4',
    tags: ['Vendor MDM'],
    updatedAt: '2026-10-06T21:00:00-07:00',
    updatedBy: 'arihant@tesseralabs.ai',
    lastExecution: '2026-10-06T23:39:39-07:00',
    qualityScore: 92.4,
    targetScore: 98,
    baselineScore: 81,
    vignette: 'last-execution',
    rulePrefix: 'VM',
    table: 'LFA1',
  },
  {
    id: 'testing-adelaide',
    name: 'Testing- Adelaide',
    description: 'Sandbox dashboard for vignette experiments',
    tags: ['Olivier'],
    updatedAt: '2026-10-07T03:00:00-07:00',
    updatedBy: 'adelaide@tesseralabs.ai',
    qualityScore: null,
    targetScore: 95,
    baselineScore: 70,
    vignette: 'quality-score',
    rulePrefix: 'TA',
    table: 'KNA1',
  },
  {
    id: 'dh-mcp-tool-test',
    name: 'DH MCP Tool Test - Harmonization Throwaway',
    updatedAt: '2026-10-06T23:00:00-07:00',
    updatedBy: 'arihant@tesseralabs.ai',
    lastExecution: '2026-10-06T20:12:00-07:00',
    qualityScore: 74.8,
    targetScore: 90,
    baselineScore: 60,
    vignette: 'data-checks',
    rulePrefix: 'MCP',
    table: 'MARA',
  },
  {
    id: 'customer-bp-quality',
    name: 'Customer BP Quality',
    description: 'Business partner readiness for the S/4 cutover',
    tags: ['SAP BP Migration'],
    updatedAt: '2026-10-01T10:00:00-07:00',
    updatedBy: 'neeraj@tesseralabs.ai',
    lastExecution: '2026-10-05T06:00:00-07:00',
    qualityScore: 88.1,
    targetScore: 97,
    baselineScore: 72,
    vignette: 'quality-score',
    rulePrefix: 'BP',
    table: 'BUT000',
  },
  {
    id: 'material-master-sync',
    name: 'Material Master Sync',
    description: 'Automated data quality dashboard',
    tags: ['SAP BP Migration'],
    updatedAt: '2026-09-30T12:00:00-07:00',
    updatedBy: 'neeraj@tesseralabs.ai',
    lastExecution: '2026-10-04T02:00:00-07:00',
    qualityScore: 95.6,
    targetScore: 98,
    baselineScore: 86,
    vignette: 'quality-score',
    rulePrefix: 'MM',
    table: 'MARC',
  },
  {
    id: 'ap-open-items',
    name: 'AP Open Items Check',
    description: 'Open payables reconciliation before period close',
    tags: ['Finance Close'],
    updatedAt: '2026-09-29T09:00:00-07:00',
    updatedBy: 'adelaide@tesseralabs.ai',
    lastExecution: '2026-10-03T22:00:00-07:00',
    qualityScore: 97.2,
    targetScore: 99,
    baselineScore: 90,
    vignette: 'last-execution',
    rulePrefix: 'AP',
    table: 'BSIK',
  },
  {
    id: 'gl-account-harmonization',
    name: 'GL Account Harmonization',
    tags: ['Finance Close'],
    updatedAt: '2026-09-28T15:00:00-07:00',
    updatedBy: 'olivier@tesseralabs.ai',
    lastExecution: '2026-10-02T04:00:00-07:00',
    qualityScore: 83.9,
    targetScore: 95,
    baselineScore: 70,
    vignette: 'quality-score',
    rulePrefix: 'GL',
    table: 'SKA1',
  },
  {
    id: 'plant-data-completeness',
    name: 'Plant Data Completeness',
    tags: ['Vendor MDM'],
    updatedAt: '2026-09-26T11:00:00-07:00',
    updatedBy: 'sophia@tesseralabs.ai',
    lastExecution: '2026-09-30T04:00:00-07:00',
    qualityScore: 90.3,
    targetScore: 96,
    baselineScore: 78,
    vignette: 'quality-score',
    rulePrefix: 'PL',
    table: 'T001W',
  },
  {
    id: 'bank-master-validation',
    name: 'Bank Master Validation',
    tags: ['Finance Close', 'Vendor MDM'],
    updatedAt: '2026-09-24T11:00:00-07:00',
    updatedBy: 'arihant@tesseralabs.ai',
    lastExecution: '2026-09-28T04:00:00-07:00',
    qualityScore: 99.1,
    targetScore: 99,
    baselineScore: 94,
    vignette: 'quality-score',
    rulePrefix: 'BK',
    table: 'BNKA',
  },
  {
    id: 'cost-center-mapping',
    name: 'Cost Center Mapping QA',
    updatedAt: '2026-09-22T11:00:00-07:00',
    updatedBy: 'olivier@tesseralabs.ai',
    qualityScore: null,
    targetScore: 95,
    baselineScore: 75,
    vignette: 'quality-score',
    rulePrefix: 'CC',
    table: 'CSKS',
  },
  {
    id: 'employee-org-integrity',
    name: 'Employee Org Integrity',
    tags: ['Olivier'],
    updatedAt: '2026-09-20T11:00:00-07:00',
    updatedBy: 'sophia@tesseralabs.ai',
    lastExecution: '2026-09-25T04:00:00-07:00',
    qualityScore: 86.7,
    targetScore: 95,
    baselineScore: 74,
    vignette: 'quality-score',
    rulePrefix: 'HR',
    table: 'PA0001',
  },
  {
    id: 'sales-order-completeness',
    name: 'Sales Order Completeness',
    description: 'Automated data quality dashboard',
    tags: ['SAP BP Migration'],
    updatedAt: '2026-09-18T11:00:00-07:00',
    updatedBy: 'neeraj@tesseralabs.ai',
    lastExecution: '2026-09-24T04:00:00-07:00',
    qualityScore: 93.8,
    targetScore: 98,
    baselineScore: 84,
    vignette: 'quality-score',
    rulePrefix: 'SO',
    table: 'VBAK',
  },
  {
    id: 'purchase-org-checks',
    name: 'Purchase Org Checks',
    tags: ['Vendor MDM'],
    updatedAt: '2026-09-15T11:00:00-07:00',
    updatedBy: 'adelaide@tesseralabs.ai',
    lastExecution: '2026-09-20T04:00:00-07:00',
    qualityScore: 91.2,
    targetScore: 97,
    baselineScore: 80,
    vignette: 'quality-score',
    rulePrefix: 'PO',
    table: 'LFM1',
  },
]

export const DASHBOARDS: Dashboard[] = SEED.map((seed) => {
  const members = seedMembers(seed.id, seed.updatedBy)
  const dashboard = { ...seed, widgets: SEED_WIDGETS[seed.id] ?? [seedGraph(seed.id)] }
  return {
    ...dashboard,
    owner: seed.updatedBy,
    members,
    generalAccess: COMPANY_WIDE.has(seed.id) ? 'company' : 'restricted',
    archived: ARCHIVED.has(seed.id),
    sample: false,
    versions: seedVersions(dashboard, members.find((member) => member.role === 'editor')?.user ?? seed.updatedBy),
  }
})

const SAMPLE_OWNER = 'samples@tesseralabs.ai'

function withSeedVersions(dashboards: Dashboard[]) {
  return dashboards.map((dashboard) => ({ ...dashboard, versions: seedVersions(dashboard, dashboard.owner) }))
}

export const SAMPLE_DASHBOARDS: Dashboard[] = withSeedVersions([
  {
    id: 'sample-vendor-readiness',
    name: 'Vendor Master Readiness',
    description: 'Tracks vendor data quality toward an S/4 cutover target',
    tags: ['Vendor MDM'],
    updatedAt: '2026-10-07T08:00:00-07:00',
    updatedBy: SAMPLE_OWNER,
    owner: SAMPLE_OWNER,
    members: [{ user: CURRENT_USER, role: 'editor' }],
    generalAccess: 'restricted',
    archived: false,
    sample: true,
    lastExecution: '2026-10-07T06:00:00-07:00',
    qualityScore: 89.6,
    targetScore: 97,
    baselineScore: 72,
    vignette: 'quality-score',
    rulePrefix: 'SV',
    table: 'LFA1',
    widgets: [seedGraph('sample-vendor-readiness')],
    versions: [],
  },
  {
    id: 'sample-customer-cleanup',
    name: 'Customer Data Cleanup',
    description: 'Finds duplicate and incomplete customer records to fix',
    tags: ['SAP BP Migration'],
    updatedAt: '2026-10-07T08:00:00-07:00',
    updatedBy: SAMPLE_OWNER,
    owner: SAMPLE_OWNER,
    members: [{ user: CURRENT_USER, role: 'editor' }],
    generalAccess: 'restricted',
    archived: false,
    sample: true,
    lastExecution: '2026-10-06T22:00:00-07:00',
    qualityScore: 81.3,
    targetScore: 95,
    baselineScore: 64,
    vignette: 'data-checks',
    rulePrefix: 'SC',
    table: 'KNA1',
    widgets: [seedGraph('sample-customer-cleanup')],
    versions: [],
  },
])

export const DEFAULT_FAVORITES = ['vendor-master-data', 'testing-adelaide']

export function findDashboard(id: string | undefined) {
  return DASHBOARDS.find((dashboard) => dashboard.id === id)
}
