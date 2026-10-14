import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { Check, Plus, Tag, X } from 'lucide-react'
import { cn } from '../lib/cn'
import { stringToColor } from '../lib/colors'
import { menuItemClass, menuSurfaceClass } from './menuStyles'

type TagInputProps = {
  'aria-label': string
  value: string[]
  /** Every tag to offer; ones in `value` show checked. */
  options: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}

/** Typed tags longer than this get cut off in chips and table cells. */
const MAX_TAG_LENGTH = 40
const GAP = 4
const EDGE = 8

type Item = { kind: 'tag'; tag: string } | { kind: 'create'; tag: string }
type PopupPosition = { left: number; width: number; top?: number; bottom?: number; maxHeight: number }

const clean = (text: string) => text.trim().replace(/\s+/g, ' ')
const sameTag = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()

/** Multi-select combobox: type in the field to filter, pick or add tags, and they collect as chips before the caret. */
export function TagInput({ value, options, onChange, placeholder = 'Search or add tags…', ...props }: TagInputProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [position, setPosition] = useState<PopupPosition | null>(null)
  const fieldRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const items = tagItems(options, query)

  const toggle = (item: Item) => {
    const selected = value.some((tag) => sameTag(tag, item.tag))
    onChange(selected ? value.filter((tag) => !sameTag(tag, item.tag)) : [...value, item.tag])
    setQuery('')
    setActive(0)
  }
  const remove = (tag: string) => onChange(value.filter((other) => other !== tag))

  useLayoutEffect(() => {
    const field = fieldRef.current
    if (!open || !field) return
    const place = () => {
      const rect = field.getBoundingClientRect()
      const below = window.innerHeight - rect.bottom - GAP - EDGE
      const above = rect.top - GAP - EDGE
      setPosition(
        below >= 240 || below >= above
          ? { left: rect.left, width: rect.width, top: rect.bottom + GAP, maxHeight: below }
          : { left: rect.left, width: rect.width, bottom: window.innerHeight - rect.top + GAP, maxHeight: above },
      )
    }
    place()
    const observer = new ResizeObserver(place)
    observer.observe(field)
    return () => observer.disconnect()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node
      if (!popupRef.current?.contains(target) && !fieldRef.current?.contains(target)) setOpen(false)
    }
    const onScroll = (event: Event) => {
      if (!popupRef.current?.contains(event.target as Node)) setOpen(false)
    }
    // Capture phase: dialogs stop mousedown from bubbling, which would hide clicks elsewhere in them.
    document.addEventListener('mousedown', onPointer, true)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('mousedown', onPointer, true)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open])

  useEffect(() => {
    if (open) popupRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !query && value.length) return remove(value[value.length - 1])
    if (event.key === 'Tab') return setOpen(false)
    // Escape on a closed list falls through, so the dialog around the field can close.
    if (event.key === 'Escape' && !open) return
    const keys: Record<string, () => void> = {
      ArrowDown: () => (open ? setActive((index) => Math.min(index + 1, items.length - 1)) : setOpen(true)),
      ArrowUp: () => setActive((index) => Math.max(index - 1, 0)),
      Enter: () => items[active] && toggle(items[active]),
      Escape: () => setOpen(false),
    }
    const handler = keys[event.key]
    if (!handler) return
    event.preventDefault()
    event.stopPropagation()
    handler()
  }

  return (
    <>
      <div
        ref={fieldRef}
        onMouseDown={(event) => {
          setOpen(true)
          if (event.target === inputRef.current) return
          event.preventDefault()
          inputRef.current?.focus()
        }}
        className="flex min-h-9 w-full cursor-text flex-wrap items-center gap-1 rounded-lg border border-white/10 bg-tlai-3 px-1.5 py-1 focus-within:border-white/25"
      >
        {value.map((tag) => (
          <TagChip key={tag} tag={tag} onRemove={() => remove(tag)} />
        ))}
        <input
          ref={inputRef}
          role="combobox"
          aria-label={props['aria-label']}
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-activedescendant={open && items[active] ? `${listId}-${active}` : undefined}
          value={query}
          maxLength={MAX_TAG_LENGTH}
          placeholder={value.length ? '' : placeholder}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value)
            setActive(0)
            setOpen(true)
          }}
          onKeyDown={onKeyDown}
          className="h-7 min-w-24 flex-1 bg-transparent px-1.5 text-sm text-white outline-none placeholder:text-white/35"
        />
      </div>
      {open &&
        position &&
        createPortal(
          <div
            ref={popupRef}
            id={listId}
            role="listbox"
            aria-multiselectable
            aria-label={props['aria-label']}
            onMouseDown={(event) => event.preventDefault()}
            style={{ left: position.left, width: position.width, top: position.top, bottom: position.bottom, maxHeight: position.maxHeight }}
            className={cn(menuSurfaceClass, 'fixed z-[60] overflow-y-auto')}
          >
            {items.length === 0 && <div className="px-2 py-1.5 text-sm text-muted-foreground">No tags yet. Type to add one.</div>}
            {items.map((item, index) => {
              const selected = item.kind === 'tag' && value.some((tag) => sameTag(tag, item.tag))
              return (
                <div
                  key={`${item.kind}:${item.tag}`}
                  id={`${listId}-${index}`}
                  data-index={index}
                  role="option"
                  aria-selected={selected}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => toggle(item)}
                  className={cn(menuItemClass, 'relative pr-10 hover:bg-transparent', index === active && 'bg-white/10')}
                >
                  <span className="flex size-4 shrink-0 items-center justify-center [&_svg]:size-4 [&_svg]:stroke-[1.5]">
                    {item.kind === 'create' ? <Plus /> : <Tag />}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{item.kind === 'create' ? `Add “${item.tag}”` : item.tag}</span>
                  {selected && <Check aria-hidden className="absolute right-2 size-4" />}
                </div>
              )
            })}
          </div>,
          document.body,
        )}
    </>
  )
}

function TagChip({ tag, onRemove }: { tag: string; onRemove: () => void }) {
  const color = stringToColor(tag)
  return (
    <span className="inline-flex h-[22px] max-w-[160px] items-center gap-1 rounded pr-0.5 pl-1.5 text-xs font-medium" style={{ backgroundColor: color.bg, color: color.text }}>
      <Tag className="size-3 shrink-0" aria-hidden />
      <span className="truncate">{tag}</span>
      <button
        type="button"
        aria-label={`Remove ${tag}`}
        onMouseDown={(event) => {
          event.preventDefault()
          event.stopPropagation()
        }}
        onClick={onRemove}
        className="flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-sm opacity-70 hover:bg-black/20 hover:opacity-100"
      >
        <X className="size-3" aria-hidden />
      </button>
    </span>
  )
}

/** Tags matching `query`, then an "Add" row when the typed text isn't already a tag. */
function tagItems(options: string[], query: string): Item[] {
  const typed = clean(query)
  const needle = typed.toLowerCase()
  const matches: Item[] = options.filter((tag) => tag.toLowerCase().includes(needle)).map((tag) => ({ kind: 'tag', tag }))
  if (!typed || options.some((tag) => sameTag(tag, typed))) return matches
  return [...matches, { kind: 'create', tag: typed }]
}
