import { ArrowLeft } from 'lucide-react'
import { Button } from '../../../../ui/Button'

/** Floats over the Data tab after "View dataset" from a graph, back to that graph on the canvas. */
export function BackToDashboardPill({ onBack }: { onBack: () => void }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-6 z-40 flex justify-center">
      <Button onClick={onBack} className="pointer-events-auto rounded-full pr-5 pl-4 shadow-xl">
        <ArrowLeft className="size-4" />
        Back to dashboard
      </Button>
    </div>
  )
}
