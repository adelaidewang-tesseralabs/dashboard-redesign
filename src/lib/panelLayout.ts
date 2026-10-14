import { useSyncExternalStore } from 'react'

export const PANEL_LAYOUTS = ['layered', 'tools-left', 'settings-left', 'chat-left'] as const
export type PanelLayout = (typeof PANEL_LAYOUTS)[number]

export const PANEL_LAYOUT_LABELS: Record<PanelLayout, string> = {
  layered: 'A · Settings over chat, right',
  'tools-left': 'B · Tools on the left',
  'settings-left': 'C · Settings left, chat right',
  'chat-left': 'D · Chat left, settings right',
}

const STORAGE_KEY = 'insights-prototype.panel-layout'
const listeners = new Set<() => void>()

function isLayout(value: string | null): value is PanelLayout {
  return PANEL_LAYOUTS.some((layout) => layout === value)
}

function read(): PanelLayout {
  const stored = sessionStorage.getItem(STORAGE_KEY)
  return isLayout(stored) ? stored : 'layered'
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function setPanelLayout(next: PanelLayout) {
  sessionStorage.setItem(STORAGE_KEY, next)
  listeners.forEach((listener) => listener())
}

/** Prototype-only (V3): compare where the canvas tools, widget settings and Tessera AI sit. */
export function usePanelLayout() {
  return useSyncExternalStore(subscribe, read)
}
