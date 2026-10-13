import type { LucideIcon } from 'lucide-react'
import { cn } from '../lib/cn'

type ViewToggleProps<T extends string> = {
  options: { id: T; label: string; Icon: LucideIcon }[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
}

/** Icon-only segmented switch for list layouts (grid / table). */
export function ViewToggle<T extends string>({ options, value, onChange, ariaLabel }: ViewToggleProps<T>) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="flex shrink-0 items-center gap-0.5 rounded-lg border border-white/10 p-0.5">
      {options.map(({ id, label, Icon }) => {
        const active = id === value
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={label}
            title={label}
            onClick={() => onChange(id)}
            className={cn(
              'flex size-7 cursor-pointer items-center justify-center rounded-md border border-transparent text-white/50 transition-colors hover:bg-white/10 hover:text-white',
              active && 'border-white/15 bg-white/10 text-white',
            )}
          >
            <Icon className="size-3.5" />
          </button>
        )
      })}
    </div>
  )
}
