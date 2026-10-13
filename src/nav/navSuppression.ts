import { createContext, useContext, useEffect } from 'react'

export const NavSuppressionContext = createContext<(suppressed: boolean) => void>(() => {})

/** Hides the docked L2 panel while `active`, without touching the user's saved collapse choice, so it comes back after. */
export function useCollapseNavWhile(active: boolean) {
  const setSuppressed = useContext(NavSuppressionContext)
  useEffect(() => {
    setSuppressed(active)
    return () => setSuppressed(false)
  }, [active, setSuppressed])
}
