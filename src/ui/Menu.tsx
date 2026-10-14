import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Check, ChevronRight } from 'lucide-react'
import { cn } from '../lib/cn'
import { menuGroupLabelClass, menuItemClass, menuSurfaceClass } from './menuStyles'

export type MenuItem = {
  type?: 'item'
  label: string
  Icon?: LucideIcon
  onSelect: () => void
  danger?: boolean
  active?: boolean
  disabled?: boolean
}

/** Opens a nested list beside the menu on hover or click. */
export type MenuSubmenu = { type: 'submenu'; label: string; Icon?: LucideIcon; items: MenuItem[] }

export type MenuEntry = MenuItem | MenuSubmenu | { type: 'separator' } | { type: 'label'; label: string }

type MenuProps = {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode
  items: MenuEntry[]
  /** With `side="right"`, `start` lines the menu up with the trigger's top and `end` with its bottom. */
  align?: 'start' | 'end'
  /** `right`: beside the trigger, for controls in a vertical rail. */
  side?: 'top' | 'bottom' | 'right'
  className?: string
}

/** Rough submenu width, to decide whether it still fits to the right of the menu. */
const SUBMENU_WIDTH = 200

/** The right edge past which `element` gets cut off: the window, or the nearest scrolling or clipping ancestor (e.g. a canvas beside a side panel). */
function visibleRight(element: HTMLElement) {
  let right = window.innerWidth
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    if (getComputedStyle(parent).overflowX !== 'visible') right = Math.min(right, parent.getBoundingClientRect().right)
  }
  return right
}

export function Menu({ trigger, items, align = 'end', side = 'bottom', className }: MenuProps) {
  const [open, setOpen] = useState(false)
  const [submenu, setSubmenu] = useState<{ label: string; flip: boolean } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const toggle = () => {
    setOpen((current) => !current)
    setSubmenu(null)
  }
  const select = (item: MenuItem) => {
    setOpen(false)
    setSubmenu(null)
    item.onSelect()
  }
  const openSubmenu = (label: string, anchor: HTMLElement) => setSubmenu({ label, flip: anchor.getBoundingClientRect().right + SUBMENU_WIDTH > visibleRight(anchor) })

  const renderItem = (item: MenuItem) => (
    <button
      key={item.label}
      type="button"
      role="menuitem"
      disabled={item.disabled}
      onClick={(event) => {
        event.stopPropagation()
        select(item)
      }}
      className={cn(
        menuItemClass,
        'relative pr-10 disabled:cursor-default disabled:text-white/40 disabled:hover:bg-transparent',
        item.danger && 'text-red-300 hover:bg-red-500/10',
      )}
    >
      {item.Icon && <item.Icon className="size-4 stroke-[1.5]" />}
      <span className="truncate">{item.label}</span>
      {item.active && <Check aria-hidden className="absolute right-2 size-4" />}
    </button>
  )

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      {trigger({ open, toggle })}
      {open && (
        <div
          role="menu"
          className={cn(
            menuSurfaceClass,
            'absolute z-40 min-w-44',
            side === 'right' && cn('left-full ml-2', align === 'end' ? 'bottom-0' : 'top-0'),
            side === 'bottom' && 'top-full mt-1',
            side === 'top' && 'bottom-full mb-2',
            side !== 'right' && (align === 'end' ? 'right-0' : 'left-0'),
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
            if (item.type === 'submenu') {
              const shown = submenu?.label === item.label ? submenu : null
              return (
                <div key={item.label} className="relative" onMouseEnter={(event) => openSubmenu(item.label, event.currentTarget)} onMouseLeave={() => setSubmenu(null)}>
                  <button
                    type="button"
                    role="menuitem"
                    aria-haspopup="menu"
                    aria-expanded={!!shown}
                    onClick={(event) => {
                      event.stopPropagation()
                      if (shown) setSubmenu(null)
                      else openSubmenu(item.label, event.currentTarget)
                    }}
                    className={cn(menuItemClass, 'pr-2', shown && 'bg-white/10')}
                  >
                    {item.Icon && <item.Icon className="size-4 stroke-[1.5]" />}
                    <span className="flex-1 truncate">{item.label}</span>
                    <ChevronRight aria-hidden className="size-4 text-white/50" />
                  </button>
                  {shown && (
                    // Padding instead of margin, so the pointer never leaves the item on its way into the submenu.
                    <div className={cn('absolute -top-2 z-50', shown.flip ? 'right-full pr-1' : 'left-full pl-1')}>
                      <div role="menu" className={cn(menuSurfaceClass, 'min-w-44')}>
                        {item.items.map(renderItem)}
                      </div>
                    </div>
                  )}
                </div>
              )
            }
            return (
              <div key={item.label} onMouseEnter={() => setSubmenu(null)}>
                {renderItem(item)}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
