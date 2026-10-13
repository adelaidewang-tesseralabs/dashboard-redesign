import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../lib/cn'

/** Variants copied from the main app's `ui/Button` cva config. */
const VARIANTS = {
  default: 'bg-white text-black shadow-sm hover:bg-white/80',
  outline: 'border border-white/10 bg-tlai-4/60 text-white/80 shadow-xs hover:bg-white/10',
  ghost: 'text-white/80 hover:bg-white/10 hover:text-white',
  destructive: 'bg-red-500 text-white shadow-xs hover:bg-red-500/90',
} as const

const SIZES = {
  default: 'h-9 px-4 py-2',
  sm: 'h-8 px-3 text-xs',
  xs: 'h-6 px-2 text-xs',
  icon: 'size-8',
} as const

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof VARIANTS
  size?: keyof typeof SIZES
}

export function Button({ variant = 'default', size = 'default', className, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg text-sm whitespace-nowrap transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  )
}

/** The bordered square header action used across the dashboard detail top bar. */
export const headerActionClass =
  'flex h-8 shrink-0 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-2 text-xs text-white hover:bg-white/10'
