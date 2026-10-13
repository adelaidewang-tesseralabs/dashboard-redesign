import type { Dashboard } from '../../../../data/dashboards'
import type { DashboardContent } from '../../../../data/versions'
import { formatDateTime } from '../../../../lib/format'
import { nameOf } from '../../../../lib/people'
import type { Dataset } from '../v2/datasets'

type Change = { at: string; by: string }
export type ChangeHistory = { created?: Change; edited?: Change }

/**
 * When something on the dashboard was added and last edited, and by whom, read from version history. Oldest first:
 * `pick` returns undefined while it's absent, so removing and re-adding it starts its history over.
 */
function historyOf(dashboard: Dashboard, pick: (content: DashboardContent) => unknown): ChangeHistory {
  let history: ChangeHistory = {}
  let previous: string | undefined
  for (const version of [...dashboard.versions].reverse()) {
    const value = pick(version.content)
    const snapshot = value === undefined ? undefined : JSON.stringify(value)
    const change = { at: version.savedAt, by: version.author }
    if (snapshot === undefined) history = {}
    else if (previous === undefined) history = { created: change }
    else if (snapshot !== previous) history = { ...history, edited: change }
    previous = snapshot
  }
  return history
}

export const graphHistory = (dashboard: Dashboard, itemId: string) => historyOf(dashboard, (content) => content.widgets?.find((widget) => widget.id === itemId))

/** A table dataset exists while it's attached or any graph charts it; edits are to its source entry or its transforms. */
export function datasetHistory(dashboard: Dashboard, dataset: Dataset) {
  return historyOf(dashboard, (content) => {
    const transforms = content.datasetTransforms?.[dataset.key]
    if (dataset.kind === 'sql') {
      const saved = content.sqlDatasets?.find((entry) => entry.id === dataset.dataset.id)
      return saved && { saved, transforms }
    }
    const table = dataset.object.name
    const source = content.sources?.find((entry) => entry.table === table)
    const charted = content.widgets?.some((widget) => widget.source === 'object' && widget.objectName === table)
    return source || charted ? { source, transforms } : undefined
  })
}

const describe = ({ at, by }: Change) => `${formatDateTime(at)} · ${nameOf(by)}`

export function historyDetails({ created, edited }: ChangeHistory) {
  return [
    ...(created ? [{ label: 'Added', value: describe(created) }] : []),
    ...(created ? [{ label: 'Last edited', value: edited ? describe(edited) : 'Not since added' }] : []),
  ]
}
