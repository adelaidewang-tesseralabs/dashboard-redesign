import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { LINKED_WIDGET_PARAM } from './useGraphView'

/** Grid items get their positions a frame after the grid mounts. */
const SETTLE_MS = 150

/** Opening a copied graph link scrolls that graph into view and flashes it, then drops the param so a reload doesn't repeat it. */
export function useLinkedWidget(gridMounted: boolean) {
  const [params, setParams] = useSearchParams()
  const linkedId = params.get(LINKED_WIDGET_PARAM)

  useEffect(() => {
    if (!gridMounted || !linkedId) return
    const timer = window.setTimeout(() => {
      const frame = document.querySelector(`[data-widget-id="${CSS.escape(linkedId)}"]`)?.closest('[data-widget]')
      frame?.scrollIntoView({ block: 'center', behavior: 'smooth' })
      frame?.animate([{ boxShadow: '0 0 0 3px var(--dash-selected)' }, { boxShadow: '0 0 0 3px transparent' }], { duration: 1800, delay: 300, easing: 'ease-out' })
      setParams(
        (current) => {
          current.delete(LINKED_WIDGET_PARAM)
          return current
        },
        { replace: true },
      )
    }, SETTLE_MS)
    return () => window.clearTimeout(timer)
  }, [gridMounted, linkedId, setParams])
}
