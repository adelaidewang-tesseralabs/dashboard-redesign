import { useState } from 'react'
import { Copy, Download, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import type { CanvasItem } from '../../../../data/widgets'
import { cn } from '../../../../lib/cn'
import { Button } from '../../../../ui/Button'
import { Menu, type MenuItem } from '../../../../ui/Menu'
import type { AddSourceKind } from '../sourceKinds'
import { AddDatasetMenu } from './AddDatasetMenu'
import { datasetIcon, datasetOriginLabel, datasetUsage, type Dataset } from './datasets'

type DatasetListProps = {
  datasets: Dataset[]
  widgets: CanvasItem[]
  activeKey: string | null
  onActivate: (key: string) => void
  onRename: (dataset: Dataset, label: string) => void
  onDuplicate: (dataset: Dataset) => void
  onDownload: (dataset: Dataset) => void
  onRemove: (dataset: Dataset) => void
  onAddSource: () => void
  /** Builder V3: "Add dataset" opens the production source menu instead of calling `onAddSource`. */
  onAddSourceKind?: (kind: AddSourceKind) => void
}

/** Left pane of the Data tab: every dataset the dashboard reads, in one list whatever its kind. */
export function DatasetList(props: DatasetListProps) {
  const { datasets, widgets, activeKey, onActivate, onRename, onDuplicate, onDownload, onRemove, onAddSource, onAddSourceKind } = props
  const [renaming, setRenaming] = useState<string | null>(null)
  const addButton = (onClick: () => void) => (
    <Button variant="outline" size="xs" onClick={onClick}>
      <Plus className="size-3.5" />
      Add dataset
    </Button>
  )

  return (
    <nav aria-label="Datasets" className="flex w-72 shrink-0 flex-col border-r border-white/10 bg-tlai-1">
      <div className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-white/10 pr-2 pl-4">
        <span className="text-sm font-medium text-white">Datasets</span>
        {onAddSourceKind ? <AddDatasetMenu onSelect={onAddSourceKind} trigger={({ toggle }) => addButton(toggle)} /> : addButton(onAddSource)}
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-2">
        {datasets.length === 0 && <p className="px-2 py-3 text-xs text-white/45">Nothing yet. Data you add here or from the canvas shows up in this list.</p>}
        {datasets.map((dataset) =>
          renaming === dataset.key ? (
            <RenameInput
              key={dataset.key}
              value={dataset.label}
              onDone={(next) => {
                setRenaming(null)
                if (next && next !== dataset.label) onRename(dataset, next)
              }}
            />
          ) : (
            <DatasetRow
              key={dataset.key}
              dataset={dataset}
              usage={datasetUsage(widgets, dataset.key).length}
              active={dataset.key === activeKey}
              onActivate={() => onActivate(dataset.key)}
              onRename={() => setRenaming(dataset.key)}
              onDuplicate={() => onDuplicate(dataset)}
              onDownload={() => onDownload(dataset)}
              onRemove={() => onRemove(dataset)}
            />
          ),
        )}
      </div>
    </nav>
  )
}

type DatasetActions = { onRename: () => void; onDuplicate: () => void; onDownload: () => void; onRemove: () => void }

/** One dataset's actions, shared by its row in the list and the workspace header. */
export function datasetMenuItems({ onRename, onDuplicate, onDownload, onRemove }: DatasetActions): MenuItem[] {
  return [
    { label: 'Rename', Icon: Pencil, onSelect: onRename },
    { label: 'Duplicate', Icon: Copy, onSelect: onDuplicate },
    { label: 'Download as CSV', Icon: Download, onSelect: onDownload },
    { label: 'Remove', Icon: Trash2, onSelect: onRemove, danger: true },
  ]
}

type DatasetRowProps = {
  dataset: Dataset
  usage: number
  active: boolean
  onActivate: () => void
  onRename: () => void
  onDuplicate: () => void
  onDownload: () => void
  onRemove: () => void
}

function DatasetRow({ dataset, usage, active, onActivate, onRename, onDuplicate, onDownload, onRemove }: DatasetRowProps) {
  const Icon = datasetIcon(dataset)
  return (
    <div className={cn('group flex items-center gap-1 rounded-md pr-1 hover:bg-white/5', active && 'bg-white/10 hover:bg-white/10')}>
      <button type="button" aria-current={active || undefined} onClick={onActivate} className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 px-2 py-1.5 text-left">
        <span title={datasetOriginLabel(dataset)} className="shrink-0">
          <Icon className="size-4 text-white/55" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-[13px] text-white">{dataset.label}</span>
          <span className="text-[11px] text-white/45">{usage === 0 ? 'Not used yet' : usage === 1 ? 'Used by 1 graph' : `Used by ${usage} graphs`}</span>
        </span>
      </button>
      <Menu
        items={datasetMenuItems({ onRename, onDuplicate, onDownload, onRemove })}
        trigger={({ open, toggle }) => (
          <button
            type="button"
            aria-label={`More actions for ${dataset.label}`}
            onClick={toggle}
            className={cn(
              'flex size-6 cursor-pointer items-center justify-center rounded text-white/50 opacity-0 group-hover:opacity-100 hover:bg-white/10 hover:text-white focus-visible:opacity-100',
              open && 'opacity-100',
            )}
          >
            <MoreHorizontal className="size-4" />
          </button>
        )}
      />
    </div>
  )
}

function RenameInput({ value, onDone }: { value: string; onDone: (value: string) => void }) {
  const [draft, setDraft] = useState(value)
  return (
    <input
      aria-label="Dataset name"
      autoFocus
      value={draft}
      onFocus={(event) => event.target.select()}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => onDone(draft.trim())}
      onKeyDown={(event) => {
        if (event.key === 'Enter') onDone(draft.trim())
        if (event.key === 'Escape') onDone(value)
      }}
      className="my-0.5 h-9 w-full rounded-md border border-white/30 bg-white/5 px-2 text-[13px] text-white outline-none"
    />
  )
}
