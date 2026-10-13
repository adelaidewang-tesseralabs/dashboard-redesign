import { Link } from 'react-router-dom'
import { Bell, ClipboardList, Settings } from 'lucide-react'
import { cn } from '../lib/cn'
import { NAV_CONFIG, type ActiveNav, type NavL1 } from './navConfig'

export const RAIL_WIDTH = 72

const railItemClass = 'group/rail-item flex w-full select-none flex-col items-center gap-1'

function railIconClass(highlighted: boolean, panelOpen: boolean) {
  return cn(
    'flex size-8 items-center justify-center rounded-lg text-white transition-colors group-active/rail-item:scale-95',
    highlighted
      ? 'bg-white/10'
      : cn('group-hover/rail-item:bg-tessera-sidebar-accent/60', panelOpen && 'bg-tessera-sidebar-accent/60'),
  )
}

function railLabelClass(highlighted: boolean) {
  return cn('text-[11px] leading-none transition-colors', highlighted ? 'text-white' : 'text-white/55')
}

type NavRailProps = {
  activeNav: ActiveNav
  panelL1Id: string | null
  hoverL1: string | null
  onSelectPanel: (l1Id: string) => void
  onItemPointerEnter: (l1Id: string) => void
  onZoneLeave: () => void
  clearHover: () => void
}

export function NavRail({
  activeNav,
  panelL1Id,
  hoverL1,
  onSelectPanel,
  onItemPointerEnter,
  onZoneLeave,
  clearHover,
}: NavRailProps) {
  const renderItem = (l1: NavL1) => {
    const highlighted = activeNav.l1Id === l1.id
    const panelOpen = panelL1Id === l1.id || hoverL1 === l1.id
    const content = (
      <>
        <span className={railIconClass(highlighted, panelOpen)}>
          <l1.Icon className={cn('size-4.5 transition-opacity', !highlighted && !panelOpen && 'opacity-70')} />
        </span>
        <span className={railLabelClass(highlighted)}>{l1.label}</span>
      </>
    )

    if (l1.directTo) {
      return (
        <Link
          to={l1.directTo}
          aria-label={l1.label}
          aria-current={highlighted ? 'page' : undefined}
          onPointerEnter={clearHover}
          className={railItemClass}
        >
          {content}
        </Link>
      )
    }

    return (
      <button
        type="button"
        aria-label={l1.label}
        aria-current={highlighted ? 'page' : undefined}
        aria-expanded={panelOpen}
        onClick={() => onSelectPanel(l1.id)}
        onPointerEnter={() => onItemPointerEnter(l1.id)}
        className={cn(railItemClass, 'cursor-pointer border-none bg-transparent p-0')}
      >
        {content}
      </button>
    )
  }

  return (
    <aside
      style={{ width: RAIL_WIDTH }}
      className="relative z-20 flex shrink-0 flex-col items-center justify-between bg-tessera-primary-0 px-2 py-4"
    >
      <nav aria-label="Primary" className="flex w-full flex-col items-center gap-4">
        <Link to="/home" aria-label="Home" className="flex h-8 items-center justify-center">
          <span className="flex size-7 items-center justify-center rounded-md bg-white text-sm font-bold text-black">
            T
          </span>
        </Link>
        <ul className="flex w-full flex-col items-center gap-3" onPointerLeave={onZoneLeave}>
          {NAV_CONFIG.map((l1) => (
            <li key={l1.id} className="w-full">
              {renderItem(l1)}
            </li>
          ))}
        </ul>
      </nav>
      <div className="flex w-full flex-col items-center gap-3">
        <Link to="/setup" className={railItemClass} onPointerEnter={clearHover}>
          <span className={railIconClass(false, false)}>
            <Settings className="size-4.5 opacity-70" />
          </span>
          <span className={railLabelClass(false)}>Setup</span>
        </Link>
        <Link to="/worklist" aria-label="Worklist" className={railItemClass}>
          <span className={railIconClass(false, false)}>
            <ClipboardList className="size-4.5 opacity-70" />
          </span>
        </Link>
        <button type="button" aria-label="Notifications" className={cn(railItemClass, 'cursor-pointer')}>
          <span className={railIconClass(false, false)}>
            <Bell className="size-4.5 opacity-70" />
          </span>
        </button>
        <span
          className="flex size-8 items-center justify-center rounded-full bg-tlai-4 text-xs font-medium text-white"
          title="Adelaide Wang"
        >
          AW
        </span>
      </div>
    </aside>
  )
}
