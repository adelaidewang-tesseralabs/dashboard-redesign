import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Check, Minus } from 'lucide-react'
import { cn } from '../../../lib/cn'

type EditorSectionProps = { title: string; action?: ReactNode; children?: ReactNode }

export function EditorSection({ title, action, children }: EditorSectionProps) {
  return (
    <section className="flex flex-col gap-2.5 border-b border-white/10 px-4 py-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  )
}

type EditorCheckboxProps = { label: ReactNode; checked: boolean; disabled?: boolean; onChange: (checked: boolean) => void; indeterminate?: boolean }

/** `indeterminate`: some of what it stands for is ticked, e.g. a "Select all" over a partly ticked list. */
export function EditorCheckbox({ label, checked, disabled, onChange, indeterminate = false }: EditorCheckboxProps) {
  const mixed = indeterminate && !checked
  return (
    <label className={cn('flex cursor-pointer items-center gap-2 text-sm text-white/85', disabled && 'cursor-default opacity-60')}>
      <input
        type="checkbox"
        checked={checked}
        aria-checked={mixed ? 'mixed' : checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={cn(
          'flex size-4 items-center justify-center rounded border border-white/30 peer-focus-visible:ring-2 peer-focus-visible:ring-white/40',
          (checked || mixed) && 'border-tlai-mint bg-tlai-mint text-black',
        )}
      >
        {checked && <Check className="size-3" strokeWidth={3} />}
        {mixed && <Minus className="size-3" strokeWidth={3} />}
      </span>
      {label}
    </label>
  )
}

type IconActionProps = { Icon: LucideIcon; label: string; onClick: () => void }

export function IconAction({ Icon, label, onClick }: IconActionProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex size-7 cursor-pointer items-center justify-center rounded-md text-white/60 hover:bg-white/10 hover:text-white"
    >
      <Icon className="size-4" />
    </button>
  )
}

export const editorInputClass =
  'w-full rounded-md border border-input bg-input/30 px-2.5 py-1.5 text-sm text-white outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
