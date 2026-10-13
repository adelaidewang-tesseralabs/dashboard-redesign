import type { LucideIcon } from 'lucide-react'
import { cn } from '../lib/cn'

export type PanelTab<T extends string> = { id: T; label: string; Icon?: LucideIcon }

type PanelTabsProps<T extends string> = {
  tabs: PanelTab<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

/** Segmented tab strip — `DHTabsLayout` list + `PanelTabTrigger` styling. */
export function PanelTabs<T extends string>({ tabs, value, onChange, className }: PanelTabsProps<T>) {
  return (
    <div role="tablist" className={cn('inline-flex w-fit gap-1 rounded-md bg-tlai-3 p-1', className)}>
      {tabs.map((tab) => {
        const active = tab.id === value
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex cursor-pointer items-center gap-2 rounded-md border px-4 py-1 text-sm font-medium text-white transition-colors',
              active ? 'border-white/15 bg-white/5 hover:bg-white/15' : 'border-transparent hover:bg-white/10',
            )}
          >
            {tab.Icon && <tab.Icon className="size-4" />}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
