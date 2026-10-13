import { SlidersHorizontal, Sparkles } from 'lucide-react'
import { cn } from '../../../../lib/cn'
import type { SidePanelLayer } from './useV3SidePanel'

const META = {
  chat: { label: 'Ask AI', title: 'Ask AI about this widget', Icon: Sparkles },
  editor: { label: 'Settings', title: 'Back to widget settings', Icon: SlidersHorizontal },
} as const

type LayerSwitchButtonProps = {
  /** The layer this button brings to the front. */
  to: SidePanelLayer
  onClick: () => void
  /** Tessera AI replied while its panel was covered. */
  unread?: boolean
}

/** Builder V3: swaps the side column between Tessera AI and the selected widget's settings. */
export function LayerSwitchButton({ to, onClick, unread = false }: LayerSwitchButtonProps) {
  const { label, title, Icon } = META[to]
  return (
    <button
      type="button"
      title={unread ? `${title} — new reply` : title}
      onClick={onClick}
      className={cn(
        'relative flex shrink-0 cursor-pointer items-center gap-1.5 text-xs',
        // Ask AI is the way back to the chat the settings cover, so it reads as the panel's main action.
        to === 'chat'
          ? 'h-8 rounded-full bg-tlai-mint/15 px-3 font-medium text-tlai-mint ring-1 ring-tlai-mint/40 hover:bg-tlai-mint/25'
          : 'h-7 rounded-md bg-white/5 px-2 text-white/75 hover:bg-white/10 hover:text-white',
      )}
    >
      <Icon className="size-3.5" />
      {label}
      {unread && <span aria-label="New reply" className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-tlai-mint ring-2 ring-tlai-1" />}
    </button>
  )
}
