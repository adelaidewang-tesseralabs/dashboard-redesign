import type { Dashboard } from './dashboards'
import { sqlTable, tableAccess } from './dataSources'
import type { CanvasItem } from './widgets'

export type DataProblem = { reason: 'denied' | 'missing'; label: string }
/** One unreachable dataset and the graphs that read it. */
export type DataIssue = DataProblem & { widgetIds: string[] }

type IssueSource = Pick<Dashboard, 'widgets' | 'sources' | 'sqlDatasets'>

function tableProblem(table: string | undefined): DataProblem | null {
  if (!table) return null
  const access = tableAccess(table)
  return access.ok ? null : { reason: access.reason, label: access.label }
}

/** Why a graph can't load its data, or null when it can. SQL syntax errors are left to the graph itself. */
export function widgetProblem(item: CanvasItem, dashboard: Pick<Dashboard, 'sqlDatasets'>): DataProblem | null {
  switch (item.source) {
    case 'media':
    case 'text':
      return null
    case 'object':
      return tableProblem(item.objectName)
    case 'sql': {
      const dataset = item.datasetId ? dashboard.sqlDatasets?.find((entry) => entry.id === item.datasetId) : undefined
      if (item.datasetId && !dataset) return { reason: 'missing', label: item.title }
      return tableProblem(sqlTable(dataset?.sql ?? item.sql))
    }
    default: {
      const unhandled: never = item
      return unhandled
    }
  }
}

/** Unreachable datasets across graphs, attached sources and saved queries, one entry per dataset. */
export function dataIssues(dashboard: IssueSource): DataIssue[] {
  const issues = new Map<string, DataIssue>()
  const note = (problem: DataProblem | null, widgetId?: string) => {
    if (!problem) return
    const key = `${problem.reason}:${problem.label}`
    const issue = issues.get(key) ?? { ...problem, widgetIds: [] }
    if (widgetId) issue.widgetIds.push(widgetId)
    issues.set(key, issue)
  }
  for (const item of dashboard.widgets ?? []) note(widgetProblem(item, dashboard), item.id)
  for (const source of dashboard.sources ?? []) note(tableProblem(source.table))
  for (const dataset of dashboard.sqlDatasets ?? []) note(tableProblem(sqlTable(dataset.sql)))
  return [...issues.values()]
}

export function problemMessage({ reason, label }: DataProblem) {
  return reason === 'denied' ? `You don't have access to ${label}. Ask its owner for access.` : `${label} is no longer available.`
}
