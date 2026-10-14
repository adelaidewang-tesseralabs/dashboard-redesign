import { useState, type ReactNode } from 'react'
import { ChevronDown, Info } from 'lucide-react'
import { cn } from '../../../../../lib/cn'

type TransformSectionProps = {
  /** Position in the pipeline; each step runs on the previous step's output. */
  step: number
  title: string
  /** Shown as a tooltip on the info icon. */
  description: string
  /** Shown beside the chevron, e.g. "2 filters". */
  summary?: string
  /** Tints the step number, e.g. `bg-tlai-mint/15 text-tlai-mint`. */
  accentClass: string
  children: ReactNode
}

/** Flat collapsible step, laid out like the graph settings panel's `EditorSection`. */
export function TransformSection({ step, title, description, summary, accentClass, children }: TransformSectionProps) {
  const [open, setOpen] = useState(true)
  const toggle = () => setOpen((current) => !current)
  return (
    <section aria-label={title} className="border-b border-white/10">
      <div className="flex items-center gap-2 py-3 pr-3 pl-4">
        <button type="button" aria-expanded={open} onClick={toggle} className="flex cursor-pointer items-center gap-2 text-left">
          <span className={cn('flex size-5 items-center justify-center rounded text-[11px] font-medium tabular-nums', accentClass)}>{step}</span>
          <span className="text-sm font-semibold text-white">{title}</span>
        </button>
        <button type="button" aria-label={description} className="flex size-5 cursor-help items-center justify-center rounded text-white/40 hover:text-white/75">
          <Info className="size-3.5" />
        </button>
        <button type="button" tabIndex={-1} aria-hidden onClick={toggle} className="flex min-w-0 flex-1 cursor-pointer items-center justify-end gap-2 self-stretch outline-none">
          {summary && <span className="truncate text-xs text-white/45">{summary}</span>}
          <ChevronDown className={cn('size-4 shrink-0 text-white/50 transition-transform', open && 'rotate-180')} />
        </button>
      </div>
      {open && <div className="flex flex-col gap-2 px-4 pb-4">{children}</div>}
    </section>
  )
}
