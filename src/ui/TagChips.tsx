import { useLayoutEffect, useRef, useState } from 'react'
import { cn } from '../lib/cn'
import { Chip } from './Chip'

const GAP = 4

type TagChipsProps = {
  tags: string[]
  /** Shows at most this many. Unset fills the available width, so give the parent a definite width. */
  max?: number
}

/** A row of tag chips ending in "+N" for the ones that don't fit; hovering it lists them. */
export function TagChips({ tags, max }: TagChipsProps) {
  const frameRef = useRef<HTMLSpanElement>(null)
  const rulerRef = useRef<HTMLSpanElement>(null)
  const [fit, setFit] = useState(tags.length)
  const tagsKey = tags.join('\u0000')

  useLayoutEffect(() => {
    const frame = frameRef.current
    const ruler = rulerRef.current
    if (max != null || !frame || !ruler) return
    const measure = () => setFit(fittingCount(frame.clientWidth, [...ruler.children].map((child) => child.getBoundingClientRect().width)))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(frame)
    return () => observer.disconnect()
  }, [tagsKey, max])

  const shown = Math.min(tags.length, max ?? fit)
  const hidden = tags.slice(shown)
  return (
    <span ref={frameRef} className={cn('relative flex min-w-0 items-center gap-1 overflow-hidden', max == null && 'w-full')}>
      {tags.slice(0, shown).map((tag) => (
        <Chip key={tag} value={tag} className="min-w-0" />
      ))}
      {hidden.length > 0 && <Chip value={`+${hidden.length}`} tone="neutral" className="shrink-0" title={hidden.join(', ')} />}
      {max == null && (
        <span ref={rulerRef} aria-hidden className="pointer-events-none invisible absolute flex w-max gap-1">
          {tags.map((tag) => (
            <Chip key={tag} value={tag} />
          ))}
          <Chip value={`+${tags.length}`} tone="neutral" />
        </span>
      )}
    </span>
  )
}

/** `widths` holds every chip, then the "+N" chip last. Always keeps one chip, truncated if need be. */
function fittingCount(available: number, widths: number[]) {
  const chips = widths.slice(0, -1)
  const more = widths.at(-1) ?? 0
  const total = chips.reduce((sum, width) => sum + width, 0) + GAP * (chips.length - 1)
  if (total <= available) return chips.length
  let used = more
  let count = 0
  for (const width of chips) {
    if (used + GAP + width > available) break
    used += GAP + width
    count += 1
  }
  return Math.max(1, count)
}
