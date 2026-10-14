import { useEffect, useRef, type ReactNode } from 'react'
import { LayoutDashboard, LoaderCircle, MessageSquare, MousePointer2, Sparkles, X } from 'lucide-react'
import type { SourceOrigin } from '../../../data/dataSources'
import { cn } from '../../../lib/cn'
import { ChatComposer } from './ChatComposer'
import { PanelResizeHandle } from './PanelResizeHandle'
import { ORIGIN_META } from './sourceKinds'
import type { SidePanelResize } from './useSidePanelWidth'

/** A source the assistant read; `table` is set when it can be opened as a dataset. */
export type ChatSource = { label: string; origin: SourceOrigin; table?: string }
/** A suggested answer to a clarifying question; picking it sends `prompt`. */
export type ChatChoice = { label: string; detail: string; prompt: string }

/** `target` names the graph a user message was about; `graphIds` are the graphs a reply added. */
export type ChatMessage = { id: string; role: 'user' | 'assistant'; text: string; sources?: ChatSource[]; choices?: ChatChoice[]; target?: string; graphIds?: string[] }

/** The graph the next message is about (or, from the Data tab, the dataset new graphs come from), with prompts to suggest. */
export type ChatContext = { label: string; suggestions: string[]; onClear: () => void; kind?: 'graph' | 'dataset' }

const CONTEXT_COPY = {
  graph: {
    empty: (label: string) => `Tell me what to change on ${label}, or comment on any graph on the canvas.`,
    chip: 'Editing',
    clear: 'Stop editing this graph',
    placeholder: 'Ask for a change to this graph',
    thinking: 'Updating the graph…',
  },
  dataset: {
    empty: (label: string) => `Describe the graphs you want from ${label}.`,
    chip: 'Using',
    clear: 'Stop using this dataset',
    placeholder: 'Ask for a graph from this dataset',
    thinking: 'Building graphs…',
  },
}

type ChatPanelProps = {
  messages: ChatMessage[]
  thinking: boolean
  onSend: (text: string) => void
  onClose: () => void
  intro?: string
  /** The composer's hint when no graph or dataset is in context. */
  placeholder?: string
  onOpenSource?: (table: string) => void
  /** Makes the panel resizable at a width shared with the widget settings panel. */
  resize?: SidePanelResize
  context?: ChatContext
  /** Rendered in the header before the close button. */
  headerExtra?: ReactNode
  /** Fill a parent column instead of being a standalone aside. */
  embedded?: boolean
  /** Off the canvas: replies that added graphs link to them. */
  onViewGraph?: (itemId: string) => void
}

export function ChatPanel({ messages, thinking, onSend, onClose, intro, placeholder, onOpenSource, resize, context, headerExtra, embedded = false, onViewGraph }: ChatPanelProps) {
  const endRef = useRef<HTMLDivElement>(null)
  const copy = context && CONTEXT_COPY[context.kind ?? 'graph']

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages.length, thinking])

  const Root = embedded ? 'div' : 'aside'
  return (
    <Root
      aria-label="Ask AI"
      style={!embedded && resize ? { width: resize.width } : undefined}
      className={cn(
        'relative flex flex-col bg-tlai-1',
        embedded ? 'min-h-0 flex-1' : 'shrink-0 border-l border-white/10',
        !embedded && !resize && 'w-96',
      )}
    >
      {!embedded && resize && <PanelResizeHandle resize={resize} />}
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-white/10 px-4">
        <Sparkles className="size-4 text-tlai-mint" />
        <span className="flex-1 text-sm font-medium text-white">Ask AI</span>
        {headerExtra}
        <button
          type="button"
          aria-label="Close chat"
          title="Close chat"
          onClick={onClose}
          className="cursor-pointer rounded p-1 text-white/50 hover:bg-white/10 hover:text-white"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-4">
        {messages.length === 0 && (
          <p className="text-sm text-white/50">
            {context && copy ? copy.empty(context.label) : (intro ?? "Describe the graphs you want. I build them from this dashboard's data checks.")}
          </p>
        )}
        {messages.map((message) =>
          message.role === 'user' ? (
            <div key={message.id} className="flex max-w-[85%] flex-col items-end gap-1 self-end">
              {message.target && (
                <span className="flex items-center gap-1 text-[11px] text-white/45">
                  <MessageSquare className="size-3" />
                  {message.target}
                </span>
              )}
              <p className="rounded-lg bg-white/10 px-3 py-2 text-sm break-words text-white">{message.text}</p>
            </div>
          ) : (
            <AssistantRow key={message.id}>
              <p className="text-sm text-white/80">{message.text}</p>
              {message.choices && <ChoiceList choices={message.choices} disabled={thinking} onPick={onSend} />}
              {message.sources && <SourceChips sources={message.sources} onOpen={onOpenSource} />}
              {message.graphIds && onViewGraph && <ViewOnCanvas graphIds={message.graphIds} onView={onViewGraph} />}
            </AssistantRow>
          ),
        )}
        {thinking && (
          <AssistantRow>
            <span className="flex items-center gap-2 text-sm text-white/50">
              <LoaderCircle className="size-3.5 animate-spin" />
              {copy?.thinking ?? 'Building graphs…'}
            </span>
          </AssistantRow>
        )}
        <div ref={endRef} />
      </div>

      <div className="flex shrink-0 flex-col gap-2 p-3">
        {context && copy && <ContextBar context={context} chip={copy.chip} clearLabel={copy.clear} disabled={thinking} onPick={onSend} />}
        <ChatComposer onSubmit={onSend} disabled={thinking} autoFocus placeholder={copy?.placeholder ?? placeholder} />
      </div>
    </Root>
  )
}

type ContextBarProps = { context: ChatContext; chip: string; clearLabel: string; disabled: boolean; onPick: (prompt: string) => void }

function ContextBar({ context, chip, clearLabel, disabled, onPick }: ContextBarProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {context.suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            disabled={disabled}
            onClick={() => onPick(suggestion)}
            className="h-7 cursor-pointer rounded-full border border-white/10 px-2.5 text-xs text-white/75 hover:bg-white/5 hover:text-white disabled:cursor-default disabled:opacity-50"
          >
            {suggestion}
          </button>
        ))}
      </div>
      <span className="flex h-6 w-fit max-w-full items-center gap-1.5 rounded-md bg-tlai-mint/10 pr-1 pl-2 text-xs text-tlai-mint">
        <MousePointer2 className="size-3 shrink-0" />
        <span className="truncate">
          {chip} {context.label}
        </span>
        <button type="button" aria-label={clearLabel} title={clearLabel} onClick={context.onClear} className="cursor-pointer rounded p-0.5 hover:bg-tlai-mint/15">
          <X className="size-3" />
        </button>
      </span>
    </div>
  )
}

function ChoiceList({ choices, disabled, onPick }: { choices: ChatChoice[]; disabled: boolean; onPick: (prompt: string) => void }) {
  return (
    <div className="mt-2 flex flex-col gap-1.5">
      {choices.map((choice) => (
        <button
          key={choice.prompt}
          type="button"
          disabled={disabled}
          onClick={() => onPick(choice.prompt)}
          className="flex cursor-pointer flex-col items-start rounded-lg border border-white/10 px-3 py-2 text-left hover:bg-white/5 disabled:cursor-default disabled:opacity-50"
        >
          <span className="text-sm text-white">{choice.label}</span>
          <span className="w-full truncate text-xs text-white/45">{choice.detail}</span>
        </button>
      ))}
    </div>
  )
}

function SourceChips({ sources, onOpen }: { sources: ChatSource[]; onOpen?: (table: string) => void }) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <span className="text-xs text-white/45">Sources</span>
      {sources.map((source) => {
        const { Icon, label } = ORIGIN_META[source.origin]
        const { table } = source
        const content = (
          <>
            <Icon className="size-3 text-white/60" />
            {source.label}
          </>
        )
        const chip = 'flex h-6 items-center gap-1 rounded-md border border-white/10 px-1.5 text-xs text-white/75'
        return table && onOpen ? (
          <button key={source.label} type="button" title={`${label} · Open in Data`} onClick={() => onOpen(table)} className={cn(chip, 'cursor-pointer hover:bg-white/10 hover:text-white')}>
            {content}
          </button>
        ) : (
          <span key={source.label} title={label} className={chip}>
            {content}
          </span>
        )
      })}
    </div>
  )
}

function ViewOnCanvas({ graphIds, onView }: { graphIds: string[]; onView: (itemId: string) => void }) {
  const [first] = graphIds
  if (!first) return null
  return (
    <button
      type="button"
      onClick={() => onView(first)}
      className="mt-2 flex h-7 cursor-pointer items-center gap-1 rounded-md border border-white/10 px-2 text-xs text-white/80 hover:bg-white/10 hover:text-white"
    >
      <LayoutDashboard className="size-3.5" />
      View on canvas
    </button>
  )
}

function AssistantRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2.5">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-tlai-mint/10 text-tlai-mint">
        <Sparkles className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">{children}</div>
    </div>
  )
}
