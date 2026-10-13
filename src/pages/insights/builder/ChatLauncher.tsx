import { cn } from '../../../lib/cn'
import { Logo } from '../../../ui/Logo'

/** The product's floating Tessera AI launcher: brings the chat back once it's closed. */
export function ChatLauncher({ visible, onOpen }: { visible: boolean; onOpen: () => void }) {
  return (
    <button
      type="button"
      aria-label="Ask AI"
      title="Ask AI"
      tabIndex={visible ? 0 : -1}
      onClick={onOpen}
      className={cn(
        'group absolute right-6 bottom-6 z-20 flex size-12 cursor-pointer items-center justify-center rounded-full bg-white shadow-xl transition-opacity duration-300',
        visible ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
    >
      <Logo size={40} variant="light" className="transition-transform duration-1000 ease-in-out group-hover:scale-[1.3] group-hover:rotate-[360deg]" />
    </button>
  )
}
