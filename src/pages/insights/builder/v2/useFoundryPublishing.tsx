import { useState } from 'react'
import type { Dashboard } from '../../../../data/dashboards'
import { useDashboards } from '../../../../data/DashboardsStore'
import { useToast } from '../../../../ui/Toast'
import type { FoundrySummary } from './DatasetList'
import type { Dataset } from './datasets'
import { PublishDatasetsDialog } from './PublishDatasetsDialog'
import { publishableDatasets, publishStates, takenPaths, toPublished } from './publishDatasets'

const count = (n: number) => (n === 1 ? '1 dataset' : `${n} datasets`)

/** Final builder's Data tab: publishes the dashboard's datasets to Foundry and keeps published ones up to date. */
export function useFoundryPublishing(dashboard: Dashboard, datasets: Dataset[]) {
  const { published, publishDatasets } = useDashboards()
  const toast = useToast()
  const [picking, setPicking] = useState<Dataset[] | null>(null)
  const publishable = publishableDatasets(datasets)
  const states = publishStates(publishable, dashboard, published)
  const unpublished = publishable.filter((dataset) => !states.has(dataset.key))
  const changed = publishable.filter((dataset) => states.get(dataset.key)?.changed)

  const update = (targets: Dataset[]) => {
    const entries = targets.flatMap((dataset) => {
      const previous = states.get(dataset.key)?.entry
      return (previous && toPublished(dataset, dashboard, previous.table.label, previous)) ?? []
    })
    if (entries.length < targets.length) toast(`Couldn't update ${count(targets.length - entries.length)}: fix the query first`)
    if (entries.length === 0) return
    publishDatasets(entries)
    toast(entries.length === 1 ? `Updated ${entries[0].table.label} in Foundry` : `Updated ${count(entries.length)} in Foundry`)
  }

  const publish = (picks: { dataset: Dataset; name: string }[]) => {
    const entries = picks.flatMap(({ dataset, name }) => toPublished(dataset, dashboard, name) ?? [])
    publishDatasets(entries)
    setPicking(null)
    toast(`Published ${count(entries.length)} to Foundry › Dashboards › ${dashboard.name}`)
  }

  const summary: FoundrySummary = {
    actionsFor: (dataset) => {
      if (!publishable.includes(dataset)) return undefined
      const state = states.get(dataset.key)
      return {
        status: !state ? 'unpublished' : state.changed ? 'changed' : 'published',
        onPublish: () => setPicking([dataset]),
        onUpdate: () => update([dataset]),
      }
    },
    unpublished: unpublished.length,
    changed: changed.length,
    anyPublished: states.size > 0,
    onPublishAll: () => setPicking(unpublished),
    onUpdateAll: () => update(changed),
  }

  const dialog = picking && (
    <PublishDatasetsDialog dashboard={dashboard} datasets={picking} taken={takenPaths(dashboard, published)} onClose={() => setPicking(null)} onPublish={publish} />
  )
  return { summary, dialog }
}
