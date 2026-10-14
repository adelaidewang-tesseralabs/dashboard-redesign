import { ChevronRight, Users } from 'lucide-react'
import type { Dashboard } from '../../../../data/dashboards'
import { datasetUsage, type Dataset } from './datasets'
import { sameTransforms, type TransformDrafts } from './transforms/transformDrafts'
import { transformsSummary } from './transforms/TransformsPanel'

type DatasetSettingsCardProps = { dashboard: Dashboard; dataset: Dataset; transformDrafts: TransformDrafts; onOpen: () => void }

/** Under the dataset picker: what the shared dataset does to its rows, and the way into its settings. */
export function DatasetSettingsCard({ dashboard, dataset, transformDrafts, onOpen }: DatasetSettingsCardProps) {
  const applied = dashboard.datasetTransforms?.[dataset.key]
  const draft = transformDrafts.drafts[dataset.key]
  const pending = !!draft && !sameTransforms(draft, applied)
  const graphCount = datasetUsage(dashboard.widgets ?? [], dataset.key).length

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left hover:border-white/20 hover:bg-white/[0.06]"
    >
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-1.5 text-xs font-medium text-white">
          Dataset settings
          {pending && <span aria-label="Unapplied changes" className="size-1.5 rounded-full bg-amber-300" />}
        </span>
        <span className="truncate text-xs text-white/55">{transformsSummary(applied) ?? 'All rows, no calculations or filters'}</span>
        <span className="flex items-center gap-1 text-[11px] text-white/40">
          <Users className="size-3 shrink-0" aria-hidden />
          Shared by {graphCount === 1 ? '1 graph' : `${graphCount} graphs`}
        </span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-white/45 group-hover:text-white" aria-hidden />
    </button>
  )
}
