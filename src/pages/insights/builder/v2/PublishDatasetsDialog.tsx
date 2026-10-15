import { useState } from 'react'
import type { Dashboard } from '../../../../data/dashboards'
import { publishedPath } from '../../../../data/externalSources'
import { cn } from '../../../../lib/cn'
import { Button } from '../../../../ui/Button'
import { Dialog } from '../../../../ui/Dialog'
import { EditorCheckbox, editorInputClass } from '../EditorFields'
import { datasetIcon, datasetOriginLabel, datasetResult, type Dataset } from './datasets'

type PublishDatasetsDialogProps = {
  dashboard: Dashboard
  /** The dashboard's datasets not yet in Foundry. */
  datasets: Dataset[]
  /** Paths already used in the dashboard's Foundry folder. */
  taken: Set<string>
  onClose: () => void
  onPublish: (picks: { dataset: Dataset; name: string }[]) => void
}

type Row = { checked: boolean; name: string }

/** Mount only while open, so each opening starts from every dataset ticked under its own name. */
export function PublishDatasetsDialog({ dashboard, datasets, taken, onClose, onPublish }: PublishDatasetsDialogProps) {
  const broken = new Set(datasets.filter((dataset) => !datasetResult(dataset, dashboard).ok).map((dataset) => dataset.key))
  const [rows, setRows] = useState<Record<string, Row>>(() =>
    Object.fromEntries(datasets.map((dataset) => [dataset.key, { checked: !broken.has(dataset.key), name: dataset.label }])),
  )
  const update = (key: string, patch: Partial<Row>) => setRows((current) => ({ ...current, [key]: { ...current[key], ...patch } }))

  const picked = datasets.filter((dataset) => rows[dataset.key].checked)
  const pathOf = (dataset: Dataset) => publishedPath(dashboard.id, rows[dataset.key].name.trim())
  const errorOf = (dataset: Dataset) => {
    const row = rows[dataset.key]
    if (!row.checked) return null
    if (!row.name.trim()) return 'Add a name'
    const path = pathOf(dataset)
    const clashes = taken.has(path) || picked.some((other) => other.key !== dataset.key && pathOf(other) === path)
    return clashes ? 'Another dataset in this folder has this name' : null
  }
  const invalid = picked.some((dataset) => errorOf(dataset) !== null)

  return (
    <Dialog
      open
      onClose={onClose}
      closeOnBackdrop={false}
      title="Publish to Foundry"
      description={`Saved to Foundry › Dashboards › ${dashboard.name}. Everyone with Foundry access can view and use them.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={picked.length === 0 || invalid}
            onClick={() => onPublish(picked.map((dataset) => ({ dataset, name: rows[dataset.key].name.trim() })))}
          >
            {picked.length === 1 ? 'Publish 1 dataset' : `Publish ${picked.length} datasets`}
          </Button>
        </>
      }
    >
      <ul aria-label="Datasets to publish" className="flex max-h-80 flex-col gap-3 overflow-y-auto">
        {datasets.map((dataset) => {
          const row = rows[dataset.key]
          const error = errorOf(dataset)
          const Icon = datasetIcon(dataset)
          return (
            <li key={dataset.key} className="flex items-start gap-3">
              <div className="pt-2">
                <EditorCheckbox
                  label={<span className="sr-only">Publish {dataset.label}</span>}
                  checked={row.checked}
                  disabled={broken.has(dataset.key)}
                  onChange={(checked) => update(dataset.key, { checked })}
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <input
                  aria-label={`Foundry name for ${dataset.label}`}
                  aria-invalid={error !== null}
                  value={row.name}
                  disabled={!row.checked}
                  onChange={(event) => update(dataset.key, { name: event.target.value })}
                  className={cn(editorInputClass, error && 'border-red-400/60')}
                />
                <span className={cn('flex items-center gap-1.5 text-xs', error || broken.has(dataset.key) ? 'text-red-300' : 'text-white/45')}>
                  <Icon className="size-3.5 shrink-0" />
                  {broken.has(dataset.key) ? 'The query has an error. Fix it to publish.' : (error ?? `${dataset.label} · ${datasetOriginLabel(dataset)}`)}
                </span>
              </div>
            </li>
          )
        })}
      </ul>
    </Dialog>
  )
}
