import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Check } from 'lucide-react'
import { cn } from '../lib/cn'
import { menuGroupLabelClass, menuItemClass, menuSurfaceClass } from './menuStyles'

export type MenuItem = {
  type?: 'item'
  label: string
  Icon?: LucideIcon
  onSelect: () => void
  danger?: boolean
  active?: boolean
}

export type MenuEntry = MenuItem | { type: 'separator' } | { type: 'label'; label: string }

type MenuProps = {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode
  items: MenuEntry[]
  align?: 'start' | 'end'
  side?: 'top' | 'bottom'
  className?: string
}

export function Menu({ trigger, items, align = 'end', side = 'bottom', className }: MenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      {trigger({ open, toggle: () => setOpen((current) => !current) })}
      {open && (
        <div
          role="menu"
          className={cn(
            menuSurfaceClass,
            'absolute z-40 min-w-44',
            side === 'bottom' ? 'top-full mt-1' : 'bottom-full mb-2',
            align === 'end' ? 'right-0' : 'left-0',
          )}
        >
          {items.map((item, index) => {
            if (item.type === 'separator') {
              return <div key={`sep-${index}`} role="separator" className="my-1.5 h-px bg-white/10" />
            }
            if (item.type === 'label') {
              return (
                <div key={`label-${item.label}`} className={menuGroupLabelClass}>
                  {item.label}
                </div>
              )
            }
            return (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={(event) => {
                  event.stopPropagation()
                  setOpen(false)
                  item.onSelect()
                }}
                className={cn(menuItemClass, 'relative pr-10', item.danger && 'text-red-300 hover:bg-red-500/10')}
              >
                {item.Icon && <item.Icon className="size-4 stroke-[1.5]" />}
                <span className="truncate">{item.label}</span>
                {item.active && <Check aria-hidden className="absolute right-2 size-4" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
