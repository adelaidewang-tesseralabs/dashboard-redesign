import { useEffect, useEffectEvent } from 'react'
import type { CanvasItem } from '../../../data/widgets'
import { isTextField } from './useUndoShortcuts'

/** Module-level so a copied graph can be pasted on another page; tagged with its dashboard because datasets don't travel. */
let copied: { dashboardId: string; item: CanvasItem } | null = null

type GraphShortcutsOptions = {
  dashboardId: string
  selected: CanvasItem | null
  onPaste: (item: CanvasItem) => void
  onDelete: (itemId: string) => void
}

/** Typing, menus and dialogs keep their own keys; a shortcut only acts on the canvas. */
function ownsKeys(target: EventTarget | null) {
  return isTextField(target) || (target instanceof HTMLElement && !!target.closest('[role=dialog], [role=menu]'))
}

/** A text block being edited holds focus in its editor, so removing it has to work from inside that editor. */
function inSelectedTextBlock(target: EventTarget | null) {
  return target instanceof HTMLElement && target.matches('[data-text-block]') && !!target.closest('[data-selected]')
}

/**
 * ⌘C / Ctrl+C copies the selected canvas item, ⌘V / Ctrl+V pastes a copy, ⌘ / Ctrl + Delete or Backspace removes it.
 * Removing overrides the text editor's own ⌘⌫ (delete to line start); undo brings the block back. Pass no options to turn them off.
 */
export function useGraphShortcuts(options: GraphShortcutsOptions | undefined) {
  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (!options || event.altKey) return
    const { dashboardId, selected, onPaste, onDelete } = options
    const mod = event.metaKey || event.ctrlKey
    const key = event.key.toLowerCase()
    if (mod && (key === 'delete' || key === 'backspace') && selected && (!ownsKeys(event.target) || inSelectedTextBlock(event.target))) {
      event.preventDefault()
      onDelete(selected.id)
      return
    }
    if (ownsKeys(event.target)) return
    if (mod && key === 'c' && selected && !window.getSelection()?.toString()) {
      copied = { dashboardId, item: selected }
    } else if (mod && key === 'v' && copied?.dashboardId === dashboardId) {
      event.preventDefault()
      onPaste(copied.item)
    }
  })
  const enabled = !!options

  useEffect(() => {
    if (!enabled) return
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled])
}
