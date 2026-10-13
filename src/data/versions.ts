import type { Dashboard } from './dashboards'
import type { CanvasItem } from './widgets'

/** Everything a version restores. Sharing, archive state and run results are not versioned. */
export type DashboardContent = Pick<
  Dashboard,
  'name' | 'description' | 'tags' | 'appearance' | 'widgets' | 'layout' | 'sources' | 'sqlDatasets' | 'datasetTransforms' | 'filters' | 'pages' | 'groups' | 'fieldLinks'
>

export type DashboardVersion = {
  id: string
  /** The last edit merged into this version. */
  savedAt: string
  /** The first edit; the merge window counts from here. Unset means `savedAt`. */
  startedAt?: string
  author: string
  changes: string[]
  content: DashboardContent
  /** Set on the version a restore created: when the restored version was saved. */
  restoredFrom?: string
}

/** Like Figma's checkpoints: one person's edits land in one version until it is 30 minutes old, then a new one starts. */
const MERGE_MS = 30 * 60_000
const DAY_MS = 86_400_000

/** Every key is present, even when unset, so restoring clears fields the old version didn't have. */
export function contentOf(dashboard: DashboardContent): DashboardContent {
  return {
    name: dashboard.name,
    description: dashboard.description,
    tags: dashboard.tags,
    appearance: dashboard.appearance,
    widgets: dashboard.widgets,
    layout: dashboard.layout,
    sources: dashboard.sources,
    sqlDatasets: dashboard.sqlDatasets,
    datasetTransforms: dashboard.datasetTransforms,
    filters: dashboard.filters,
    pages: dashboard.pages,
    groups: dashboard.groups,
    fieldLinks: dashboard.fieldLinks,
  }
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

function itemName(item: CanvasItem) {
  if (item.title?.trim()) return item.title.trim()
  if (item.source === 'object') return `${item.objectName} by ${item.fieldKey}`
  if (item.source === 'media') return item.media?.name ?? 'media'
  if (item.source === 'text') return 'text block'
  return 'SQL graph'
}

function listChanges<T>(before: T[] = [], after: T[] = [], key: (entry: T) => string, name: (entry: T) => string, noun: string) {
  const beforeKeys = new Map(before.map((entry) => [key(entry), entry]))
  const afterKeys = new Set(after.map(key))
  const added = after.filter((entry) => !beforeKeys.has(key(entry))).map((entry) => `Added ${noun}"${name(entry)}"`)
  const removed = before.filter((entry) => !afterKeys.has(key(entry))).map((entry) => `Removed ${noun}"${name(entry)}"`)
  const edited = after
    .filter((entry) => beforeKeys.has(key(entry)) && !same(beforeKeys.get(key(entry)), entry))
    .map((entry) => `Edited ${noun}"${name(entry)}"`)
  return [...added, ...removed, ...edited]
}

export function describeChanges(before: DashboardContent, after: DashboardContent): string[] {
  const changes = [
    ...(before.name !== after.name ? [`Renamed to "${after.name}"`] : []),
    ...(before.description !== after.description || !same(before.tags, after.tags) ? ['Edited details'] : []),
    ...(before.appearance !== after.appearance ? ['Changed appearance'] : []),
    ...listChanges(before.widgets, after.widgets, (item) => item.id, itemName, ''),
    ...(!same(before.layout, after.layout) ? ['Moved graphs'] : []),
    ...listChanges(before.sources, after.sources, (source) => source.table, (source) => source.label || source.table, 'dataset '),
    ...listChanges(before.sqlDatasets, after.sqlDatasets, (dataset) => dataset.id, (dataset) => dataset.label, 'dataset '),
    ...(!same(before.datasetTransforms, after.datasetTransforms) ? ['Edited dataset transforms'] : []),
    ...listChanges(before.filters, after.filters, (filter) => filter.id, (filter) => filter.label, 'filter '),
    ...listChanges(before.pages, after.pages, (page) => page.id, (page) => page.name, 'page '),
    ...listChanges(before.groups, after.groups, (group) => group.id, (group) => group.name, 'section '),
    ...(!same(before.fieldLinks, after.fieldLinks) ? ['Edited linked fields'] : []),
  ]
  return changes.length ? changes : ['Edited dashboard']
}

/** Saves `next`'s content as a version when it differs from `prev`'s, merging into the author's version while it is under 30 minutes old. */
export function recordVersion(prev: Dashboard, next: Dashboard, author: string): Dashboard {
  const before = contentOf(prev)
  const after = contentOf(next)
  if (same(before, after)) return next
  const changes = describeChanges(before, after)
  const savedAt = new Date().toISOString()
  const [latest, ...older] = next.versions
  if (latest && !latest.restoredFrom && latest.author === author && Date.now() - Date.parse(latest.startedAt ?? latest.savedAt) < MERGE_MS) {
    return { ...next, versions: [{ ...latest, startedAt: latest.startedAt ?? latest.savedAt, savedAt, changes: [...new Set([...latest.changes, ...changes])], content: after }, ...older] }
  }
  return { ...next, versions: [{ id: crypto.randomUUID(), savedAt, author, changes, content: after }, ...next.versions] }
}

/** Puts a version's content back and records the restore as the newest version, so a restore can itself be undone. */
export function restoreVersion(dashboard: Dashboard, versionId: string, author: string): Dashboard {
  const version = dashboard.versions.find((entry) => entry.id === versionId)
  if (!version || version === dashboard.versions[0]) return dashboard
  const restored = { ...dashboard, ...version.content }
  const entry: DashboardVersion = {
    id: crypto.randomUUID(),
    savedAt: new Date().toISOString(),
    author,
    changes: describeChanges(contentOf(dashboard), version.content),
    content: version.content,
    restoredFrom: version.savedAt,
  }
  return { ...restored, versions: [entry, ...dashboard.versions] }
}

const daysBefore = (iso: string, days: number) => new Date(Date.parse(iso) - days * DAY_MS).toISOString()

/**
 * A short history for seeded dashboards. Two older versions chart tables that are now off limits — one the current user
 * lost access to, one that was dropped — so restoring them shows the unavailable-data errors.
 */
export function seedVersions(dashboard: DashboardContent & Pick<Dashboard, 'id' | 'updatedAt' | 'updatedBy'>, collaborator: string): DashboardVersion[] {
  const { id, updatedAt, updatedBy } = dashboard
  const content = contentOf(dashboard)
  const widgets = content.widgets ?? []
  const workItems: CanvasItem = { id: `${id}-work-items`, source: 'object', objectName: 'work_items', fieldKey: 'status', chart: 'bar', title: 'Work items by Status' }
  const payroll: CanvasItem = { id: `${id}-payroll`, source: 'object', objectName: 'payroll_costs', fieldKey: 'cost_center', chart: 'bar', title: 'Payroll costs by Cost center' }
  const legacy: CanvasItem = { id: `${id}-legacy`, source: 'object', objectName: 'legacy_vendor_extract', fieldKey: 'country', chart: 'pie', title: 'Vendor extract by Country' }
  const withExtras = { ...content, widgets: [...widgets, payroll, legacy] }
  return [
    { id: `${id}-v5`, savedAt: updatedAt, author: updatedBy, changes: ['Removed "Work items by Status"'], content },
    { id: `${id}-v4`, savedAt: daysBefore(updatedAt, 2), author: collaborator, changes: ['Added "Work items by Status"'], content: { ...content, widgets: [...widgets, workItems] } },
    {
      id: `${id}-v3`,
      savedAt: daysBefore(updatedAt, 6),
      author: updatedBy,
      changes: ['Removed "Payroll costs by Cost center"', 'Removed "Vendor extract by Country"'],
      content,
    },
    {
      id: `${id}-v2`,
      savedAt: daysBefore(updatedAt, 9),
      author: collaborator,
      changes: ['Added "Payroll costs by Cost center"', 'Added "Vendor extract by Country"'],
      content: withExtras,
    },
    { id: `${id}-v1`, savedAt: daysBefore(updatedAt, 14), author: updatedBy, changes: ['Created dashboard'], content: { ...content, widgets: [] } },
  ]
}
