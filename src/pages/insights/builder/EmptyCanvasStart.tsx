import type { ComponentProps } from 'react'
import { ChartColumn, Plus } from 'lucide-react'
import { cn } from '../../../lib/cn'
import { AddGraphMenu } from './AddGraphMenu'
import { ChatComposer } from './ChatComposer'

type EmptyCanvasStartProps = Omit<ComponentProps<typeof AddGraphMenu>, 'trigger' | 'side' | 'align' | 'onAskAi'> & {
  onPrompt: (text: string) => void
}

/** Final builder's new dashboard: one Add graph button, and the home page's chat box where the edit toolbar will sit. */
export function EmptyCanvasStart({ onPrompt, ...menu }: EmptyCanvasStartProps) {
  return (
    <div className="flex min-h-full flex-col items-center px-6 pt-10 pb-6">
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <span className="flex size-12 items-center justify-center rounded-xl border border-[var(--dash-card-edge)] bg-[var(--dash-card)]">
          <ChartColumn className="size-5 text-[var(--dash-muted)]" aria-hidden />
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-[var(--dash-fg)]">This dashboard is empty</h2>
          <p className="text-sm text-[var(--dash-muted)]">Add a graph, or describe what you want below.</p>
        </div>
        <AddGraphMenu
          {...menu}
          side="bottom"
          align="center"
          trigger={({ open, toggle }) => (
            <button
              type="button"
              aria-expanded={open}
              onClick={toggle}
              className={cn(
                'flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--dash-border)] px-3.5 text-sm font-medium text-[var(--dash-fg)] hover:bg-[var(--dash-card-edge)]',
                open && 'bg-[var(--dash-card-edge)]',
              )}
            >
              <Plus className="size-4" aria-hidden />
              Add graph
            </button>
          )}
        />
      </div>
      <div className="w-full max-w-2xl">
        <ChatComposer onSubmit={onPrompt} autoFocus placeholder="Ask Tessera to build your dashboard" />
      </div>
    </div>
  )
}
