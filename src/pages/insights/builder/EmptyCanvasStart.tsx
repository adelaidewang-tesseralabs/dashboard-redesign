import type { ComponentProps, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ChartColumn, Image, Plus, Type, Undo2 } from 'lucide-react'
import type { SqlDataset } from '../../../data/dashboards'
import type { DataObject } from '../../../data/dataSources'
import { objectItem, sameSource, sqlDatasetItem, type CanvasItem } from '../../../data/widgets'
import { cn } from '../../../lib/cn'
import { AddGraphMenu } from './AddGraphMenu'
import { ChatComposer } from './ChatComposer'

type EmptyCanvasStartProps = Omit<ComponentProps<typeof AddGraphMenu>, 'trigger' | 'side' | 'align' | 'onAskAi'> & {
  onPrompt: (text: string) => void
  onAddText: () => void
  onAddMedia: () => void
  /** Set when the page was emptied by an edit that can be undone, e.g. removing its last graph. */
  onUndo?: () => void
}

const MAX_SUGGESTIONS = 4
const actionClass =
  'flex h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--dash-border)] px-3.5 text-sm font-medium text-[var(--dash-fg)] hover:bg-[var(--dash-card-edge)]'
const chipClass =
  'flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-[var(--dash-card-edge)] px-3 text-xs text-[var(--dash-fg)] hover:bg-[var(--dash-card)]'

type Suggestion = { label: string; item: CanvasItem }

/** Up to four one-click graphs: each dataset's first fields in turn, preferring fields with few values, then saved queries. */
function suggestedGraphs(sources: { object: DataObject; label: string }[], queries: SqlDataset[], taken: CanvasItem[]): Suggestion[] {
  const isFree = ({ item }: Suggestion) => !taken.some((widget) => sameSource(widget, item))
  const perSource = sources.map(({ object, label }) =>
    object.fields
      .filter((field) => field.values.length > 1 && field.values.length <= 8)
      .map((field) => ({ label: `${label} by ${field.label}`, item: objectItem(object.name, field.key) }))
      .filter(isFree),
  )
  const depth = Math.max(0, ...perSource.map((fields) => fields.length))
  const interleaved = Array.from({ length: depth }, (_, index) => perSource.flatMap((fields) => fields[index] ?? []))
  const fromQueries = queries.map((dataset) => ({ label: dataset.label, item: sqlDatasetItem(dataset) })).filter(isFree)
  return [...interleaved.flat(), ...fromQueries].slice(0, MAX_SUGGESTIONS)
}

function ActionButton({ Icon, label, onClick, active }: { Icon: LucideIcon; label: string; onClick: () => void; active?: boolean }) {
  return (
    <button type="button" aria-expanded={active} onClick={onClick} className={cn(actionClass, active && 'bg-[var(--dash-card-edge)]')}>
      <Icon className="size-4" aria-hidden />
      {label}
    </button>
  )
}

/** Final builder's empty page: the toolbar's add actions, one-click suggested graphs, and the home page's chat box where the toolbar will sit. */
export function EmptyCanvasStart({ onPrompt, onAddText, onAddMedia, onUndo, ...menu }: EmptyCanvasStartProps) {
  const suggestions = suggestedGraphs(menu.sources, menu.queries ?? [], menu.widgets)
  let suggestionRow: ReactNode = null
  if (suggestions.length > 0)
    suggestionRow = suggestions.map((suggestion) => (
      <button key={suggestion.label} type="button" onClick={() => menu.onAdd(suggestion.item)} className={chipClass}>
        <ChartColumn className="size-3.5 opacity-60" aria-hidden />
        {suggestion.label}
      </button>
    ))
  else if (menu.onOpenAddSource && menu.sources.length + (menu.queries?.length ?? 0) === 0)
    suggestionRow = (
      <button type="button" onClick={menu.onOpenAddSource} className={chipClass}>
        <Plus className="size-3.5 opacity-60" aria-hidden />
        Add dataset
      </button>
    )

  return (
    <div className="flex min-h-full flex-col items-center px-6 pt-10 pb-6">
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <span className="flex size-12 items-center justify-center rounded-xl border border-[var(--dash-card-edge)] bg-[var(--dash-card)]">
          <ChartColumn className="size-5 text-[var(--dash-muted)]" aria-hidden />
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-[var(--dash-fg)]">This dashboard is empty</h2>
          <p className="text-sm text-[var(--dash-muted)]">Add something, or describe what you want below.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          <AddGraphMenu {...menu} side="top" align="center" trigger={({ open, toggle }) => <ActionButton Icon={Plus} label="Add graph" onClick={toggle} active={open} />} />
          <ActionButton Icon={Type} label="Add text" onClick={onAddText} />
          <ActionButton Icon={Image} label="Add media" onClick={onAddMedia} />
        </div>
        {onUndo && (
          <button type="button" onClick={onUndo} className="flex cursor-pointer items-center gap-1.5 text-xs text-[var(--dash-muted)] hover:text-[var(--dash-fg)]">
            <Undo2 className="size-3.5" aria-hidden />
            Undo last change
          </button>
        )}
        {suggestionRow && (
          <div className="mt-4 flex max-w-xl flex-col items-center gap-2">
            <span className="text-[11px] font-medium tracking-wider text-[var(--dash-muted)] uppercase">{suggestions.length ? 'Suggested graphs' : 'No data yet'}</span>
            <div className="flex flex-wrap justify-center gap-2">{suggestionRow}</div>
          </div>
        )}
      </div>
      <div className="w-full max-w-2xl">
        <ChatComposer onSubmit={onPrompt} autoFocus placeholder="Ask Tessera to build your dashboard" />
      </div>
    </div>
  )
}
