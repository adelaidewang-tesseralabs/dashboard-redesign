import { useRef, useState, type ReactNode } from 'react'
import { ChartColumn, FileCode2, MoreHorizontal, Play } from 'lucide-react'
import type { Dashboard, SqlDataset } from '../../../../data/dashboards'
import { runSql, type SqlResult } from '../../../../data/dataSources'
import { applyTransforms, columnTypes, type DatasetTransforms } from '../../../../data/transforms'
import type { CanvasItem } from '../../../../data/widgets'
import { cn } from '../../../../lib/cn'
import { formatNumber } from '../../../../lib/format'
import { Button } from '../../../../ui/Button'
import { Menu } from '../../../../ui/Menu'
import { filterColumns, findFilterColumn } from '../dashboardFilters'
import { EditableTitle } from '../EditableTitle'
import { datasetMenuItems } from './DatasetList'
import { DatasetUsedIn } from './DatasetUsedIn'
import { FieldLinks } from './FieldLinks'
import { datasetOriginLabel, datasetPath, datasetSql, type Dataset } from './datasets'
import { ResultWorkbench } from './ResultWorkbench'

type WorkspaceTab = 'result' | 'schema' | 'used'

type DatasetWorkspaceProps = {
  dashboard: Dashboard
  dataset: Dataset
  usedIn: CanvasItem[]
  /** Applied transforms: what graphs, the schema and new graphs read. */
  transforms: DatasetTransforms | undefined
  /** Unapplied edits, previewed on the Result tab only. */
  draft: DatasetTransforms | undefined
  onDraftChange: (draft: DatasetTransforms | null) => void
  onApplyTransforms: (transforms: DatasetTransforms) => void
  onRename: (label: string) => void
  /** Omitted when SQL is read-only (builder V6), which hides the query editor. */
  onSaveSql?: (dataset: SqlDataset) => void
  onCreateGraph: () => void
  onDuplicate: () => void
  onDownload: () => void
  onRemove: () => void
  onOpenWidget: (itemId: string) => void
  /** Table datasets only: fork into a SQL dataset to refine the query. */
  onEditAsSql?: () => void
  /** Builder V6 turns off new dataset row limits. */
  rowLimit?: boolean
}

/** Right pane of the Data tab: the selected dataset's query or preview, its result, schema and the graphs using it. */
export function DatasetWorkspace(props: DatasetWorkspaceProps) {
  const { dashboard, dataset, usedIn, transforms, draft, onDraftChange, onApplyTransforms, onRename, onSaveSql, onCreateGraph, onDuplicate, onDownload, onRemove, onOpenWidget, onEditAsSql, rowLimit } =
    props
  const [tab, setTab] = useState<WorkspaceTab>('result')
  const sectionRef = useRef<HTMLElement>(null)
  const source = runSql(datasetSql(dataset))
  const result = applyTransforms(source, transforms)
  const preview = draft ? applyTransforms(source, draft) : result
  const focusName = () => sectionRef.current?.querySelector<HTMLInputElement>('input[aria-label="Dataset name"]')?.focus()

  return (
    <section ref={sectionRef} aria-label={dataset.label} className="flex min-w-0 flex-1 flex-col bg-tlai-1">
      <header className="flex shrink-0 items-center gap-3 border-b border-white/10 px-5 py-2.5">
        <div className="flex min-w-0 flex-1 flex-col">
          <EditableTitle value={dataset.label} onChange={onRename} label="Dataset name" size="md" />
          <span className="truncate text-xs text-white/45">
            {datasetOriginLabel(dataset)}
            {dataset.kind === 'table' && <span className="font-mono"> · {datasetPath(dataset)}</span>}
          </span>
        </div>
        {dataset.kind === 'table' && onEditAsSql && (
          <Button variant="ghost" size="sm" onClick={onEditAsSql}>
            <FileCode2 className="size-3.5" />
            Edit as SQL
          </Button>
        )}
        <Button size="sm" disabled={!result.ok} onClick={onCreateGraph}>
          <ChartColumn className="size-3.5" />
          Create graph
        </Button>
        <Menu
          items={datasetMenuItems({ onRename: focusName, onDuplicate, onDownload, onRemove })}
          trigger={({ toggle }) => (
            <Button variant="outline" size="sm" aria-label={`More actions for ${dataset.label}`} title="More actions" onClick={toggle} className="px-2">
              <MoreHorizontal className="size-4" />
            </Button>
          )}
        />
      </header>

      {dataset.kind === 'sql' && onSaveSql && <SqlEditor key={dataset.dataset.id} dataset={dataset.dataset} onSave={onSaveSql} />}

      <div role="tablist" aria-label="Dataset details" className="flex h-10 shrink-0 items-center gap-1 border-b border-white/10 px-4">
        <TabButton active={tab === 'result'} onClick={() => setTab('result')}>
          Result
          {preview.ok && <span className="text-white/45">{formatNumber(preview.rows.length)}</span>}
        </TabButton>
        <TabButton active={tab === 'schema'} onClick={() => setTab('schema')}>
          Schema
        </TabButton>
        <TabButton active={tab === 'used'} onClick={() => setTab('used')}>
          Used in <span className="text-white/45">{usedIn.length}</span>
        </TabButton>
      </div>
      {tab === 'result' ? (
        <div role="tabpanel" className="flex min-h-0 flex-1">
          <ResultWorkbench
            dashboard={dashboard}
            datasetKey={dataset.key}
            source={source}
            applied={transforms}
            draft={draft}
            onDraftChange={onDraftChange}
            onApply={onApplyTransforms}
            usedIn={usedIn}
            rowLimit={rowLimit}
          />
        </div>
      ) : (
        <div role="tabpanel" className="min-h-0 flex-1 overflow-auto p-4">
          {tab === 'schema' && <SchemaPane dashboard={dashboard} dataset={dataset} result={result} />}
          {tab === 'used' && <DatasetUsedIn items={usedIn} onOpen={onOpenWidget} onCreateGraph={onCreateGraph} />}
        </div>
      )}
    </section>
  )
}

/** Run saves the query too, so every graph built on this dataset picks up the change. */
function SqlEditor({ dataset, onSave }: { dataset: SqlDataset; onSave: (dataset: SqlDataset) => void }) {
  const [draft, setDraft] = useState(dataset.sql)
  const dirty = draft !== dataset.sql
  const run = () => onSave({ ...dataset, sql: draft })

  return (
    <div className="flex h-56 shrink-0 flex-col border-b border-white/10">
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-white/10 px-4 text-xs text-white/45">
        <span className="flex-1">{dirty ? 'Unsaved changes. Run to save and refresh the graphs using this dataset.' : 'Query'}</span>
        <Button size="xs" onClick={run}>
          <Play className="size-3" />
          Run
        </Button>
      </div>
      <textarea
        aria-label="SQL query"
        placeholder="Write a query"
        value={draft}
        spellCheck={false}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault()
            run()
          }
        }}
        className="min-h-0 flex-1 resize-none bg-transparent px-4 py-3 font-mono text-[13px] leading-6 text-white outline-none"
      />
    </div>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn('flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-xs text-white/55 hover:text-white', active && 'bg-white/10 text-white')}
    >
      {children}
    </button>
  )
}

/** The columns the transformed result exposes; table fields also list their values, and filterable ones their links. */
function SchemaPane({ dashboard, dataset, result }: { dashboard: Dashboard; dataset: Dataset; result: SqlResult }) {
  if (!result.ok) return <p className="text-sm text-white/45">Fix the query to see its columns.</p>
  const types = columnTypes(result)
  const columns = filterColumns(dashboard)
  const fields = result.columns.map((column) => {
    const field = dataset.kind === 'table' ? dataset.object.fields.find((candidate) => candidate.key === column) : undefined
    return { name: column, type: types.get(column) ?? 'text', detail: field?.values.join(', ') ?? '' }
  })
  return (
    <table className="w-full text-left text-[13px]">
      <thead className="text-xs text-white/45">
        <tr>
          <th className="py-1.5 pr-4 font-medium">Column</th>
          <th className="py-1.5 pr-4 font-medium">Type</th>
          <th className="py-1.5 pr-4 font-medium">Values</th>
          <th className="py-1.5 font-medium" title="Page filters on a linked column also narrow this one">
            Linked to
          </th>
        </tr>
      </thead>
      <tbody>
        {fields.map((field) => {
          const ref = { datasetKey: dataset.key, column: field.name }
          return (
            <tr key={field.name} className="border-t border-white/5">
              <td className="py-2 pr-4 font-mono text-white">{field.name}</td>
              <td className="py-2 pr-4 text-white/60">{field.type}</td>
              <td className="py-2 pr-4 text-white/60">{field.detail}</td>
              <td className="py-1.5">{findFilterColumn(columns, ref) && <FieldLinks dashboard={dashboard} field={ref} columns={columns} />}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
