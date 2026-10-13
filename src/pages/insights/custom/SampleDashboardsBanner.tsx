import { Sparkles } from 'lucide-react'

export function SampleDashboardsBanner() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-tlai-3 p-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-tlai-mint/10 text-tlai-mint">
        <Sparkles className="size-4" />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="text-sm font-medium text-white">Start with a sample</p>
        <p className="text-xs text-white/60">
          Open one to explore scores and graphs, or edit it to try things out. Samples hide once you create your own.
        </p>
      </div>
    </div>
  )
}
