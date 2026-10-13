import { useEffect, useRef, useState } from 'react'
import { ArrowUp, Sparkles } from 'lucide-react'
import { graphToolButtonClass } from './GraphActionsMenu'

type WidgetCommentProps = {
  label: string
  onSubmit: (text: string) => void
}

/** "Ask AI" in a graph's toolbar: opens a message box; sending it hands the request to Tessera AI. */
export function WidgetComment({ label, onSubmit }: WidgetCommentProps) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  // Keeps the draft, so a stray click doesn't throw away what was typed.
  useEffect(() => {
    if (!open) return
    const onMouseDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [open])

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
    <div ref={rootRef} data-comment-open={open || undefined} className="relative">
      <button
        type="button"
        aria-label={`Ask AI about ${label}`}
        title="Ask AI"
        data-popover-open={open || undefined}
        onClick={() => setOpen((current) => !current)}
        className={graphToolButtonClass}
      >
        <Sparkles className="size-3.5" />
      </button>
      {open && (
        <form
          aria-label={`Ask AI about ${label}`}
          onSubmit={(event) => {
            event.preventDefault()
            submit()
          }}
          className="absolute top-8 right-0 z-30 flex w-72 items-end gap-2 rounded-lg border border-white/10 bg-tlai-4 p-2 shadow-xl"
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
            aria-label="Send to AI"
            title="Send to AI"
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
