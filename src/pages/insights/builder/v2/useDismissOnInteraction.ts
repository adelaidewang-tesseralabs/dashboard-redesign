import { useEffect, useEffectEvent } from 'react'
import { BACK_PILL_ATTR } from './BackPill'

const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'PageUp', 'PageDown', 'Home', 'End', ' '])

/** While `active`, any click or keypress outside the back pill dismisses it. Scrolling (wheel or scroll keys) doesn't. */
export function useDismissOnInteraction(active: boolean, onDismiss: () => void) {
  const dismiss = useEffectEvent(onDismiss)

  useEffect(() => {
    if (!active) return
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Element && event.target.closest(`[${BACK_PILL_ATTR}]`)) return
      dismiss()
    }
    const onKeyDown = (event: KeyboardEvent) => {
      const typing = event.target instanceof HTMLElement && (event.target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName))
      if (!typing && SCROLL_KEYS.has(event.key)) return
      dismiss()
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKeyDown, true)
    }
  }, [active])
}
