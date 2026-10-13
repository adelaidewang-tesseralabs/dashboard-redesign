import { Link2 } from 'lucide-react'
import type { Dashboard, DashboardFilter } from '../../../data/dashboards'
import { filterReach, findFilterColumn, type FilterColumn } from './dashboardFilters'
import { itemDatasetKey, listDatasets } from './v2/datasets'

type FilterReachNoteProps = {
  dashboard: Dashboard
  filter: DashboardFilter
  columns: FilterColumn[]
  /** Editors only: link a column of a dataset the filter can't reach. */
  onLink?: (datasetKey: string) => void
}

/** How many graphs on the page a filter narrows, which datasets it misses, and picked values a linked dataset doesn't have. */
export function FilterReachNote({ dashboard, filter, columns, onLink }: FilterReachNoteProps) {
  const { reached, missed, total } = filterReach(dashboard, filter)
  if (total === 0) return null
  const labels = new Map(listDatasets(dashboard).map((dataset) => [dataset.key, dataset.label]))
  const missedByDataset = new Map<string, number>()
  for (const item of missed) {
    const key = itemDatasetKey(item) ?? ''
    missedByDataset.set(key, (missedByDataset.get(key) ?? 0) + 1)
  }
  const linked = reached.filter((target) => target.linked)
  const linkedCount = linked.length
  const linkedTargets = new Map(linked.map((target) => [target.datasetKey, target.column]))
  const gaps = [...linkedTargets].flatMap(([datasetKey, column]) => {
    const values = findFilterColumn(columns, { datasetKey, column })?.values ?? []
    const absent = filter.values.filter((value) => !values.includes(value))
    return absent.length ? [{ datasetKey, absent }] : []
  })

  return (
    <div className="mb-1 flex flex-col gap-1 border-b border-white/10 px-2 pt-0.5 pb-2 text-xs text-white/60">
      <p className="text-white/80">
        Applies to {reached.length} of {total} {total === 1 ? 'graph' : 'graphs'} on this page
        {linkedCount > 0 && <span className="text-white/50"> · {linkedCount} via linked fields</span>}
      </p>
      {[...missedByDataset].map(([datasetKey, count]) => (
        <div key={datasetKey || 'none'} className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate">
            Doesn't reach {datasetKey ? labels.get(datasetKey) : 'graphs without a dataset'} · {count === 1 ? '1 graph' : `${count} graphs`}
          </span>
          {datasetKey && onLink && (
            <button type="button" onClick={() => onLink(datasetKey)} className="flex shrink-0 cursor-pointer items-center gap-1 rounded px-1 py-0.5 text-white/75 hover:bg-white/10 hover:text-white">
              <Link2 className="size-3" aria-hidden />
              Link a field
            </button>
          )}
        </div>
      ))}
      {gaps.map(({ datasetKey, absent }) => (
        <p key={datasetKey} className="text-amber-200/80">
          {absent.join(', ')} {absent.length === 1 ? "isn't" : "aren't"} in {labels.get(datasetKey)}, so those graphs show no rows for {absent.length === 1 ? 'it' : 'them'}.
        </p>
      ))}
    </div>
  )
}
