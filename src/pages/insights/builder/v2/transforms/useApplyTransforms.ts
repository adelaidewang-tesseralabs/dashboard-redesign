import type { Dashboard } from '../../../../../data/dashboards'
import { useDashboards } from '../../../../../data/DashboardsStore'
import { transformCount, type DatasetTransforms } from '../../../../../data/transforms'
import { isGraph, type GraphItem } from '../../../../../data/widgets'
import { useToast } from '../../../../../ui/Toast'
import { datasetUsage } from '../datasets'
import type { TransformDrafts } from './transformDrafts'

/** Graph conditions moved up to the dataset keep their id, so once the dataset carries one the graph's own copy goes. */
function withoutMovedFilters(graphs: GraphItem[], transforms: DatasetTransforms): GraphItem[] {
  const moved = new Set(transforms.filters.map((filter) => filter.id))
  return graphs.flatMap((item) => {
    const own = item.query?.filters ?? []
    const kept = own.filter((filter) => !moved.has(filter.id))
    if (kept.length === own.length) return []
    return [{ ...item, query: { ...item.query, filters: kept.length ? kept : undefined } }]
  })
}

/** Saves a dataset's transforms for every graph built on it and clears its draft; shared by the Data tab and the graph panel. */
export function useApplyTransforms(dashboard: Dashboard, transformDrafts: TransformDrafts) {
  const { setDatasetTransforms, updateWidgets } = useDashboards()
  const toast = useToast()

  /** `silent` skips the toast, for edits that apply as they're made. */
  return (datasetKey: string, datasetLabel: string, transforms: DatasetTransforms, { silent = false } = {}) => {
    setDatasetTransforms(dashboard.id, datasetKey, transformCount(transforms) > 0 ? transforms : undefined)
    transformDrafts.setDraft(datasetKey, null)
    const graphs = datasetUsage(dashboard.widgets ?? [], datasetKey).filter(isGraph)
    const trimmed = withoutMovedFilters(graphs, transforms)
    if (trimmed.length > 0) updateWidgets(dashboard.id, trimmed)
    if (!silent) toast(graphs.length === 0 ? `Transforms saved to ${datasetLabel}` : `Applied to ${graphs.length === 1 ? '1 graph' : `${graphs.length} graphs`}`)
  }
}
