import { useState } from 'react'
import { ArrowUp, Sparkles } from 'lucide-react'
import { cn } from '../../../lib/cn'

type WidgetCommentProps = {
  label: string
  onSubmit: (text: string) => void
}

/** Hover "Ask AI" button that opens a message box on a graph; sending it hands the request to Tessera AI. */
export function WidgetComment({ label, onSubmit }: WidgetCommentProps) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')

  const close = () => {
    setOpen(false)
    setText('')
  }
  const submit = () => {
    if (!text.trim()) return
    onSubmit(text.trim())
    close()
  }

  return (
    // Clicks stay here so commenting doesn't also count as selecting the graph underneath.
    <div data-comment-open={open || undefined} onClick={(event) => event.stopPropagation()} className="absolute -top-3 right-5 z-10">
      <button
        type="button"
        aria-label={`Ask AI about ${label}`}
        title="Ask Tessera AI to change this graph"
        onClick={() => setOpen((current) => !current)}
        className={cn(
          'flex h-6 cursor-pointer items-center gap-1 rounded-full border border-white/15 bg-tlai-4 px-2 text-xs text-white/80 shadow-sm transition-opacity hover:text-white',
          open ? 'opacity-100' : 'opacity-0 group-hover/widget:opacity-100 focus-visible:opacity-100 in-data-selected:opacity-100',
        )}
      >
        <Sparkles className="size-3" />
        Ask AI
      </button>
      {open && (
        <form
          aria-label={`Ask AI about ${label}`}
          onSubmit={(event) => {
            event.preventDefault()
            submit()
          }}
          className="absolute top-8 right-0 flex w-72 items-end gap-2 rounded-lg border border-white/10 bg-tlai-4 p-2 shadow-xl"
        >
          <textarea
            autoFocus
            rows={2}
            value={text}
            aria-label="Ask AI"
            placeholder="What should change?"
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') close()
              if (event.key !== 'Enter' || event.shiftKey) return
              event.preventDefault()
              submit()
            }}
            className="min-w-0 flex-1 resize-none bg-transparent px-1 py-0.5 text-sm text-white outline-none placeholder:text-white/45"
          />
          <button
            type="submit"
            aria-label="Send to Tessera AI"
            title="Send to Tessera AI"
            disabled={!text.trim()}
            className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white text-black disabled:cursor-default disabled:opacity-40"
          >
            <ArrowUp className="size-4" />
          </button>
        </form>
      )}
    </div>
  )
}
