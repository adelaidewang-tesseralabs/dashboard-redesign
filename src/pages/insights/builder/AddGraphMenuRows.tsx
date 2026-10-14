import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Check, ChevronRight } from 'lucide-react'
import { cn } from '../../../lib/cn'
import { menuGroupLabelClass, menuItemClass, menuSurfaceClass } from '../../../ui/menuStyles'

const ROW = menuItemClass

export function SectionLabel({ children }: { children: ReactNode }) {
  return <div className={menuGroupLabelClass}>{children}</div>
}

type SubmenuRowProps = {
  label: string
  /** Muted second line, e.g. where a table lives. */
  hint?: string
  Icon?: LucideIcon
  bold: boolean
  open: boolean
  onOpen: () => void
  side: string
  children: ReactNode
}

type SubmenuButtonProps = Pick<SubmenuRowProps, 'label' | 'hint' | 'Icon' | 'bold' | 'open' | 'onOpen'>

/** A row that opens a submenu; for submenus placed outside the row, e.g. beside a scrolling list. */
export function SubmenuButton({ label, hint, Icon, bold, open, onOpen }: SubmenuButtonProps) {
  return (
    <button
      type="button"
      role="menuitem"
      aria-haspopup="menu"
      aria-expanded={open}
      onMouseEnter={onOpen}
      onClick={onOpen}
      className={cn(ROW, hint && 'h-auto py-1', open && 'bg-white/10 text-white', bold && 'font-semibold')}
    >
      {Icon && <Icon className="size-4 shrink-0 text-white/60" />}
      <span className="min-w-0 flex-1" title={hint ? `${hint}.${label}` : label}>
        <span className="block truncate">{label}</span>
        {hint && <span className="block truncate text-[11px] font-normal text-white/45">{hint}</span>}
      </span>
      <ChevronRight className="size-4 shrink-0 text-white/50" />
    </button>
  )
}

export function SubmenuRow({ label, hint, Icon, bold, open, onOpen, side, children }: SubmenuRowProps) {
  return (
    <div className="relative" onMouseEnter={onOpen}>
      <SubmenuButton label={label} hint={hint} Icon={Icon} bold={bold} open={open} onOpen={onOpen} />
      {open && (
        <div role="menu" aria-label={label} className={cn(menuSurfaceClass, 'absolute left-full z-50 ml-1.5 w-56', side)}>
          {children}
        </div>
      )}
    </div>
  )
}

export function OptionRow({ label, added, onSelect }: { label: string; added: boolean; onSelect: () => void }) {
  return (
    <button type="button" role="menuitem" disabled={added} onClick={onSelect} className={cn(ROW, 'disabled:cursor-default disabled:text-white/40 disabled:hover:bg-transparent')}>
      <span className="flex-1">{label}</span>
      {added && <Check className="size-3.5" aria-label="On the canvas" />}
    </button>
  )
}

type ActionRowProps = { icon: ReactNode; label: string; onHover: () => void; onSelect: () => void }

export function ActionRow({ icon, label, onHover, onSelect }: ActionRowProps) {
  return (
    <button type="button" role="menuitem" onMouseEnter={onHover} onClick={onSelect} className={ROW}>
      {icon}
      <span className="min-w-0 flex-1 truncate" title={label}>
        {label}
      </span>
    </button>
  )
}
