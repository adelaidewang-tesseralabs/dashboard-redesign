import { Outlet } from 'react-router-dom'
import { cn } from '../lib/cn'
import { NavPanelContent } from './NavPanelContent'
import { NavRail, RAIL_WIDTH } from './NavRail'
import { PrototypeVersionToggle } from './PrototypeVersionToggle'
import { useNavPanelState } from './useNavPanelState'

/**
 * Rail → docked/floating L2/L3 panel → content card, matching the main app's
 * `NewNavigation` + `ProtectedMain` layout under the `NEW_NAVIGATION` flag.
 */
export function AppShell() {
  const nav = useNavPanelState()
  const docked = nav.panelL1 != null

  return (
    <div className="relative flex h-full bg-tessera-primary-0 text-white">
      <NavRail
        activeNav={nav.activeNav}
        panelL1Id={nav.panelL1?.id ?? null}
        hoverL1={nav.hoverL1}
        onSelectPanel={nav.onSelectPanel}
        onItemPointerEnter={nav.onItemPointerEnter}
        onZoneLeave={nav.onZoneLeave}
        clearHover={nav.clearHover}
      />

      {nav.panelL1 && (
        <aside className="my-2 flex w-64 shrink-0 flex-col overflow-hidden rounded-l-xl border border-white/15 border-r-white/10 bg-tessera-foreground-0">
          <NavPanelContent l1={nav.panelL1} activeNav={nav.activeNav} onCollapse={nav.collapse} />
        </aside>
      )}

      {nav.floatingL1 && (
        <aside
          style={{ left: RAIL_WIDTH + 8, top: 16, bottom: 16, width: 260 }}
          className="absolute z-30 flex flex-col overflow-hidden rounded-xl border border-white/10 bg-tessera-foreground-0 shadow-[0px_12px_32px_-8px_rgba(0,0,0,0.55)]"
          onPointerEnter={nav.onPanelEnter}
          onPointerLeave={nav.onPanelLeave}
        >
          <NavPanelContent l1={nav.floatingL1} activeNav={nav.activeNav} onNavigate={nav.clearHover} />
        </aside>
      )}

      <main
        className={cn(
          'm-2 ml-0 flex min-h-0 min-w-0 max-w-full flex-1 overflow-hidden rounded-xl border border-white/15 bg-tessera-foreground-0',
          docked && 'rounded-l-none border-l-0',
        )}
      >
        <Outlet />
      </main>
      <PrototypeVersionToggle />
    </div>
  )
}
