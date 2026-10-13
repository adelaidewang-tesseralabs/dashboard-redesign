import type { ButtonHTMLAttributes } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '../lib/cn'

type ToolbarButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  Icon: LucideIcon
  active?: boolean
}

/** Compact text action for list toolbars (Filter, Sort, Archived, Search). */
export function ToolbarButton({ Icon, active, className, children, type = 'button', ...props }: ToolbarButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2 text-xs whitespace-nowrap text-white/70 transition-colors hover:bg-white/10 hover:text-white',
        active && 'bg-white/10 text-white',
        className,
      )}
      {...props}
    >
      <Icon className="size-3.5" />
      {children}
    </button>
  )
}
