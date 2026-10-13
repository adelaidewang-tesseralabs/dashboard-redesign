import { useEffect } from 'react'
import { useDashboards } from '../../../data/DashboardsStore'

/** Text fields keep their own undo, so the shortcut only steps the dashboard when focus is elsewhere. */
export function isTextField(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
}

/** ⌘Z / Ctrl+Z undoes the last dashboard edit; ⇧⌘Z, Ctrl+Shift+Z or Ctrl+Y redoes it. Pass no id to turn the shortcuts off. */
export function useUndoShortcuts(dashboardId: string | undefined) {
  const { undo, redo } = useDashboards()

  useEffect(() => {
    if (!dashboardId) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey || isTextField(event.target)) return
      const key = event.key.toLowerCase()
      if (key === 'z') {
        event.preventDefault()
        if (event.shiftKey) redo(dashboardId)
        else undo(dashboardId)
      } else if (key === 'y' && event.ctrlKey) {
        event.preventDefault()
        redo(dashboardId)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [dashboardId, undo, redo])
}
