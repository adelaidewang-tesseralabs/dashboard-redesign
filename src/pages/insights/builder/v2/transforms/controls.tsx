import type { ReactNode } from 'react'
import { Plus, X } from 'lucide-react'
import type { ColumnType } from '../../../../../data/transforms'
import { cn } from '../../../../../lib/cn'

export type TransformColumn = { key: string; type: ColumnType }

export const fieldInputClass =
  'h-8 w-full rounded-[5px] border border-input bg-input/30 px-2.5 font-mono text-[13px] text-white outline-none placeholder:font-sans placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring'

/** Fixed-width slot so selects, which fill their parent, line up row to row. */
export function Slot({ className, children }: { className: string; children: ReactNode }) {
  return <div className={cn('shrink-0', className)}>{children}</div>
}

export function TransformRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-2.5">{children}</div>
}

export function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="ml-auto flex size-7 cursor-pointer items-center justify-center rounded-md text-white/40 hover:bg-white/10 hover:text-white"
    >
      <X className="size-4" />
    </button>
  )
}

export function AddRowButton({ label, disabled, onClick }: { label: string; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-white/15 px-3 text-sm text-white/45 hover:border-white/30 hover:text-white/75 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Plus className="size-4" />
      {label}
    </button>
  )
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="text-xs text-white/50">{children}</span>
}

export const columnOptions = (columns: TransformColumn[]) => columns.map((column) => ({ value: column.key, label: column.key }))

/** Keeps a stale key (its column was transformed away) listed so it stays visible and re-pickable. */
export function withCurrent(options: { value: string; label: string }[], current: string | undefined) {
  return current && !options.some((option) => option.value === current) ? [{ value: current, label: current }, ...options] : options
}
