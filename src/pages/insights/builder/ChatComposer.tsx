import { useRef, useState } from 'react'
import { ArrowUp, ChevronDown, Plus } from 'lucide-react'
import { DATA_OBJECTS } from '../../../data/dataSources'
import { cn } from '../../../lib/cn'
import { Menu } from '../../../ui/Menu'

type ChatComposerProps = {
  onSubmit: (text: string) => void
  disabled?: boolean
  autoFocus?: boolean
  placeholder?: string
}

/** Mirrors the main app's default `ConversationInputNext` chat bar: pill group, "+" left, model + send right. */
export function ChatComposer({ onSubmit, disabled = false, autoFocus = false, placeholder = 'Describe the graphs you want' }: ChatComposerProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const canSend = value.trim() !== '' && !disabled

  const submit = () => {
    if (!canSend) return
    onSubmit(value.trim())
    setValue('')
  }

  const mention = (label: string) => {
    setValue((current) => `${current}${current && !current.endsWith(' ') ? ' ' : ''}@${label} by `)
    textareaRef.current?.focus()
  }

  return (
    <form
      aria-label="Message AI"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
      className="flex w-full flex-col gap-2 rounded-[28px] bg-tlai-4 px-3 py-2 text-sm leading-6"
    >
      <textarea
        ref={textareaRef}
        value={value}
        rows={1}
        autoFocus={autoFocus}
        aria-label="Message"
        placeholder={placeholder}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== 'Enter' || event.shiftKey) return
          event.preventDefault()
          submit()
        }}
        className="field-sizing-content max-h-[200px] min-h-[30px] w-full resize-none bg-transparent px-2.5 py-2 text-white outline-none placeholder:text-white/55"
      />
      <div className="flex w-full items-center gap-2">
        <Menu
          align="start"
          side="top"
          items={DATA_OBJECTS.map((object) => ({ label: `@${object.label}`, onSelect: () => mention(object.label) }))}
          trigger={({ toggle }) => (
            <button
              type="button"
              aria-label="Add data source"
              title="Add data source"
              onClick={toggle}
              className="flex size-10 cursor-pointer items-center justify-center rounded-full hover:scale-[97.5%] hover:opacity-80"
            >
              <Plus className="size-6 text-white" strokeWidth={1.5} />
            </button>
          )}
        />
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className="flex h-8 cursor-pointer items-center gap-1 rounded-full px-3 text-sm text-white/70 hover:bg-white/10 hover:text-white"
          >
            Auto
            <ChevronDown className="size-3.5" />
          </button>
          <button
            type="submit"
            aria-label="Send message"
            title="Send message"
            disabled={!canSend}
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-full bg-white p-2 shadow-2xs transition-all',
              canSend ? 'cursor-pointer hover:opacity-90' : 'opacity-50',
            )}
          >
            <ArrowUp className="text-black" style={{ width: 24, height: 24 }} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </form>
  )
}
