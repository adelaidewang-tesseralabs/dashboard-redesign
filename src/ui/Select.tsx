import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '../lib/cn'
import { menuGroupLabelClass, menuItemClass, menuSurfaceClass } from './menuStyles'

export type SelectOption = {
  value: string
  label: string
  description?: string
  icon?: ReactNode
  /** Consecutive options sharing a group render under one heading. */
  group?: string
  disabled?: boolean
}

type SelectProps = {
  'aria-label': string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  /** `compact` (h-8, 13px) is the main app's default; `form` (h-9, 14px) is for dialog forms. */
  size?: 'compact' | 'form'
}

type PopupPosition = { left: number; width: number; top?: number; bottom?: number; maxHeight: number }

const GAP = 4
const EDGE = 8
const MIN_WIDTH = 144

/** Single-value select styled after the main app's modus `Select` (trigger, elevated popup, checkmark rows). */
export function Select({ value, options, onChange, placeholder = 'Select…', disabled = false, size = 'compact', ...props }: SelectProps) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [position, setPosition] = useState<PopupPosition | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const selected = options.find((option) => option.value === value)

  const close = (refocus = true) => {
    setOpen(false)
    if (refocus) triggerRef.current?.focus()
  }
  const openPopup = () => {
    if (disabled) return
    setActive(Math.max(0, options.findIndex((option) => option.value === value)))
    setOpen(true)
  }
  const choose = (option: SelectOption) => {
    if (option.disabled) return
    onChange(option.value)
    close()
  }

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const below = window.innerHeight - rect.bottom - GAP - EDGE
    const above = rect.top - GAP - EDGE
    const width = Math.max(rect.width, MIN_WIDTH)
    const left = Math.min(rect.left, window.innerWidth - width - EDGE)
    setPosition(
      below >= 240 || below >= above
        ? { left, width, top: rect.bottom + GAP, maxHeight: below }
        : { left, width, bottom: window.innerHeight - rect.top + GAP, maxHeight: above },
    )
  }, [open])

  useLayoutEffect(() => {
    if (open && position) popupRef.current?.focus()
  }, [open, position])

  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node
      if (!popupRef.current?.contains(target) && !triggerRef.current?.contains(target)) close(false)
    }
    const onScroll = (event: Event) => {
      if (!popupRef.current?.contains(event.target as Node)) close(false)
    }
    const onResize = () => close(false)
    document.addEventListener('mousedown', onPointer)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
    }
  }, [open])

  useEffect(() => {
    if (open) popupRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  const step = (direction: 1 | -1) =>
    setActive((current) => {
      for (let index = current + direction; index >= 0 && index < options.length; index += direction) {
        if (!options[index].disabled) return index
      }
      return current
    })
  const onListKeyDown = (event: KeyboardEvent) => {
    const keys: Record<string, () => void> = {
      ArrowDown: () => step(1),
      ArrowUp: () => step(-1),
      Enter: () => options[active] && choose(options[active]),
      ' ': () => options[active] && choose(options[active]),
      Escape: () => close(),
      Tab: () => close(false),
    }
    const handler = keys[event.key]
    if (!handler) return
    if (event.key !== 'Tab') event.preventDefault()
    event.stopPropagation()
    handler()
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={props['aria-label']}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        disabled={disabled}
        onClick={() => (open ? close() : openPopup())}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            openPopup()
          }
        }}
        className={cn(
          'flex w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-[5px] border border-input bg-input/30 px-2.5 font-normal text-white outline-none hover:bg-input/50 focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          size === 'compact' ? 'h-8 text-[13px]' : 'h-9 text-sm',
          open && 'bg-input/50',
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          {selected?.icon && <OptionIcon>{selected.icon}</OptionIcon>}
          <span className={cn('truncate', !selected && 'text-muted-foreground')}>{selected?.label ?? placeholder}</span>
        </span>
        <ChevronDown aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
      </button>
      {open &&
        position &&
        createPortal(
          <div
            ref={popupRef}
            id={listId}
            role="listbox"
            tabIndex={-1}
            aria-label={props['aria-label']}
            aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
            onKeyDown={onListKeyDown}
            style={{ left: position.left, width: position.width, top: position.top, bottom: position.bottom, maxHeight: position.maxHeight }}
            className={cn(menuSurfaceClass, 'fixed z-[60] overflow-y-auto')}
          >
            {options.map((option, index) => (
              <div key={option.value}>
                {option.group && option.group !== options[index - 1]?.group && (
                  <div className={cn(menuGroupLabelClass, index > 0 && 'mt-1')}>{option.group}</div>
                )}
                <div
                  id={`${listId}-${index}`}
                  data-index={index}
                  role="option"
                  aria-selected={option.value === value}
                  aria-disabled={option.disabled}
                  onMouseEnter={() => !option.disabled && setActive(index)}
                  onClick={() => choose(option)}
                  className={cn(
                    menuItemClass,
                    'relative pr-10 hover:bg-transparent',
                    index === active && 'bg-white/10',
                    option.description && 'h-auto min-h-12 py-2',
                    option.disabled && 'pointer-events-none opacity-50',
                  )}
                >
                  <span className="flex min-w-0 flex-1 items-center gap-3">
                    {option.icon && <OptionIcon>{option.icon}</OptionIcon>}
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate">{option.label}</span>
                      {option.description && <span className="text-[11px] leading-4 text-muted-foreground">{option.description}</span>}
                    </span>
                  </span>
                  {option.value === value && <Check aria-hidden className="absolute right-2 size-4" />}
                </div>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </>
  )
}

function OptionIcon({ children }: { children: ReactNode }) {
  return <span className="flex size-4 shrink-0 items-center justify-center [&_svg]:size-4 [&_svg]:stroke-[1.5]">{children}</span>
}
