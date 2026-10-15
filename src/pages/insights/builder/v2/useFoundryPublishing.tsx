import { useState } from 'react'
import type { Dashboard } from '../../../../data/dashboards'
import { useDashboards } from '../../../../data/DashboardsStore'
import { useToast } from '../../../../ui/Toast'
import type { FoundryAction, FoundrySummary } from './DatasetList'
import { datasetResult, type Dataset } from './datasets'
import { PublishDatasetsDialog } from './PublishDatasetsDialog'
import { linkedCopyNote, publishStates, takenPaths, toPublished } from './publishDatasets'

const count = (n: number) => (n === 1 ? '1 dataset' : `${n} datasets`)
const sentence = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

/** Final builder's Data tab: publishes the dashboard to Foundry as one folder of all its datasets, and keeps it in sync. */
export function useFoundryPublishing(dashboard: Dashboard, datasets: Dataset[]) {
  const { dashboards, published, publishDatasets } = useDashboards()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const states = publishStates(datasets, dashboard, published)
  const fresh = datasets.filter((dataset) => !states.has(dataset.key))
  const changed = datasets.filter((dataset) => states.get(dataset.key)?.changed)
  const folder = `Foundry › Dashboards › ${dashboard.name}`
  const firstPublish = states.size === 0

  /** Publishes `names` (the new datasets' Foundry names) and updates every changed dataset, all or nothing. */
  const sync = (names: Map<string, string>) => {
    const broken = [...fresh, ...changed].find((dataset) => !datasetResult(dataset, dashboard).ok)
    if (broken) {
      toast(`Fix the query in ${broken.label} to ${firstPublish ? 'publish' : 'update'} Foundry`)
      return
    }
    const entries = [
      ...changed.map((dataset) => {
        const previous = states.get(dataset.key)?.entry
        return previous && toPublished(dataset, dashboard, previous.table.label, previous)
      }),
      ...fresh.map((dataset) => toPublished(dataset, dashboard, names.get(dataset.key) ?? dataset.label)),
    ].filter((entry) => entry != null)
    publishDatasets(entries)
    setOpen(false)
    toast(firstPublish ? `Published ${count(entries.length)} to ${folder}` : `Updated ${folder}`)
  }

  const pending = [changed.length > 0 && `update ${count(changed.length)}`, fresh.length > 0 && `publish ${fresh.length} new`].filter(Boolean).join(' and ')
  const action: FoundryAction | undefined =
    datasets.length === 0
      ? undefined
      : firstPublish
        ? { state: 'publish', hint: `Publish ${count(datasets.length)} to ${folder}`, onClick: () => setOpen(true) }
        : pending
          ? { state: 'update', hint: `${sentence(pending)} in ${folder}`, onClick: () => (fresh.length > 0 ? setOpen(true) : sync(new Map())) }
          : { state: 'published', hint: `Every dataset is up to date in ${folder}`, onClick: () => undefined }

  const summary: FoundrySummary = {
    statusFor: (dataset) => {
      const state = states.get(dataset.key)
      if (state) return state.changed ? 'changed' : 'published'
      return firstPublish ? undefined : 'new'
    },
    action,
  }

  const dialog = open && (
    <PublishDatasetsDialog
      dashboard={dashboard}
      fresh={fresh}
      changed={changed}
      firstPublish={firstPublish}
      taken={takenPaths(dashboard, published)}
      noteFor={(dataset) => linkedCopyNote(dataset, published, dashboards)}
      onClose={() => setOpen(false)}
      onPublish={sync}
    />
  )
  return { summary, dialog }
}
