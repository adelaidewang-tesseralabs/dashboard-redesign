import { useEffect, useId, useLayoutEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../../lib/cn'
import { initialsOf, nameOf } from '../../../lib/people'
import { menuGroupLabelClass, menuItemClass, menuSurfaceClass } from '../../../ui/menuStyles'

type PeoplePickerProps = {
  value: string
  onChange: (value: string) => void
  /** A person was picked from the list, or a typed email was confirmed with Enter or a comma. */
  onCommit: (email: string) => void
  onPaste: (event: ClipboardEvent<HTMLInputElement>) => void
  recent: string[]
  removed: string[]
  suggestions: string[]
  /** Already shared or staged, so never offered. */
  exclude: Set<string>
}

type Option = { user: string; group: string; removed: boolean }
type PopupPosition = { left: number; width: number; top: number; maxHeight: number }

const GAP = 4
const EDGE = 8

/** Dark replacement for the native `<datalist>`: recent searches and removed people when empty, matches as you type. */
export function PeoplePicker({ value, onChange, onCommit, onPaste, recent, removed, suggestions, exclude }: PeoplePickerProps) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [position, setPosition] = useState<PopupPosition | null>(null)
  const fieldRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const query = value.trim().toLowerCase()
  const options = buildOptions(query, recent, removed, suggestions, exclude)
  const visible = open && options.length > 0

  const show = () => {
    setOpen(true)
    setActive(query ? 0 : -1)
  }
  const pick = (user: string) => {
    onCommit(user)
    setActive(-1)
  }

  // No deps on purpose: staging a chip grows the dialog, which re-centers and moves the field.
  useLayoutEffect(() => {
    if (!visible || !fieldRef.current) return
    const rect = fieldRef.current.getBoundingClientRect()
    const next = { left: rect.left, width: rect.width, top: rect.bottom + GAP, maxHeight: window.innerHeight - rect.bottom - GAP - EDGE }
    setPosition((current) => (current && current.left === next.left && current.top === next.top && current.width === next.width ? current : next))
  })

  useEffect(() => {
    if (!visible) return
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node
      if (!popupRef.current?.contains(target) && !fieldRef.current?.contains(target)) setOpen(false)
    }
    const onScroll = (event: Event) => {
      if (!popupRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [visible])

  useEffect(() => {
    if (visible) popupRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [visible, active])

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) return show()
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActive((current) => Math.min(options.length - 1, Math.max(0, current + step)))
    } else if (event.key === 'Enter' && visible && options[active]) {
      event.preventDefault()
      pick(options[active].user)
    } else if ((event.key === 'Enter' || event.key === ',') && query) {
      event.preventDefault()
      onCommit(value)
    } else if (event.key === 'Escape' && visible) {
      // Keeps the surrounding dialog's Escape-to-close from firing too.
      event.nativeEvent.stopPropagation()
      setOpen(false)
    }
  }

  return (
    <div ref={fieldRef} className="relative min-w-0 flex-1">
      <input
        ref={inputRef}
        role="combobox"
        aria-label="Email"
        aria-expanded={visible}
        aria-controls={visible ? listId : undefined}
        aria-activedescendant={visible && active >= 0 ? `${listId}-${active}` : undefined}
        placeholder="user@example.com"
        value={value}
        onChange={(event) => {
          onChange(event.target.value)
          setOpen(true)
          setActive(event.target.value.trim() ? 0 : -1)
        }}
        onFocus={show}
        onClick={show}
        onKeyDown={onKeyDown}
        onPaste={onPaste}
        className="h-9 w-full rounded-lg border border-border bg-input/30 pr-9 pl-3 text-sm text-white outline-none placeholder:text-muted-foreground focus:border-white/30"
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label={visible ? 'Hide suggestions' : 'Show suggestions'}
        onClick={() => {
          if (visible) return setOpen(false)
          inputRef.current?.focus()
          show()
        }}
        className="absolute inset-y-0 right-0 flex w-9 cursor-pointer items-center justify-center text-muted-foreground hover:text-white"
      >
        <ChevronDown className={cn('size-3.5 transition-transform', visible && 'rotate-180')} />
      </button>
      {visible &&
        position &&
        createPortal(
          <div
            ref={popupRef}
            id={listId}
            role="listbox"
            aria-label="People"
            style={position}
            className={cn(menuSurfaceClass, 'fixed z-[60] overflow-y-auto')}
          >
            {options.map((option, index) => (
              <div key={option.user}>
                {option.group !== options[index - 1]?.group && (
                  <div className={cn(menuGroupLabelClass, index > 0 && 'mt-1')}>{option.group}</div>
                )}
                <div
                  id={`${listId}-${index}`}
                  data-index={index}
                  role="option"
                  aria-selected={index === active}
                  onMouseEnter={() => setActive(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => pick(option.user)}
                  className={cn(menuItemClass, 'h-auto py-1.5 hover:bg-transparent', index === active && 'bg-white/10')}
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-[10px] font-medium">
                    {initialsOf(option.user)}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{nameOf(option.user)}</span>
                    <span className="truncate text-[11px] text-muted-foreground">{option.user}</span>
                  </span>
                  {option.removed && query && <span className="shrink-0 text-[11px] text-muted-foreground">Removed</span>}
                </div>
              </div>
            ))}
          </div>,
          document.body,
        )}
    </div>
  )
}

function buildOptions(query: string, recent: string[], removed: string[], suggestions: string[], exclude: Set<string>): Option[] {
  const available = (users: string[]) => users.filter((user) => !exclude.has(user))
  const removedSet = new Set(removed)

  if (query) {
    return [...new Set([...recent, ...removed, ...suggestions])]
      .filter((user) => !exclude.has(user) && user.includes(query))
      .map((user) => ({ user, group: 'People', removed: removedSet.has(user) }))
  }

  const recentOptions = available(recent).map((user) => ({ user, group: 'Recent', removed: false }))
  const removedOptions = available(removed)
    .filter((user) => !recent.includes(user))
    .map((user) => ({ user, group: 'Previously removed', removed: true }))
  if (recentOptions.length + removedOptions.length > 0) return [...recentOptions, ...removedOptions]
  return available(suggestions).map((user) => ({ user, group: 'Suggestions', removed: false }))
}
