import { useEffect, useRef, type ReactNode } from 'react'
import { ListFilter } from 'lucide-react'
import { cn } from '../../../../lib/cn'
import { filterChipClass } from '../FilterChip'

type DatasetFilterButtonProps = {
  label: string
  /** Fields with a pick. */
  activeCount: number
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}

/** One per dataset, like the main app's FilterBuilderSelect trigger: an outline button with the dataset's name and how many fields narrow it. */
export function DatasetFilterButton({ label, activeCount, open, onOpenChange, children }: DatasetFilterButtonProps) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onMouseDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) onOpenChange(false)
    }
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onOpenChange(false)
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onOpenChange])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
        className={cn(filterChipClass, 'font-medium', open && 'border-[var(--dash-faint)]')}
      >
        <ListFilter className="size-3.5 opacity-70" aria-hidden />
        {label}
        {activeCount > 0 && <span className="rounded-md bg-[var(--dash-canvas)] px-1.5 text-[11px] tabular-nums">{activeCount}</span>}
      </button>
      {open && <div className="absolute top-full left-0 z-40 mt-2 shadow-xl shadow-black/40">{children}</div>}
    </div>
  )
}
