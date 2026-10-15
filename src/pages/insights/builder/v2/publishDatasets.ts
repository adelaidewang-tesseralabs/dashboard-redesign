import { CURRENT_USER, type Dashboard } from '../../../../data/dashboards'
import { sqlTable, type DataField } from '../../../../data/dataSources'
import { PUBLISHED_CATALOG, publishedPath, type PublishedDataset, type PublishedView } from '../../../../data/externalSources'
import { PROTOTYPE_NOW } from '../../../../lib/format'
import { datasetResult, datasetSql, graphColumns, listDatasets, type Dataset } from './datasets'

/** A dataset's published copy, and whether the dashboard's copy has changed since. */
export type PublishState = { entry: PublishedDataset; changed: boolean }

function datasetView(dataset: Dataset, dashboard: Dashboard): PublishedView {
  return { sql: datasetSql(dataset), transforms: dashboard.datasetTransforms?.[dataset.key] }
}

const sameView = (a: PublishedView, b: PublishedView) => JSON.stringify(a) === JSON.stringify(b)

/** The published dashboard table the dataset reads, if any. */
function builtOn(dataset: Dataset) {
  const table = sqlTable(datasetSql(dataset))
  return table?.startsWith(`${PUBLISHED_CATALOG}.`) ? table : undefined
}

/** "Dashboard › Dataset" for a published table, under the dashboard's current name when it still exists. */
export function publishedLabel(entry: PublishedDataset, dashboards: Dashboard[]) {
  const dashboardName = dashboards.find((dashboard) => dashboard.id === entry.dashboardId)?.name ?? entry.dashboardName
  return `${dashboardName} › ${entry.table.label}`
}

/** What the dataset's published copy will read from, e.g. "Linked copy of Vendor Master Data › Vendors". */
export function linkedCopyNote(dataset: Dataset, published: PublishedDataset[], dashboards: Dashboard[]) {
  const source = builtOn(dataset)
  const entry = source && published.find((candidate) => candidate.table.name === source)
  return entry ? `Linked copy of ${publishedLabel(entry, dashboards)}` : undefined
}

/** False once the dataset is removed from its dashboard; its Foundry copy stays for whoever uses it. */
export function onItsDashboard(entry: PublishedDataset, dashboards: Dashboard[]) {
  const dashboard = dashboards.find((candidate) => candidate.id === entry.dashboardId)
  return !dashboard || listDatasets(dashboard).some((dataset) => dataset.key === entry.datasetKey)
}

/** Each of the dashboard's published datasets by dataset key. */
export function publishStates(datasets: Dataset[], dashboard: Dashboard, published: PublishedDataset[]) {
  const states = new Map<string, PublishState>()
  for (const entry of published) {
    if (entry.dashboardId !== dashboard.id) continue
    const dataset = datasets.find((candidate) => candidate.key === entry.datasetKey)
    if (dataset) states.set(dataset.key, { entry, changed: !sameView(datasetView(dataset, dashboard), entry.view) })
  }
  return states
}

/** The paths already taken in the dashboard's Foundry folder, including datasets since removed from the dashboard. */
export function takenPaths(dashboard: Dashboard, published: PublishedDataset[]) {
  return new Set(published.filter((entry) => entry.dashboardId === dashboard.id).map((entry) => entry.table.name))
}

/**
 * The dataset's current result as a Foundry table named `name`, or null when its query fails. Updating keeps the
 * `previous` path, name and first publish.
 */
export function toPublished(dataset: Dataset, dashboard: Dashboard, name: string, previous?: PublishedDataset): PublishedDataset | null {
  const result = datasetResult(dataset, dashboard)
  if (!result.ok) return null
  const fields: DataField[] = graphColumns(dataset, result).map(({ key, label }) => {
    const index = result.columns.indexOf(key)
    return { key, label, values: [...new Set(result.rows.map((row) => row[index]).filter((cell) => cell !== null).map(String))] }
  })
  const now = new Date(PROTOTYPE_NOW).toISOString()
  return {
    table: {
      name: previous?.table.name ?? publishedPath(dashboard.id, name),
      label: previous?.table.label ?? name,
      origin: 'foundry',
      total: dataset.kind === 'table' ? dataset.object.total : Math.max(result.rows.length, 1),
      fields,
    },
    view: datasetView(dataset, dashboard),
    dashboardId: dashboard.id,
    dashboardName: previous?.dashboardName ?? dashboard.name,
    datasetKey: dataset.key,
    builtOn: builtOn(dataset),
    publishedAt: previous?.publishedAt ?? now,
    publishedBy: previous?.publishedBy ?? CURRENT_USER,
    updatedAt: previous ? now : undefined,
  }
}
