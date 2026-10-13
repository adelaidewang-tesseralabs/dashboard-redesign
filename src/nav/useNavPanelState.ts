import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { NAV_CONFIG, resolveActiveNav } from './navConfig'

const COLLAPSED_KEY = 'tessera-insights-nav-collapsed'
const HOVER_OPEN_DELAY_MS = 120
const HOVER_CLOSE_DELAY_MS = 80
const HOVER_SWITCH_DELAY_MS = 120

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSED_KEY) === 'true'
  } catch {
    return false
  }
}

/**
 * Simplified port of the main app's NavigationStore + `useNavPanelHover`:
 * click a panel L1 to pin it docked (click again to collapse); while not docked,
 * hovering an L1 floats a preview of its sections.
 */
export function useNavPanelState() {
  const { pathname } = useLocation()
  const activeNav = resolveActiveNav(pathname)
  const [navCollapsed, setNavCollapsedState] = useState(readCollapsed)
  const [openL1, setOpenL1] = useState<string | null>(null)
  const [hoverL1, setHoverL1] = useState<string | null>(null)
  /** A page asked for the room (the builder's AI chat); clicking an L1 opens the panel anyway until it lets go. */
  const [suppressed, setSuppressedState] = useState(false)
  const [reopened, setReopened] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    setOpenL1(null)
    setHoverL1(null)
  }, [pathname])

  const setNavCollapsed = useCallback((next: boolean) => {
    setNavCollapsedState(next)
    try {
      localStorage.setItem(COLLAPSED_KEY, String(next))
    } catch {
      /* ignore */
    }
  }, [])

  const panelL1Id = openL1 ?? activeNav.l1Id
  const panelL1 = NAV_CONFIG.find((l1) => l1.id === panelL1Id && l1.l2s.length > 0)
  const docked = !navCollapsed && (!suppressed || reopened) && panelL1 != null
  const floatingL1 = docked ? undefined : NAV_CONFIG.find((l1) => l1.id === hoverL1)

  const clearTimer = () => window.clearTimeout(timer.current)

  const clearHover = useCallback(() => {
    clearTimer()
    setHoverL1(null)
  }, [])

  const onItemPointerEnter = (l1Id: string) => {
    if (docked) return
    clearTimer()
    timer.current = window.setTimeout(
      () => setHoverL1(l1Id),
      hoverL1 ? HOVER_SWITCH_DELAY_MS : HOVER_OPEN_DELAY_MS,
    )
  }

  const scheduleClose = () => {
    clearTimer()
    timer.current = window.setTimeout(() => setHoverL1(null), HOVER_CLOSE_DELAY_MS)
  }

  const onSelectPanel = (l1Id: string) => {
    clearHover()
    if (docked && panelL1?.id === l1Id) {
      setNavCollapsed(true)
      return
    }
    setOpenL1(l1Id === activeNav.l1Id ? null : l1Id)
    setNavCollapsed(false)
    if (suppressed) setReopened(true)
  }

  const setSuppressed = useCallback((next: boolean) => {
    setSuppressedState(next)
    if (!next) setReopened(false)
  }, [])

  return {
    activeNav,
    panelL1: docked ? panelL1 : undefined,
    floatingL1,
    hoverL1: floatingL1?.id ?? null,
    onSelectPanel,
    onItemPointerEnter,
    onZoneLeave: scheduleClose,
    onPanelEnter: clearTimer,
    onPanelLeave: scheduleClose,
    clearHover,
    collapse: () => setNavCollapsed(true),
    setSuppressed,
  }
}
