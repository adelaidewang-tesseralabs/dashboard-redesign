import { FileCode2, Plus, Sheet, X } from 'lucide-react'
import { cn } from '../../../../lib/cn'
import type { ConsoleTab } from './useConsoleTabs'

type ConsoleTabBarProps = {
  tabs: ConsoleTab[]
  activeId: string | null
  onSelect: (id: string) => void
  onClose: (id: string) => void
  onNewQuery?: () => void
}

/** Open tables and queries across the top of the Catalog console, as in Data Foundry. */
export function ConsoleTabBar({ tabs, activeId, onSelect, onClose, onNewQuery }: ConsoleTabBarProps) {
  return (
    <div role="tablist" aria-label="Open tabs" className="flex h-10 shrink-0 items-center gap-1 overflow-x-auto border-b border-white/10 px-2 [scrollbar-width:none]">
      {tabs.map((tab) => {
        const Icon = tab.table ? Sheet : FileCode2
        const active = tab.id === activeId
        return (
          <div
            key={tab.id}
            className={cn(
              'group flex h-7 max-w-52 shrink-0 items-center gap-1.5 rounded-md border pr-1 pl-2 text-xs',
              active ? 'border-sky-300/40 bg-white/[0.06] text-white' : 'border-transparent text-white/55 hover:bg-white/5',
            )}
          >
            <button type="button" role="tab" aria-selected={active} title={tab.table?.name ?? tab.title} onClick={() => onSelect(tab.id)} className="flex min-w-0 cursor-pointer items-center gap-1.5">
              <Icon className="size-3.5 shrink-0 text-white/50" />
              <span className="truncate">{tab.title}</span>
            </button>
            <button
              type="button"
              aria-label={`Close ${tab.title}`}
              onClick={() => onClose(tab.id)}
              className="flex size-4 shrink-0 cursor-pointer items-center justify-center rounded text-white/50 hover:bg-white/10 hover:text-white"
            >
              <X className="size-3" />
            </button>
          </div>
        )
      })}
      {onNewQuery && (
        <button
          type="button"
          aria-label="New query"
          title="New query"
          onClick={onNewQuery}
          className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded text-white/60 hover:bg-white/10 hover:text-white"
        >
          <Plus className="size-3.5" />
        </button>
      )}
    </div>
  )
}
