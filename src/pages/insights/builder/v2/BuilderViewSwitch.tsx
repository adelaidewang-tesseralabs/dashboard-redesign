import type { ReactNode } from 'react'
import { Database, LayoutDashboard } from 'lucide-react'
import { cn } from '../../../../lib/cn'

export type BuilderView = 'canvas' | 'data'

type BuilderViewSwitchProps = {
  view: BuilderView
  dataCount: number
  /** Some dataset has transform edits not yet applied to its graphs. */
  unapplied?: boolean
  onChange: (view: BuilderView) => void
}

/** Canvas | Data tab bar under the builder header. */
export function BuilderViewSwitch({ view, dataCount, unapplied = false, onChange }: BuilderViewSwitchProps) {
  return (
    <div role="tablist" aria-label="Builder view" className="flex shrink-0 items-end gap-4 border-b border-white/10 px-5">
      <ViewTab active={view === 'canvas'} onClick={() => onChange('canvas')}>
        <LayoutDashboard className="size-4" />
        Canvas
      </ViewTab>
      <ViewTab active={view === 'data'} onClick={() => onChange('data')}>
        <Database className="size-4" />
        Data
        <span className={cn('rounded px-1.5 text-[11px] tabular-nums', view === 'data' ? 'bg-tlai-mint/15 text-tlai-mint' : 'bg-white/10 text-white/70')}>
          {dataCount}
        </span>
        {unapplied && <span title="Unapplied transform changes" aria-label="Unapplied transform changes" className="size-1.5 rounded-full bg-amber-300" />}
      </ViewTab>
    </div>
  )
}

function ViewTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        '-mb-px flex h-10 cursor-pointer items-center gap-2 border-b-2 border-transparent px-1 text-sm font-medium text-white/55 transition-colors hover:text-white',
        active && 'border-tlai-mint text-white',
      )}
    >
      {children}
    </button>
  )
}
