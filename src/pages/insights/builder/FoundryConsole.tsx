import { FileCode2, Table2, X } from 'lucide-react'
import type { DataObject } from '../../../data/dataSources'
import type { CanvasItem } from '../../../data/widgets'
import { cn } from '../../../lib/cn'
import { SourceIcon } from './sourceKinds'
import { SqlQueryPane } from './SqlQueryPane'
import { TablePicker } from './TablePicker'

export type FoundryTab = 'tables' | 'sql'

type FoundryConsoleProps = {
  tab: FoundryTab
  onTabChange: (tab: FoundryTab) => void
  sources: DataObject[]
  onAttach: (tables: DataObject[], name: string) => void
  onAdd: (item: CanvasItem) => void
  onClose: () => void
}

const TABS = [
  { value: 'tables', label: 'Pick tables', Icon: Table2 },
  { value: 'sql', label: 'SQL query', Icon: FileCode2 },
] as const satisfies { value: FoundryTab; label: string; Icon: typeof Table2 }[]

/** Bottom drawer combining the main app's "Add Foundry Source" (pick tables) with the SQL console. */
export function FoundryConsole({ tab, onTabChange, sources, onAttach, onAdd, onClose }: FoundryConsoleProps) {
  return (
    <section aria-label="Foundry" className="absolute inset-x-0 bottom-0 z-30 flex h-[360px] flex-col border-t border-white/10 bg-tlai-1 shadow-2xl shadow-black">
      <header className="flex h-11 shrink-0 items-center gap-3 border-b border-white/10 px-4">
        <SourceIcon origin="foundry" />
        <h2 className="text-sm font-medium text-white">Foundry</h2>
        <div role="tablist" aria-label="Foundry source" className="ml-2 flex rounded-lg bg-white/5 p-0.5 text-xs">
          {TABS.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              onClick={() => onTabChange(value)}
              className={cn(
                'flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-3 text-white/55 hover:text-white',
                tab === value && 'bg-white/10 text-white',
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>
        <span className="flex-1" />
        <button type="button" aria-label="Close Foundry" onClick={onClose} className="cursor-pointer rounded p-1 text-white/50 hover:bg-white/10 hover:text-white">
          <X className="size-4" />
        </button>
      </header>
      {/* Both tabs stay mounted so checked tables and the draft query survive switching. */}
      <div role="tabpanel" className={cn('flex min-h-0 flex-1', tab !== 'tables' && 'hidden')}>
        <TablePicker attached={new Set(sources.map((source) => source.name))} onAttach={onAttach} />
      </div>
      <div role="tabpanel" className={cn('flex min-h-0 flex-1', tab !== 'sql' && 'hidden')}>
        <SqlQueryPane sources={sources} onAdd={onAdd} />
      </div>
    </section>
  )
}
