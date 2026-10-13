import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../../../../lib/cn'

type TransformSectionProps = {
  title: string
  description: string
  /** Shown beside the chevron, e.g. "2 filters". */
  summary?: string
  accentClass: string
  children: ReactNode
}

/** Collapsible card with a colored accent edge, after production's graph-setup `CollapsibleSection`. */
export function TransformSection({ title, description, summary, accentClass, children }: TransformSectionProps) {
  const [open, setOpen] = useState(true)
  return (
    <section aria-label={title} className={cn('rounded-xl border border-l-2 border-white/10 bg-tlai-2', accentClass)}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-sm font-semibold text-white">{title}</span>
          <span className="text-xs text-white/50">{description}</span>
        </span>
        {summary && <span className="pt-0.5 text-xs text-white/55">{summary}</span>}
        <ChevronDown className={cn('mt-0.5 size-4 shrink-0 text-white/50 transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="flex flex-col gap-2 px-4 pb-4">{children}</div>}
    </section>
  )
}
