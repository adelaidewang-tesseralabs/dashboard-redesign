import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const SHOW_DELAY_MS = 400
const GAP = 6
const EDGE = 8
const CONTROL = 'button, a[href], [role="button"], [data-tip]'

/** `right`: set by `data-tip-side="right"`, for controls stacked in a vertical rail. */
type Tip = { label: string; anchor: DOMRect; side: 'above' | 'right' }

/** Buttons that show only an icon, so their name lives in `title` or `aria-label`. */
function iconControl(target: EventTarget | null): HTMLElement | null {
  const control = target instanceof Element ? target.closest<HTMLElement>(CONTROL) : null
  if (!control || control.textContent?.trim() || !control.querySelector('svg')) return null
  return control.title || control.dataset.tooltip || control.getAttribute('aria-label') ? control : null
}

/** Text marked `data-overflow-tip` that is currently cut off by its ellipsis. */
function truncatedText(target: EventTarget | null): HTMLElement | null {
  const text = target instanceof Element ? target.closest<HTMLElement>('[data-overflow-tip]') : null
  return text && text.scrollWidth > text.clientWidth ? text : null
}

const tipTarget = (target: EventTarget | null) => iconControl(target) ?? truncatedText(target)

/**
 * One tooltip for every icon-only button in the app, named from its `title` (the short name) or `aria-label`,
 * and for truncated `data-overflow-tip` text, showing it in full.
 * The `title` is lifted off while hovered so the browser's own tooltip doesn't show on top.
 */
export function IconTooltips() {
  const [tip, setTip] = useState<Tip | null>(null)
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null)
  const tipRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let current: HTMLElement | null = null
    /** The button just clicked: no tooltip again until the pointer leaves it. */
    let clicked: HTMLElement | null = null
    let timer = 0
    let watch = 0
    const restoreTitle = (control: HTMLElement) => {
      if (control.dataset.tooltip === undefined) return
      if (!control.title) control.title = control.dataset.tooltip
      delete control.dataset.tooltip
    }
    const hide = () => {
      window.clearTimeout(timer)
      window.clearInterval(watch)
      if (current) restoreTitle(current)
      current = null
      setTip(null)
    }
    const show = (control: HTMLElement) => {
      if (control === current) return
      hide()
      current = control
      if (control.title) {
        control.dataset.tooltip = control.title
        control.removeAttribute('title')
      }
      const label = control.dataset.tooltip || control.getAttribute('aria-label') || (control.hasAttribute('data-overflow-tip') ? control.textContent : null)
      if (!label) return
      const side = control.dataset.tipSide === 'right' ? 'right' : 'above'
      timer = window.setTimeout(() => setTip({ label, anchor: control.getBoundingClientRect(), side }), SHOW_DELAY_MS)
      // A button can disappear without the pointer moving, e.g. a keyboard shortcut switching views.
      watch = window.setInterval(() => {
        if (!control.isConnected) hide()
      }, 250)
    }
    const onOver = (event: Event) => {
      const control = tipTarget(event.target)
      if (control !== clicked) clicked = null
      if (control && control !== clicked) show(control)
      else if (current && !current.contains(event.target as Node)) hide()
    }
    const onFocus = (event: Event) => {
      const control = iconControl(event.target)
      if (control?.matches(':focus-visible')) show(control)
    }
    // Clicking usually opens a menu or changes the view, which the tooltip would cover.
    const onPointerDown = (event: Event) => {
      clicked = tipTarget(event.target)
      hide()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') hide()
    }
    document.addEventListener('pointerover', onOver)
    document.addEventListener('focusin', onFocus)
    document.addEventListener('focusout', hide)
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('scroll', hide, true)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      hide()
      document.removeEventListener('pointerover', onOver)
      document.removeEventListener('focusin', onFocus)
      document.removeEventListener('focusout', hide)
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('scroll', hide, true)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  // Above the button unless that runs off the screen; kept inside the viewport sideways.
  useLayoutEffect(() => {
    const node = tipRef.current
    if (!tip || !node) {
      setPosition(null)
      return
    }
    const { width, height } = node.getBoundingClientRect()
    const { anchor } = tip
    if (tip.side === 'right') {
      setPosition({ left: anchor.right + GAP, top: anchor.top + anchor.height / 2 - height / 2 })
      return
    }
    const above = anchor.top - GAP - height >= EDGE
    const left = Math.min(Math.max(EDGE, anchor.left + anchor.width / 2 - width / 2), window.innerWidth - EDGE - width)
    setPosition({ left, top: above ? anchor.top - GAP - height : anchor.bottom + GAP })
  }, [tip])

  if (!tip) return null
  return createPortal(
    <div
      ref={tipRef}
      role="tooltip"
      style={position ?? { left: 0, top: 0, visibility: 'hidden' }}
      className="pointer-events-none fixed z-[100] w-max max-w-64 rounded-md border border-white/10 bg-tlai-4 px-2 py-1 text-xs text-white shadow-lg"
    >
      {tip.label}
    </div>,
    document.body,
  )
}
