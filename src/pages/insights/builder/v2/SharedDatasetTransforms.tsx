import { useState } from 'react'
import { ChevronDown, ChevronRight, Users } from 'lucide-react'
import type { Dashboard } from '../../../../data/dashboards'
import { runSql } from '../../../../data/dataSources'
import { transformCount } from '../../../../data/transforms'
import { displayTitle, itemLabel } from '../canvasItems'
import { datasetSql, datasetUsage, type Dataset } from './datasets'
import { ApplyBar } from './transforms/ApplyBar'
import { graphsBrokenBy } from './transforms/graphBreakage'
import { sameTransforms, type TransformDrafts } from './transforms/transformDrafts'
import { TransformsPanel } from './transforms/TransformsPanel'
import { useApplyTransforms } from './transforms/useApplyTransforms'

type SharedDatasetTransformsProps = {
  dashboard: Dashboard
  dataset: Dataset
  /** The builder's drafts, so an edit here also shows as unapplied in the Data tab and the other way round. */
  transformDrafts: TransformDrafts
}

/** Final builder: the dataset's own transforms in the graph panel. They change every graph on the dataset, so the panel says which. */
export function SharedDatasetTransforms({ dashboard, dataset, transformDrafts }: SharedDatasetTransformsProps) {
  const [open, setOpen] = useState(false)
  const apply = useApplyTransforms(dashboard, transformDrafts)
  const usedIn = datasetUsage(dashboard.widgets ?? [], dataset.key)
  const applied = dashboard.datasetTransforms?.[dataset.key]
  const draft = transformDrafts.drafts[dataset.key]
  const working = draft ?? applied
  const pending = draft && !sameTransforms(draft, applied) ? draft : undefined
  const total = transformCount(working)
  const Chevron = open ? ChevronDown : ChevronRight

  return (
    <section className="flex flex-col border-b border-white/10">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex cursor-pointer items-center gap-2 px-4 py-4 text-left">
        <Chevron className="size-4 shrink-0 text-white/55" />
        <span className="flex-1 text-sm font-semibold text-white">Group rows by (dataset)</span>
        {total > 0 && <span className="text-xs text-white/45">{total}</span>}
        {pending && <span aria-label="Unapplied changes" className="size-1.5 rounded-full bg-amber-300" />}
      </button>
      {open && (
        <>
          <div role="note" className="mx-4 mb-3 flex flex-col gap-1 rounded-lg border border-sky-300/25 bg-sky-400/10 px-3 py-2 text-xs text-sky-100">
            <span className="flex items-center gap-1.5 font-medium">
              <Users className="size-3.5 shrink-0" />
              Shared dataset, used by {usedIn.length === 1 ? '1 graph' : `${usedIn.length} graphs`}. Changes update all of them.
            </span>
            <span className="text-sky-100/75">{usedIn.map((item) => displayTitle(item) || itemLabel(item)).join(', ')}</span>
          </div>
          <TransformsPanel
            source={runSql(datasetSql(dataset))}
            transforms={working}
            onChange={(next) => transformDrafts.setDraft(dataset.key, sameTransforms(next, applied) ? null : next)}
            rowLimit={false}
          />
          {pending && (
            <ApplyBar
              breaks={graphsBrokenBy(dashboard, dataset.key, pending, usedIn)}
              graphCount={usedIn.length}
              onDiscard={() => transformDrafts.setDraft(dataset.key, null)}
              onApply={() => apply(dataset.key, dataset.label, pending)}
            />
          )}
        </>
      )}
    </section>
  )
}
