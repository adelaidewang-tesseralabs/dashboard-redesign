import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import type { Dashboard } from '../../../../data/dashboards'
import { publishedPath } from '../../../../data/externalSources'
import { cn } from '../../../../lib/cn'
import { Button } from '../../../../ui/Button'
import { Dialog } from '../../../../ui/Dialog'
import { editorInputClass } from '../EditorFields'
import { datasetIcon, datasetOriginLabel, datasetResult, type Dataset } from './datasets'

type PublishDatasetsDialogProps = {
  dashboard: Dashboard
  /** The dashboard's datasets not yet in Foundry; each needs a name in the folder. */
  fresh: Dataset[]
  /** Published datasets edited since, updated in the same go. */
  changed: Dataset[]
  firstPublish: boolean
  /** Paths already used in the dashboard's Foundry folder. */
  taken: Set<string>
  /** Extra context under a dataset, e.g. that it's a linked copy of another dashboard's table. */
  noteFor: (dataset: Dataset) => string | undefined
  onClose: () => void
  onPublish: (names: Map<string, string>) => void
}

const BROKEN = 'The query has an error. Fix it to publish.'

/** Mount only while open, so each opening starts from every dataset under its own name. */
export function PublishDatasetsDialog({ dashboard, fresh, changed, firstPublish, taken, noteFor, onClose, onPublish }: PublishDatasetsDialogProps) {
  const broken = new Set([...fresh, ...changed].filter((dataset) => !datasetResult(dataset, dashboard).ok).map((dataset) => dataset.key))
  const [names, setNames] = useState<Record<string, string>>(() => Object.fromEntries(fresh.map((dataset) => [dataset.key, dataset.label])))

  const pathOf = (dataset: Dataset) => publishedPath(dashboard.id, names[dataset.key].trim())
  const errorOf = (dataset: Dataset) => {
    if (broken.has(dataset.key)) return BROKEN
    if (!names[dataset.key].trim()) return 'Add a name'
    const path = pathOf(dataset)
    const clashes = taken.has(path) || fresh.some((other) => other.key !== dataset.key && pathOf(other) === path)
    return clashes ? 'Another dataset in this folder has this name' : null
  }
  const blocked = broken.size > 0 || fresh.some((dataset) => errorOf(dataset) !== null)
  const caption = (dataset: Dataset) => noteFor(dataset) ?? `${dataset.label} · ${datasetOriginLabel(dataset)}`

  return (
    <Dialog
      open
      onClose={onClose}
      closeOnBackdrop={false}
      title={firstPublish ? 'Publish to Foundry' : 'Update in Foundry'}
      description={`Saved to Foundry › Dashboards › ${dashboard.name}. Everyone with Foundry access can view and use them.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={blocked} onClick={() => onPublish(new Map(fresh.map((dataset) => [dataset.key, names[dataset.key].trim()])))}>
            {firstPublish ? (fresh.length === 1 ? 'Publish 1 dataset' : `Publish ${fresh.length} datasets`) : 'Update Foundry'}
          </Button>
        </>
      }
    >
      <ul aria-label="Datasets in the folder" className="flex max-h-80 flex-col gap-3 overflow-y-auto">
        {fresh.map((dataset) => {
          const error = errorOf(dataset)
          const Icon = datasetIcon(dataset)
          return (
            <li key={dataset.key} className="flex flex-col gap-1">
              <input
                aria-label={`Foundry name for ${dataset.label}`}
                aria-invalid={error !== null}
                value={names[dataset.key]}
                onChange={(event) => setNames((current) => ({ ...current, [dataset.key]: event.target.value }))}
                className={cn(editorInputClass, error && 'border-red-400/60')}
              />
              <span className={cn('flex items-center gap-1.5 text-xs', error ? 'text-red-300' : 'text-white/45')}>
                <Icon className="size-3.5 shrink-0" />
                {error ?? (firstPublish ? caption(dataset) : `New · ${caption(dataset)}`)}
              </span>
            </li>
          )
        })}
        {changed.map((dataset) => (
          <li key={dataset.key} className="flex flex-col gap-1 px-1">
            <span className="flex items-center gap-1.5 text-[13px] text-white">
              <RefreshCw className="size-3.5 shrink-0 text-white/55" />
              {dataset.label}
            </span>
            <span className={cn('text-xs', broken.has(dataset.key) ? 'text-red-300' : 'text-white/45')}>
              {broken.has(dataset.key) ? BROKEN : 'Changed since publishing · updates in Foundry'}
            </span>
          </li>
        ))}
      </ul>
    </Dialog>
  )
}
