import { useState, type ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'
import type { Dashboard } from '../../../../data/dashboards'
import { cn } from '../../../../lib/cn'
import { Button } from '../../../../ui/Button'
import { Dialog } from '../../../../ui/Dialog'
import { editorInputClass } from '../EditorFields'
import { datasetIcon, datasetOriginLabel, datasetResult, type Dataset } from './datasets'

type PublishDatasetsDialogProps = {
  dashboard: Dashboard
  /** The folder's current name: the dashboard's name until it's first published. */
  folder: string
  /** Folder names other dashboards use, lowercased. */
  otherFolders: Set<string>
  /** The dashboard's datasets not yet in Foundry, under the name each gets in the folder. */
  fresh: { dataset: Dataset; name: string }[]
  /** Published datasets edited since, updated in the same go. */
  changed: Dataset[]
  firstPublish: boolean
  /** Extra context under a dataset, e.g. that it's a linked copy of another dashboard's table. */
  noteFor: (dataset: Dataset) => string | undefined
  onClose: () => void
  onPublish: (folder: string) => void
}

const BROKEN = 'The query has an error. Fix it to publish.'

/** Mount only while open, so each opening starts from the folder's current name. */
export function PublishDatasetsDialog({ dashboard, folder, otherFolders, fresh, changed, firstPublish, noteFor, onClose, onPublish }: PublishDatasetsDialogProps) {
  const [name, setName] = useState(folder)
  const broken = new Set([...fresh.map(({ dataset }) => dataset), ...changed].filter((dataset) => !datasetResult(dataset, dashboard).ok).map((dataset) => dataset.key))
  const folderError = !name.trim() ? 'Add a folder name' : otherFolders.has(name.trim().toLowerCase()) ? 'Another dashboard folder has this name' : null
  const caption = (dataset: Dataset) => noteFor(dataset) ?? datasetOriginLabel(dataset)

  return (
    <Dialog
      open
      onClose={onClose}
      closeOnBackdrop={false}
      title={firstPublish ? 'Publish to Foundry' : 'Update in Foundry'}
      description="Saved to Foundry › Dashboards. Everyone with Foundry access can view and use them."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={folderError !== null || broken.size > 0} onClick={() => onPublish(name.trim())}>
            {firstPublish ? (fresh.length === 1 ? 'Publish 1 dataset' : `Publish ${fresh.length} datasets`) : 'Update Foundry'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-white/70">Folder name</span>
          <input
            autoFocus
            aria-invalid={folderError !== null}
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={cn(editorInputClass, folderError && 'border-red-400/60')}
          />
          {folderError && <span className="text-xs text-red-300">{folderError}</span>}
        </label>
        <ul aria-label="Datasets in the folder" className="flex max-h-72 flex-col gap-2.5 overflow-y-auto">
          {fresh.map(({ dataset, name: tableName }) => {
            const Icon = datasetIcon(dataset)
            return (
              <DatasetLine key={dataset.key} icon={<Icon className="size-3.5 shrink-0 text-white/55" />} name={tableName} error={broken.has(dataset.key)}>
                {firstPublish ? caption(dataset) : `New · ${caption(dataset)}`}
              </DatasetLine>
            )
          })}
          {changed.map((dataset) => (
            <DatasetLine key={dataset.key} icon={<RefreshCw className="size-3.5 shrink-0 text-white/55" />} name={dataset.label} error={broken.has(dataset.key)}>
              Changed since publishing · updates in Foundry
            </DatasetLine>
          ))}
        </ul>
      </div>
    </Dialog>
  )
}

function DatasetLine({ icon, name, error, children }: { icon: ReactNode; name: string; error: boolean; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="pt-0.5">{icon}</span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-[13px] text-white">{name}</span>
        <span className={cn('truncate text-xs', error ? 'text-red-300' : 'text-white/45')}>{error ? BROKEN : children}</span>
      </span>
    </li>
  )
}
