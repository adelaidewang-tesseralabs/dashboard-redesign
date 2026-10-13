import { NavLink } from 'react-router-dom'
import { PanelLeftClose } from 'lucide-react'
import { cn } from '../lib/cn'
import type { ActiveNav, NavL1 } from './navConfig'

function rowClass(active: boolean) {
  return cn(
    'flex h-10 select-none items-center rounded-lg pl-7 pr-3 text-[15px] transition-colors active:scale-[0.98]',
    active ? 'bg-white/10 text-white' : 'text-white/85 hover:bg-white/5 hover:text-white',
  )
}

type NavPanelContentProps = {
  l1: NavL1
  activeNav: ActiveNav
  onCollapse?: () => void
  onNavigate?: () => void
}

/** Port of the main app's `NavPanelContent` + `NavPanelSection`. */
export function NavPanelContent({ l1, activeNav, onCollapse, onNavigate }: NavPanelContentProps) {
  const activeInPanel = activeNav.l1Id === l1.id

  return (
    <nav aria-label={`${l1.label} sections`} className="flex min-h-0 w-full flex-1 flex-col gap-5 px-3 py-5">
      <div className="flex items-center justify-between pl-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-white">
          <l1.Icon className="size-4" />
          {l1.label}
        </span>
        {onCollapse && (
          <button
            type="button"
            aria-label="Collapse navigation panel"
            onClick={onCollapse}
            className="group/button flex size-8 cursor-pointer items-center justify-center rounded-md text-white hover:bg-white/10"
          >
            <PanelLeftClose className="size-4.5 opacity-50 transition-opacity group-hover/button:opacity-100" />
          </button>
        )}
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto">
        {l1.l2s.map((l2) => (
          <section key={l2.id} className="flex flex-col">
            <span className="flex h-8 select-none items-center rounded-lg pl-2 pr-3 text-[12px] tracking-wider text-white/40 uppercase">
              {l2.label}
            </span>
            <ul className="flex flex-col">
              {l2.l3s.map((l3) => {
                const active = activeInPanel && activeNav.l2Id === l2.id && activeNav.l3Id === l3.id
                return (
                  <li key={l3.id}>
                    <NavLink
                      to={l3.to}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      className={rowClass(active)}
                    >
                      {l3.label}
                    </NavLink>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </nav>
  )
}
