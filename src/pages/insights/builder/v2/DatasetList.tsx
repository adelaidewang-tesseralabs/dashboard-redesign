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
  /** Final builder: each dataset's place in Foundry, and the publish and update-all actions. */
  foundry?: FoundrySummary
}

/** `changed`: edited on the dashboard since it was last published or updated in Foundry. */
export type FoundryStatus = 'unpublished' | 'published' | 'changed'

export type DatasetFoundry = { status: FoundryStatus; onPublish: () => void; onUpdate: () => void }

export type FoundrySummary = {
  /** Undefined for datasets that can't be published, e.g. a table already published from a dashboard. */
  actionsFor: (dataset: Dataset) => DatasetFoundry | undefined
  unpublished: number
  changed: number
  anyPublished: boolean
  onPublishAll: () => void
  onUpdateAll: () => void
}

/** Left pane of the Data tab: every dataset the dashboard reads, in one list whatever its kind. */
export function DatasetList(props: DatasetListProps) {
  const { datasets, widgets, activeKey, unapplied, onActivate, onRename, onDuplicate, onDownload, onRemove, onAddSource, onAddSourceKind, onCollapse, foundry } = props
  const [renaming, setRenaming] = useState<string | null>(null)
  const addButton = (onClick: () => void) => (
    <Button variant="outline" size="xs" onClick={onClick}>
      <Plus className="size-3.5" />
      Add dataset
    </Button>
  )

  return (
    <nav aria-label="Datasets" className="flex w-72 shrink-0 flex-col border-r border-white/10 bg-tlai-1">
      <div className="flex h-11 shrink-0 items-center gap-1 border-b border-white/10 pr-2 pl-4">
        <span className="flex-1 text-sm font-medium text-white">Datasets</span>
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
              foundry={foundry?.actionsFor(dataset)}
            />
          ),
        )}
      </div>
      {foundry && datasets.length > 0 && <FoundryFooter {...foundry} />}
    </nav>
  )
}

function FoundryFooter({ unpublished, changed, anyPublished, onPublishAll, onUpdateAll }: FoundrySummary) {
  const count = (n: number) => (n === 1 ? '1 dataset' : `${n} datasets`)
  return (
    <div className="flex shrink-0 flex-col gap-2 border-t border-white/10 p-2">
      {changed > 0 && (
        <Button variant="outline" size="sm" onClick={onUpdateAll}>
          <RefreshCw className="size-3.5" />
          Update {count(changed)} in Foundry
        </Button>
      )}
      {unpublished > 0 && (
        <Button variant="outline" size="sm" onClick={onPublishAll}>
          <CloudUpload className="size-3.5" />
          {anyPublished ? `Publish ${unpublished} new to Foundry` : 'Publish to Foundry'}
        </Button>
      )}
      {changed === 0 && unpublished === 0 && (
        <p className="flex items-center gap-1.5 px-1 py-1 text-xs text-white/45">
          <Check className="size-3.5 text-tlai-mint" />
          Every dataset is up to date in Foundry
        </p>
      )}
    </div>
  )
}

type DatasetActions = { onRename: () => void; onDuplicate: () => void; onDownload: () => void; onRemove: () => void; foundry?: DatasetFoundry }

function foundryMenuItems(foundry: DatasetFoundry | undefined): MenuItem[] {
  if (foundry?.status === 'unpublished') return [{ label: 'Publish to Foundry', Icon: CloudUpload, onSelect: foundry.onPublish }]
  if (foundry?.status === 'changed') return [{ label: 'Update in Foundry', Icon: RefreshCw, onSelect: foundry.onUpdate }]
  return []
}

/** One dataset's actions, shared by its row in the list and the workspace header. */
export function datasetMenuItems({ onRename, onDuplicate, onDownload, onRemove, foundry }: DatasetActions): MenuItem[] {
  return [
    { label: 'Rename', Icon: Pencil, onSelect: onRename },
    { label: 'Duplicate', Icon: Copy, onSelect: onDuplicate },
    { label: 'Download as CSV', Icon: Download, onSelect: onDownload },
    ...foundryMenuItems(foundry),
    { label: 'Remove', Icon: Trash2, onSelect: onRemove, danger: true },
  ]
}

/** The Foundry part of a dataset's subtitle; nothing until it's published. */
export function foundryNote(foundry: DatasetFoundry | undefined) {
  if (foundry?.status === 'published') return <span className="text-white/45"> · In Foundry</span>
  if (foundry?.status === 'changed') return <span className="text-amber-300/90"> · Changed since publishing</span>
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
  foundry?: DatasetFoundry
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
        items={datasetMenuItems({ onRename, onDuplicate, onDownload, onRemove, foundry })}
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
