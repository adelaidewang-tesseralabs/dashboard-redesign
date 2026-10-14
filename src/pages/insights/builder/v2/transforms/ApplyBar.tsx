import { cn } from '../../../../../lib/cn'
import { Button } from '../../../../../ui/Button'
import { BreakageAlert } from './BreakageAlert'
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
      <BreakageAlert breaks={breaks} />
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
