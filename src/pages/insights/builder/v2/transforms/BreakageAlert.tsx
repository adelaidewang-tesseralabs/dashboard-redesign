import { TriangleAlert } from 'lucide-react'
import type { GraphBreak } from './graphBreakage'

type BreakageAlertProps = { breaks: GraphBreak[]; stopped?: boolean }

/** The graphs a dataset change breaks, with why. `stopped` once the change is applied rather than pending. */
export function BreakageAlert({ breaks, stopped }: BreakageAlertProps) {
  if (breaks.length === 0) return null
  const count = breaks.length === 1 ? '1 graph' : `${breaks.length} graphs`
  return (
    <div role="alert" className="flex flex-col gap-1 rounded-lg border border-amber-300/25 bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
      <span className="flex items-center gap-1.5 font-medium">
        <TriangleAlert className="size-3.5 shrink-0" />
        {stopped ? `${count} stopped working` : `${count} will stop working`}
      </span>
      <ul className="flex flex-col gap-0.5 text-amber-100/75">
        {breaks.map((graph) => (
          <li key={graph.itemId}>
            <span className="text-amber-100">{graph.title}</span>: {graph.error}
          </li>
        ))}
      </ul>
    </div>
  )
}
