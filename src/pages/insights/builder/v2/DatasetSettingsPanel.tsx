import { useEffect, useState } from 'react'
import { ArrowLeft, Users } from 'lucide-react'
import type { Dashboard } from '../../../../data/dashboards'
import { runSql } from '../../../../data/dataSources'
import { EMPTY_TRANSFORMS, type DatasetTransforms } from '../../../../data/transforms'
import { Button } from '../../../../ui/Button'
import { displayTitle, itemLabel } from '../canvasItems'
import { datasetSql, datasetUsage, type Dataset } from './datasets'
import { BreakageAlert } from './transforms/BreakageAlert'
import { graphsBrokenBy } from './transforms/graphBreakage'
import { sameTransforms, type TransformDrafts } from './transforms/transformDrafts'
import { TransformsPanel } from './transforms/TransformsPanel'
import { useApplyTransforms } from './transforms/useApplyTransforms'

type DatasetSettingsPanelProps = {
  dashboard: Dashboard
  dataset: Dataset
  /** The builder's drafts, so unapplied Data tab edits show here too. */
  transformDrafts: TransformDrafts
  onBack: () => void
}

/**
 * Final builder: the shared dataset's settings, over the whole graph panel so it's clear they're no longer this graph's.
 * Edits apply as they're made, like the panel's other controls, and flag the graphs they break.
 */
export function DatasetSettingsPanel({ dashboard, dataset, transformDrafts, onBack }: DatasetSettingsPanelProps) {
  const applied = dashboard.datasetTransforms?.[dataset.key]
  // Transforms when the panel opened: graphs that worked then and fail now are the ones these edits broke.
  const [baseline] = useState<DatasetTransforms>(applied ?? EMPTY_TRANSFORMS)
  const apply = useApplyTransforms(dashboard, transformDrafts)
  const usedIn = datasetUsage(dashboard.widgets ?? [], dataset.key)
  const draft = transformDrafts.drafts[dataset.key]
  const pending = draft && !sameTransforms(draft, applied) ? draft : undefined
  const broken = pending
    ? graphsBrokenBy(dashboard, dataset.key, pending, usedIn)
    : graphsBrokenBy({ ...dashboard, datasetTransforms: { ...dashboard.datasetTransforms, [dataset.key]: baseline } }, dataset.key, applied ?? EMPTY_TRANSFORMS, usedIn)

  // Capture phase, so Escape steps back one level instead of also reaching the builder's deselect-graph listener.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || (event.target instanceof Element && event.target.closest('input, textarea, [role="listbox"], [role="menu"]'))) return
      event.stopPropagation()
      onBack()
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [onBack])

  const edit = (next: DatasetTransforms) => {
    if (pending) return transformDrafts.setDraft(dataset.key, sameTransforms(next, applied) ? null : next)
    apply(dataset.key, dataset.label, next, { silent: true })
  }

  return (
    <div role="region" aria-label="Dataset settings" className="absolute inset-0 z-20 flex flex-col bg-tlai-1 text-sm">
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-white/10 px-2">
        <button
          type="button"
          aria-label="Back to graph settings"
          title="Back to graph settings"
          onClick={onBack}
          className="flex size-7 cursor-pointer items-center justify-center rounded-md text-white/60 hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="size-4" />
        </button>
        <span className="font-medium text-white">Dataset settings</span>
        <span className="min-w-0 truncate text-xs text-white/50">{dataset.label}</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex flex-col gap-2 px-4 pt-4 pb-1">
          <div role="note" className="flex flex-col gap-1 rounded-lg border border-sky-300/25 bg-sky-400/10 px-3 py-2 text-xs text-sky-100">
            <span className="flex items-center gap-1.5 font-medium">
              <Users className="size-3.5 shrink-0" />
              Shared by {usedIn.length === 1 ? '1 graph' : `${usedIn.length} graphs`}. Changes update all of them.
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
        <TransformsPanel source={runSql(datasetSql(dataset))} transforms={pending ?? applied} onChange={edit} rowLimit={false} />
      </div>
    </div>
  )
}
