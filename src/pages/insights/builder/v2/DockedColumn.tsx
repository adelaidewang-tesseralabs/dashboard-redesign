import type { ReactNode } from 'react'
import { MousePointerClick } from 'lucide-react'
import { cn } from '../../../../lib/cn'
import { PanelResizeHandle } from '../PanelResizeHandle'
import type { SidePanelResize } from '../useSidePanelWidth'

type DockedColumnProps = {
  label: string
  /** The column's outer edge follows `resize.edge`: a handle on the right means the column sits on the canvas's left. */
  resize: SidePanelResize
  children: ReactNode
}

/** Builder V3 panel layouts C and D: one side column holding either the chat or the widget settings, never both. */
export function DockedColumn({ label, resize, children }: DockedColumnProps) {
  return (
    <aside
      aria-label={label}
      style={{ width: resize.width }}
      className={cn('relative flex min-h-0 shrink-0 flex-col bg-tlai-1', resize.edge === 'right' ? 'border-r border-white/10' : 'border-l border-white/10')}
    >
      <PanelResizeHandle resize={resize} />
      {children}
    </aside>
  )
}

/** Stays docked while nothing is selected, so selecting a graph never shifts the canvas. */
export function SettingsEmptyState() {
  return (
    <>
      <div className="flex h-11 shrink-0 items-center border-b border-white/10 px-4 text-sm font-medium text-white">Settings</div>
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 text-center text-sm text-white/50">
        <MousePointerClick className="size-5 opacity-60" />
        Select a graph to edit its settings
      </div>
    </>
  )
}
