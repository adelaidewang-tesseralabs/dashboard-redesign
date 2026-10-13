import { TriangleAlert } from 'lucide-react'
import { cn } from '../../../../../lib/cn'
import { Button } from '../../../../../ui/Button'
import type { GraphBreak } from './graphBreakage'

type ApplyBarProps = {
  breaks: GraphBreak[]
  graphCount: number
  onDiscard: () => void
  onApply: () => void
  className?: string
}

/** Unapplied dataset transforms: what would break, then Discard or Apply to the graphs built on the dataset. */
export function ApplyBar({ breaks, graphCount, onDiscard, onApply, className }: ApplyBarProps) {
  const applyLabel = graphCount === 0 ? 'Apply' : graphCount === 1 ? 'Apply to graph' : `Apply to ${graphCount} graphs`
  return (
    <div className={cn('flex shrink-0 flex-col gap-2.5 border-t border-white/10 bg-tlai-2 p-3', className)}>
      {breaks.length > 0 && (
        <div role="alert" className="flex flex-col gap-1 rounded-lg border border-amber-300/25 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
          <span className="flex items-center gap-1.5 font-medium">
            <TriangleAlert className="size-3.5 shrink-0" />
            {breaks.length === 1 ? '1 graph will stop working' : `${breaks.length} graphs will stop working`}
          </span>
          <ul className="flex flex-col gap-0.5 text-amber-100/75">
            {breaks.map((graph) => (
              <li key={graph.itemId}>
                <span className="text-amber-100">{graph.title}</span>: {graph.error}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex items-center gap-2">
        <span className="flex flex-1 items-center gap-1.5 text-xs text-white/60">
          <span className="size-1.5 rounded-full bg-amber-300" />
          Unapplied changes
        </span>
        <Button variant="ghost" size="sm" onClick={onDiscard}>
          Discard
        </Button>
        <Button size="sm" onClick={onApply}>
          {applyLabel}
        </Button>
      </div>
    </div>
  )
}
