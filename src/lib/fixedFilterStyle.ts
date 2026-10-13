import { useSyncExternalStore } from 'react'

export const FIXED_FILTER_STYLES = ['sentence', 'chip', 'collapsed'] as const
export type FixedFilterStyle = (typeof FIXED_FILTER_STYLES)[number]

export const FIXED_FILTER_STYLE_LABELS: Record<FixedFilterStyle, string> = {
  sentence: 'A · Sentence, not controls',
  chip: 'B · Tinted dashed chips',
  collapsed: 'C · Collapsed into one button',
}

const STORAGE_KEY = 'insights-prototype.fixed-filter-style'
const listeners = new Set<() => void>()

function isStyle(value: string | null): value is FixedFilterStyle {
  return FIXED_FILTER_STYLES.some((style) => style === value)
}

function read(): FixedFilterStyle {
  const stored = sessionStorage.getItem(STORAGE_KEY)
  return isStyle(stored) ? stored : 'sentence'
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function setFixedFilterStyle(next: FixedFilterStyle) {
  sessionStorage.setItem(STORAGE_KEY, next)
  listeners.forEach((listener) => listener())
}

/** Prototype-only (V6): compare ways of setting fixed filters apart from the ones viewers change. */
export function useFixedFilterStyle() {
  return useSyncExternalStore(subscribe, read)
}
