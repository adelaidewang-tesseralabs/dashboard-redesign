import { ArrowLeft, X } from 'lucide-react'
import { cn } from '../../../../lib/cn'

/** Marks the pill so a dismiss-on-interaction listener can tell clicks on it apart from everything else. */
export const BACK_PILL_ATTR = 'data-back-pill'

type BackPillProps = { label: string; onBack: () => void; onDismiss?: () => void }

/** A floating "Back to …" link after jumping between the canvas and the Data tab. */
export function BackPill({ label, onBack, onDismiss }: BackPillProps) {
  return (
    <div {...{ [BACK_PILL_ATTR]: '' }} className="pointer-events-auto flex items-center rounded-full bg-white text-sm text-black shadow-xl">
      <button
        type="button"
        onClick={onBack}
        className={cn('flex h-9 cursor-pointer items-center gap-2 rounded-full pl-4 hover:bg-black/5', onDismiss ? 'pr-2' : 'pr-5')}
      >
        <ArrowLeft className="size-4" />
        {label}
      </button>
      {onDismiss && (
        <button type="button" aria-label="Dismiss" title="Dismiss" onClick={onDismiss} className="mr-1 flex size-7 cursor-pointer items-center justify-center rounded-full text-black/60 hover:bg-black/10 hover:text-black">
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}
