import { Search, X } from 'lucide-react'
import { cn } from '../lib/cn'

type SearchInputProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  /** `underline` is the production table-toolbar `SearchBox` (loom, KB lists). */
  variant?: 'outlined' | 'underline'
  autoFocus?: boolean
}

const VARIANTS = {
  outlined: 'h-9 rounded-lg border border-white/10 bg-tlai-3 px-3 focus-within:border-white/25',
  underline: 'h-9 border-b border-white/20 px-1 transition-colors hover:border-white/50 focus-within:border-white/50',
} as const

export function SearchInput({ value, onChange, placeholder = 'Search...', className, variant = 'outlined', autoFocus }: SearchInputProps) {
  return (
    <label className={cn('flex min-w-0 items-center gap-2 text-sm', VARIANTS[variant], className)}>
      <Search className="size-4 shrink-0 text-white/40" />
      <input
        value={value}
        autoFocus={autoFocus}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-white outline-none placeholder:text-white/40"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange('')}
          className="flex size-5 shrink-0 cursor-pointer items-center justify-center rounded text-white/40 hover:text-white"
        >
          <X className="size-3.5" />
        </button>
      )}
    </label>
  )
}
