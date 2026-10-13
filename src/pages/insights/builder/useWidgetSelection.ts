import { useEffect, useState } from 'react'
import type { CanvasItem } from '../../../data/widgets'

/** Which canvas widget has its settings panel open; Escape clears it. */
export function useWidgetSelection(widgets: CanvasItem[]) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = widgets.find((item) => item.id === selectedId)

  useEffect(() => {
    if (!selected) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedId(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selected])

  return { selected, setSelectedId }
}
