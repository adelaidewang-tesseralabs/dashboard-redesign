import type { Dashboard } from './dashboards'
import { sqlTable, tableAccess } from './dataSources'
import type { CanvasItem } from './widgets'
import { nameOf } from '../lib/people'

export type DataProblem = { reason: 'denied' | 'missing'; label: string }
/** One unreachable dataset and the graphs that read it. */
export type DataIssue = DataProblem & { widgetIds: string[] }

type IssueSource = Pick<Dashboard, 'widgets' | 'sources' | 'sqlDatasets'>

function tableProblem(table: string | undefined, user?: string): DataProblem | null {
  if (!table) return null
  const access = tableAccess(table, user)
  return access.ok ? null : { reason: access.reason, label: access.label }
}

/**
 * Why a graph can't load its data, or null when it can. SQL syntax errors are left to the graph itself.
 * `user` checks someone else's permissions, for previewing the dashboard as them.
 */
export function widgetProblem(item: CanvasItem, dashboard: Pick<Dashboard, 'sqlDatasets'>, user?: string): DataProblem | null {
  switch (item.source) {
    case 'media':
    case 'text':
      return null
    case 'object':
      return tableProblem(item.objectName, user)
    case 'sql': {
      const dataset = item.datasetId ? dashboard.sqlDatasets?.find((entry) => entry.id === item.datasetId) : undefined
      if (item.datasetId && !dataset) return { reason: 'missing', label: item.title }
      return tableProblem(sqlTable(dataset?.sql ?? item.sql), user)
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

/** `user`: the person the dashboard is being previewed as. */
export function problemMessage({ reason, label }: DataProblem, user?: string) {
  if (reason === 'missing') return `${label} is no longer available.`
  return user ? `${nameOf(user)} doesn't have access to ${label}, so this graph won't load for them.` : `You don't have access to ${label}. Ask its owner for access.`
}
