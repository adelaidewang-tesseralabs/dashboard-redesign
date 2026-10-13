import { X } from 'lucide-react'
import type { Dashboard } from '../../../../data/dashboards'
import { columnTypes, type RowFilter } from '../../../../data/transforms'
import type { CanvasItem, GraphItem } from '../../../../data/widgets'
import { displayTitle, itemLabel } from '../canvasItems'
import { EditorSection, IconAction } from '../EditorFields'
import { datasetResult, itemDatasetKey, type Dataset } from './datasets'
import type { TransformColumn } from './transforms/controls'
import { FiltersEditor } from './transforms/FiltersEditor'

type MultiGraphPanelProps = {
  graphs: GraphItem[]
  datasets: Dataset[]
  dashboard: Dashboard
  onChange: (items: CanvasItem[]) => void
  onDeselect: (itemId: string) => void
  onClose: () => void
}

function resultColumns(item: GraphItem, datasets: Dataset[], dashboard: Dashboard): TransformColumn[] {
  const dataset = datasets.find((candidate) => candidate.key === itemDatasetKey(item))
  const result = dataset ? datasetResult(dataset, dashboard) : undefined
  if (!result?.ok) return []
  const types = columnTypes(result)
  return result.columns.map((key) => ({ key, type: types.get(key) ?? 'text' }))
}

/** Shift-click selection: one set of graph filters written into every selected graph, each keeping its own others. */
export function MultiGraphPanel({ graphs, datasets, dashboard, onChange, onDeselect, onClose }: MultiGraphPanelProps) {
  const perGraph = graphs.map((item) => resultColumns(item, datasets, dashboard))
  const columns = perGraph[0]?.filter((column) => perGraph.every((own) => own.some((entry) => entry.key === column.key))) ?? []
  const filtersOf = (item: GraphItem) => item.query?.filters ?? []
  // Filters added here carry one id across every graph, which is how they're recognised as shared.
  const shared = filtersOf(graphs[0]).filter((filter) => graphs.every((item) => filtersOf(item).some((entry) => entry.id === filter.id)))
  const sharedIds = new Set(shared.map((filter) => filter.id))
  const setShared = (next: RowFilter[]) =>
    onChange(
      graphs.map((item) => {
        const filters = [...filtersOf(item).filter((filter) => !sharedIds.has(filter.id)), ...next]
        return { ...item, query: { ...item.query, filters: filters.length ? filters : undefined } }
      }),
    )

  return (
    <div aria-label="Settings for selected graphs" className="relative flex min-h-0 flex-1 flex-col bg-tlai-1 text-sm">
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-white/10 px-4">
        <span className="min-w-0 flex-1 truncate font-medium text-white">Editing {graphs.length} graphs</span>
        <IconAction Icon={X} label="Clear selection" onClick={onClose} />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <EditorSection title="Selected">
          <ul className="flex flex-col gap-1">
            {graphs.map((item) => (
              <li key={item.id} className="flex items-center gap-2 rounded-md bg-white/[0.03] py-1 pr-1 pl-2.5">
                <span className="min-w-0 flex-1 truncate text-xs text-white/80">{displayTitle(item) || itemLabel(item)}</span>
                <IconAction Icon={X} label={`Remove ${displayTitle(item) || itemLabel(item)} from selection`} onClick={() => onDeselect(item.id)} />
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-white/40">Shift-click graphs on the canvas to add or remove them.</p>
        </EditorSection>
        <EditorSection title="Filters">
          <p className="-mt-1 text-xs text-white/45">Added to each selected graph. Their own filters stay as they are.</p>
          <FiltersEditor compact filters={shared} columns={columns} addLabel="Add filter to all" onChange={setShared} />
          {columns.length === 0 && <p className="text-[11px] text-white/45">These graphs have no column in common to filter on.</p>}
        </EditorSection>
      </div>
    </div>
  )
}
