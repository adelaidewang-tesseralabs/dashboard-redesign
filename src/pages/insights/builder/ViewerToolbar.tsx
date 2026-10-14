import { ScrollText } from 'lucide-react'
import { Divider, TesseraIcon, Tool } from './CanvasToolbar'

type ViewerToolbarProps = {
  chatOpen: boolean
  unread: boolean
  onToggleChat: () => void
  onSummarize: () => void
}

/** Final builder's preview and view mode: the edit toolbar's AI tools in the same spot, answering instead of building. */
export function ViewerToolbar({ chatOpen, unread, onToggleChat, onSummarize }: ViewerToolbarProps) {
  return (
    <div role="toolbar" aria-label="Canvas tools" className="flex items-center gap-0.5 rounded-lg border border-white/10 bg-tlai-3 p-1 shadow-lg shadow-black/60">
      <Tool Icon={TesseraIcon} label="Ask AI" active={chatOpen} onClick={onToggleChat} unread={unread} />
      <Divider />
      <Tool Icon={ScrollText} label="Summarize page" onClick={onSummarize} />
    </div>
  )
}
