import { useEffect, useState } from 'react'
import type { DashboardAppearance } from '../data/dashboards'

export type ResolvedAppearance = 'light' | 'dark'

function systemAppearance(): ResolvedAppearance {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

/** Resolves `system` against the viewer's color scheme; unset appearance stays dark. */
export function resolveAppearance(appearance: DashboardAppearance | undefined): ResolvedAppearance {
  if (appearance === 'light' || appearance === 'dark') return appearance
  if (appearance === 'system') return systemAppearance()
  return 'dark'
}

export function useResolvedAppearance(appearance: DashboardAppearance | undefined): ResolvedAppearance {
  const [resolved, setResolved] = useState<ResolvedAppearance>(() => resolveAppearance(appearance))

  useEffect(() => {
    if (appearance !== 'system') {
      setResolved(appearance === 'light' ? 'light' : 'dark')
      return
    }
    const media = window.matchMedia('(prefers-color-scheme: light)')
    const sync = () => setResolved(media.matches ? 'light' : 'dark')
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [appearance])

  return resolved
}
