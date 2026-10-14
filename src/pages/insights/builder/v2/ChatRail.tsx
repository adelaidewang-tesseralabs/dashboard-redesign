import { Logo } from '../../../../ui/Logo'

type ChatRailProps = {
  /** A reply arrived while the chat was collapsed. */
  unread: boolean
  onOpen: () => void
}

/** Final builder: the left chat column collapsed to a strip, so reopening it is always one click away. */
export function ChatRail({ unread, onOpen }: ChatRailProps) {
  return (
    <aside aria-label="Ask AI" className="flex w-11 shrink-0 flex-col items-center border-r border-white/10 bg-tlai-1 pt-2">
      <button
        type="button"
        aria-label="Open Ask AI"
        title="Open Ask AI"
        onClick={onOpen}
        className="relative flex size-8 cursor-pointer items-center justify-center rounded-md text-white/60 hover:bg-white/10 hover:text-white"
      >
        <Logo className="size-4" />
        {unread && <span aria-label="New reply" className="absolute top-1 right-1 size-1.5 rounded-full bg-sky-400" />}
      </button>
    </aside>
  )
}
