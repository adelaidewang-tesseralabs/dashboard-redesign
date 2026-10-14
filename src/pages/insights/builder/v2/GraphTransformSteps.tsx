import type { ReactNode } from 'react'
import { TransformSection } from './transforms/TransformSection'

type GraphTransformStepsProps = {
  calculations: ReactNode
  filters: ReactNode
  shape: ReactNode
  /** Shown beside each step's chevron, e.g. "2 filters". */
  summaries: { calculations?: string; filters?: string; shape?: string }
}

/** Final builder: a graph's own data steps, named, numbered and tinted like the dataset's in the Data tab. */
export function GraphTransformSteps({ calculations, filters, shape, summaries }: GraphTransformStepsProps) {
  return (
    <div className="flex flex-col">
      <TransformSection
        step={1}
        title="Calculations"
        description="Derived columns for this graph only"
        summary={summaries.calculations}
        accentClass="bg-tlai-mint/15 text-tlai-mint"
      >
        {calculations}
      </TransformSection>
      <TransformSection
        step={2}
        title="Filters"
        description="Row conditions for this graph only. Preset and dataset filters also apply."
        summary={summaries.filters}
        accentClass="bg-sky-300/15 text-sky-300"
      >
        {filters}
      </TransformSection>
      <TransformSection
        step={3}
        title="Result shape"
        description="Grouping, value, ordering and limit for this graph"
        summary={summaries.shape}
        accentClass="bg-violet-300/15 text-violet-300"
      >
        <div className="flex flex-col gap-4">{shape}</div>
      </TransformSection>
    </div>
  )
}
