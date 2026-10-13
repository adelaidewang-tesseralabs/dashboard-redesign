import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ChartColumn, ChartPie, ChevronDown, CornerDownRight, DatabaseZap, FileUp, ListTodo } from 'lucide-react'
import type { DataObject } from '../../../data/dataSources'
import type { CanvasItem } from '../../../data/widgets'
import { cn } from '../../../lib/cn'
import { AddGraphMenu } from './AddGraphMenu'
import { ChatComposer } from './ChatComposer'
import type { AddSourceKind } from './sourceKinds'

type Suggestion = {
  Icon: LucideIcon
  lead: string
  emphasis: string
  prompt: string
}

const SUGGESTIONS: Suggestion[] = [
  {
    Icon: ChartColumn,
    lead: 'Compare quality dimensions in',
    emphasis: 'Data Checks by Dimension',
    prompt: 'Data checks by dimension',
  },
  {
    Icon: ChartColumn,
    lead: 'Break down checks by urgency in',
    emphasis: 'Data Checks by Priority',
    prompt: 'Data checks by priority',
  },
  {
    Icon: ChartPie,
    lead: 'See which checks pass or fail in',
    emphasis: 'Data Checks by Last run status',
    prompt: 'Data checks by last run status',
  },
  {
    Icon: ListTodo,
    lead: 'Track remediation progress in',
    emphasis: 'Work Items by Status',
    prompt: 'Work items by status',
  },
]

type CanvasHeroProps = {
  onPrompt: (text: string) => void
  sources: { object: DataObject; label: string }[]
  onAdd: (item: CanvasItem) => void
  onAddSource: (kind: AddSourceKind) => void
  /** Builder V2: replaces the source buttons with a link to the Data tab. */
  onOpenData?: () => void
}

export function CanvasHero({ onPrompt, sources, onAdd, onAddSource, onOpenData }: CanvasHeroProps) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-6 px-6 pt-10 pb-36">
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="text-2xl font-semibold text-[var(--dash-fg)]">Create a dashboard with Tessera AI</h2>
        <p className="max-w-sm text-sm text-[var(--dash-muted)]">
          {onOpenData ? 'Describe the insights you want, or start from your data.' : 'Describe the insights you want, pick data, or bring your own from Foundry.'}
        </p>
      </div>
      <div className="flex w-full max-w-2xl flex-col gap-5">
        <div className="flex flex-col gap-2.5">
          <ChatComposer onSubmit={onPrompt} autoFocus />
          {onOpenData ? (
            <p className="px-2 text-sm text-[var(--dash-muted)]">
              Or{' '}
              <button
                type="button"
                onClick={onOpenData}
                className="cursor-pointer text-[var(--dash-fg)] underline decoration-[var(--dash-faint)] underline-offset-4 hover:text-[var(--dash-fg)] hover:decoration-[var(--dash-fg)]"
              >
                select data source
              </button>
            </p>
          ) : (
            <div className="flex items-center gap-2 px-2 text-sm text-[var(--dash-muted)]">
              Or start from
              <AddGraphMenu
                side="bottom"
                widgets={[]}
                sources={sources}
                onAdd={onAdd}
                onAddSource={onAddSource}
                trigger={({ open, toggle }) => <SourceButton Icon={ChartColumn} label="Pick data" active={open} onClick={toggle} trailing={<ChevronDown className="size-3.5" />} />}
              />
              <SourceButton Icon={DatabaseZap} label="Foundry" onClick={() => onAddSource('foundry')} />
              <SourceButton Icon={FileUp} label="Upload file" onClick={() => onAddSource('upload')} />
            </div>
          )}
        </div>
        <section aria-labelledby="canvas-suggestions" className="flex flex-col gap-1 px-2">
          <h3 id="canvas-suggestions" className="pb-1 text-sm text-[var(--dash-muted)]">
            Suggestions
          </h3>
          {SUGGESTIONS.map((suggestion) => (
            <SuggestionRow key={suggestion.prompt} suggestion={suggestion} onApply={() => onPrompt(suggestion.prompt)} />
          ))}
        </section>
      </div>
    </div>
  )
}

type SourceButtonProps = {
  Icon: LucideIcon
  label: string
  onClick: () => void
  active?: boolean
  trailing?: ReactNode
}

function SourceButton({ Icon, label, onClick, active = false, trailing }: SourceButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-7 cursor-pointer items-center gap-1.5 rounded-md border border-[var(--dash-card-edge)] px-2 text-sm text-[var(--dash-fg)] hover:bg-[var(--dash-card-edge)] hover:text-[var(--dash-fg)]',
        active && 'bg-[var(--dash-border)] text-[var(--dash-fg)]',
      )}
    >
      <Icon className="size-3.5 text-[var(--dash-muted)]" />
      {label}
      {trailing}
    </button>
  )
}

function SuggestionRow({ suggestion, onApply }: { suggestion: Suggestion; onApply: () => void }) {
  const { Icon } = suggestion
  return (
    <div className="flex items-center gap-3 py-1.5">
      <CornerDownRight className="size-4 shrink-0 text-[var(--dash-faint)]" />
      <span className="flex size-6 shrink-0 items-center justify-center rounded-md border border-[var(--dash-card-edge)] bg-[var(--dash-card)]">
        <Icon className="size-3.5 text-[var(--dash-fg)]" />
      </span>
      <p className="min-w-0 flex-1 truncate text-sm text-[var(--dash-muted)]">
        {suggestion.lead} <span className="font-medium text-[var(--dash-fg)]">{suggestion.emphasis}</span>
      </p>
      <button type="button" onClick={onApply} className="h-8 shrink-0 cursor-pointer rounded-lg bg-[var(--dash-border)] px-3 text-sm font-medium text-[var(--dash-fg)] hover:bg-[var(--dash-card-edge)]">
        Build
      </button>
    </div>
  )
}
