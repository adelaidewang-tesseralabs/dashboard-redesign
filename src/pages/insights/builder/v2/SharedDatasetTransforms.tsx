import { useState } from 'react'
import { ChevronDown, ChevronRight, Users } from 'lucide-react'
import type { Dashboard } from '../../../../data/dashboards'
import { runSql } from '../../../../data/dataSources'
import { EMPTY_TRANSFORMS, transformCount, type DatasetTransforms } from '../../../../data/transforms'
import { Button } from '../../../../ui/Button'
import { displayTitle, itemLabel } from '../canvasItems'
import { datasetSql, datasetUsage, type Dataset } from './datasets'
import { BreakageAlert } from './transforms/BreakageAlert'
import { graphsBrokenBy } from './transforms/graphBreakage'
import { sameTransforms, type TransformDrafts } from './transforms/transformDrafts'
import { TransformsPanel } from './transforms/TransformsPanel'
import { useApplyTransforms } from './transforms/useApplyTransforms'

type SharedDatasetTransformsProps = {
  dashboard: Dashboard
  dataset: Dataset
  /** The builder's drafts, so unapplied Data tab edits show here too. */
  transformDrafts: TransformDrafts
}

/**
 * Final builder: the dataset's own transforms in the graph panel. Edits apply as they're made, like the panel's other
 * controls; they change every graph on the dataset, so the panel says which and flags the ones that stop working.
 */
export function SharedDatasetTransforms({ dashboard, dataset, transformDrafts }: SharedDatasetTransformsProps) {
  const [open, setOpen] = useState(false)
  // Transforms when the section opened: graphs that worked then and fail now are the ones these edits broke.
  const [baseline, setBaseline] = useState<DatasetTransforms | undefined>()
  const apply = useApplyTransforms(dashboard, transformDrafts)
  const usedIn = datasetUsage(dashboard.widgets ?? [], dataset.key)
  const applied = dashboard.datasetTransforms?.[dataset.key]
  const draft = transformDrafts.drafts[dataset.key]
  const pending = draft && !sameTransforms(draft, applied) ? draft : undefined
  const working = pending ?? applied
  const total = transformCount(working)
  const Chevron = open ? ChevronDown : ChevronRight
  const broken = pending
    ? graphsBrokenBy(dashboard, dataset.key, pending, usedIn)
    : graphsBrokenBy({ ...dashboard, datasetTransforms: { ...dashboard.datasetTransforms, [dataset.key]: baseline ?? EMPTY_TRANSFORMS } }, dataset.key, applied ?? EMPTY_TRANSFORMS, usedIn)

  const toggle = () => {
    if (!open) setBaseline(applied)
    setOpen(!open)
  }
  const edit = (next: DatasetTransforms) => {
    if (pending) return transformDrafts.setDraft(dataset.key, sameTransforms(next, applied) ? null : next)
    apply(dataset.key, dataset.label, next, { silent: true })
  }

  return (
    <section className="flex flex-col border-b border-white/10">
      <button type="button" aria-expanded={open} onClick={toggle} className="flex cursor-pointer items-center gap-2 px-4 py-4 text-left">
        <Chevron className="size-4 shrink-0 text-white/55" />
        <span className="flex-1 text-sm font-semibold text-white">Group rows by (dataset)</span>
        {total > 0 && <span className="text-xs text-white/45">{total}</span>}
        {pending && <span aria-label="Unapplied changes" className="size-1.5 rounded-full bg-amber-300" />}
      </button>
      {open && (
        <>
          <div className="mx-4 mb-3 flex flex-col gap-2">
            <div role="note" className="flex flex-col gap-1 rounded-lg border border-sky-300/25 bg-sky-400/10 px-3 py-2 text-xs text-sky-100">
              <span className="flex items-center gap-1.5 font-medium">
                <Users className="size-3.5 shrink-0" />
                Shared dataset, used by {usedIn.length === 1 ? '1 graph' : `${usedIn.length} graphs`}. Changes update all of them.
              </span>
              <span className="text-sky-100/75">{usedIn.map((item) => displayTitle(item) || itemLabel(item)).join(', ')}</span>
            </div>
            {pending && (
              <div role="status" className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/70">
                <span className="size-1.5 shrink-0 rounded-full bg-amber-300" />
                <span className="flex-1">Unapplied changes from the Data tab</span>
                <Button variant="ghost" size="xs" onClick={() => transformDrafts.setDraft(dataset.key, null)}>
                  Discard
                </Button>
                <Button size="xs" onClick={() => apply(dataset.key, dataset.label, pending)}>
                  Apply
                </Button>
              </div>
            )}
            <BreakageAlert breaks={broken} stopped={!pending} />
          </div>
          <TransformsPanel source={runSql(datasetSql(dataset))} transforms={working} onChange={edit} rowLimit={false} />
        </>
      )}
    </section>
  )
}
