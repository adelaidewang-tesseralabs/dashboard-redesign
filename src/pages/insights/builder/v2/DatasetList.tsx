import { useState } from 'react'
import { Check, CloudUpload, Copy, Download, MoreHorizontal, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react'
import type { CanvasItem } from '../../../../data/widgets'
import { cn } from '../../../../lib/cn'
import { Button } from '../../../../ui/Button'
import { Menu, type MenuItem } from '../../../../ui/Menu'
import type { AddSourceKind } from '../sourceKinds'
import { AddDatasetMenu } from './AddDatasetMenu'
import { CollapseListButton } from './CollapseListButton'
import { datasetIcon, datasetOriginLabel, datasetUsage, type Dataset } from './datasets'

type DatasetListProps = {
  datasets: Dataset[]
  widgets: CanvasItem[]
  activeKey: string | null
  /** Datasets with transform edits not yet applied to their graphs. */
  unapplied: Set<string>
  onActivate: (key: string) => void
  onRename: (dataset: Dataset, label: string) => void
  onDuplicate: (dataset: Dataset) => void
  onDownload: (dataset: Dataset) => void
  onRemove: (dataset: Dataset) => void
  onAddSource: () => void
  /** Builder V3: "Add dataset" opens the production source menu instead of calling `onAddSource`. */
  onAddSourceKind?: (kind: AddSourceKind) => void
  onCollapse?: () => void
  /** Final builder: where each dataset stands in Foundry, and the dashboard's publish action. */
  foundry?: FoundrySummary
}

/** `changed`: edited since the dashboard was last published or updated. `new`: added after the dashboard was published. */
export type FoundryStatus = 'new' | 'published' | 'changed'

/** The dashboard publishes to Foundry as a whole: first `publish`, then `update` whenever a dataset is new or changed. */
export type FoundryAction = { state: 'publish' | 'update' | 'published'; hint: string; onClick: () => void }

export type FoundrySummary = {
  /** Undefined until the dashboard is first published. */
  statusFor: (dataset: Dataset) => FoundryStatus | undefined
  /** Undefined while the dashboard has no datasets. */
  action: FoundryAction | undefined
}

/** Left pane of the Data tab: every dataset the dashboard reads, in one list whatever its kind. */
export function DatasetList(props: DatasetListProps) {
  const { datasets, widgets, activeKey, unapplied, onActivate, onRename, onDuplicate, onDownload, onRemove, onAddSource, onAddSourceKind, onCollapse, foundry } = props
  const [renaming, setRenaming] = useState<string | null>(null)
  const addButton = (onClick: () => void) => (
    <Button variant="outline" size="xs" aria-label={foundry ? 'Add dataset' : undefined} onClick={onClick}>
      <Plus className="size-3.5" />
      {foundry ? 'Add' : 'Add dataset'}
    </Button>
  )

  return (
    <nav aria-label="Datasets" className="flex w-72 shrink-0 flex-col border-r border-white/10 bg-tlai-1">
      <div className="flex h-11 shrink-0 items-center gap-1 border-b border-white/10 pr-2 pl-4">
        <span className="flex-1 text-sm font-medium text-white">Datasets</span>
        {foundry?.action && <FoundryButton {...foundry.action} />}
        {onAddSourceKind ? <AddDatasetMenu onSelect={onAddSourceKind} trigger={({ toggle }) => addButton(toggle)} /> : addButton(onAddSource)}
        {onCollapse && <CollapseListButton onClick={onCollapse} />}
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
              unapplied={unapplied.has(dataset.key)}
              onActivate={() => onActivate(dataset.key)}
              onRename={() => setRenaming(dataset.key)}
              onDuplicate={() => onDuplicate(dataset)}
              onDownload={() => onDownload(dataset)}
              onRemove={() => onRemove(dataset)}
              foundry={foundry?.statusFor(dataset)}
            />
          ),
        )}
      </div>
    </nav>
  )
}

function FoundryButton({ state, hint, onClick }: FoundryAction) {
  if (state === 'published') {
    return (
      <span title={hint} className="flex h-6 items-center gap-1 px-1.5 text-xs text-white/45">
        <Check className="size-3.5 text-tlai-mint" />
        Published
      </span>
    )
  }
  const Icon = state === 'update' ? RefreshCw : CloudUpload
  return (
    <Button variant="outline" size="xs" title={hint} aria-label={hint} onClick={onClick}>
      <Icon className="size-3.5" />
      {state === 'update' ? 'Update' : 'Publish'}
      {state === 'update' && <span aria-hidden className="size-1.5 rounded-full bg-amber-300" />}
    </Button>
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

/** The Foundry part of a dataset's subtitle; nothing until the dashboard is published. */
export function foundryNote(status: FoundryStatus | undefined) {
  if (status === 'published') return <span className="text-white/45"> · In Foundry</span>
  if (status === 'changed') return <span className="text-amber-300/90"> · Changed since publishing</span>
  if (status === 'new') return <span className="text-amber-300/90"> · Not in Foundry yet</span>
  return null
}

type DatasetRowProps = {
  dataset: Dataset
  usage: number
  active: boolean
  unapplied: boolean
  onActivate: () => void
  onRename: () => void
  onDuplicate: () => void
  onDownload: () => void
  onRemove: () => void
  foundry?: FoundryStatus
}

function DatasetRow({ dataset, usage, active, unapplied, onActivate, onRename, onDuplicate, onDownload, onRemove, foundry }: DatasetRowProps) {
  const Icon = datasetIcon(dataset)
  return (
    <div className={cn('group flex items-center gap-1 rounded-md pr-1 hover:bg-white/5', active && 'bg-white/10 hover:bg-white/10')}>
      <button type="button" aria-current={active || undefined} onClick={onActivate} className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 px-2 py-1.5 text-left">
        <span title={datasetOriginLabel(dataset)} className="shrink-0">
          <Icon className="size-4 text-white/55" />
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-[13px] text-white">{dataset.label}</span>
            {unapplied && <span title="Unapplied transform changes" aria-label="Unapplied transform changes" className="size-1.5 shrink-0 rounded-full bg-amber-300" />}
          </span>
          <span className="truncate text-[11px] text-white/45">
            {usage === 0 ? 'Not used yet' : usage === 1 ? 'Used by 1 graph' : `Used by ${usage} graphs`}
            {foundryNote(foundry)}
          </span>
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
