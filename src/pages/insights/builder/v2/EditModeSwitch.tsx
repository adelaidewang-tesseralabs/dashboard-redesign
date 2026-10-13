import type { LucideIcon } from 'lucide-react'
import { SlidersHorizontal, Sparkles } from 'lucide-react'
import { cn } from '../../../../lib/cn'

export type EditMode = 'ai' | 'manual'

const MODES: { mode: EditMode; label: string; Icon: LucideIcon }[] = [
  { mode: 'ai', label: 'AI', Icon: Sparkles },
  { mode: 'manual', label: 'Manual', Icon: SlidersHorizontal },
]

/** Whether the selected graph is edited by chatting with Tessera AI or with the settings panel. */
export function EditModeSwitch({ mode, onChange }: { mode: EditMode; onChange: (mode: EditMode) => void }) {
  return (
    <div role="radiogroup" aria-label="Edit with" className="flex shrink-0 items-center rounded-md bg-white/5 p-0.5 text-xs">
      {MODES.map(({ mode: option, label, Icon }) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={mode === option}
          onClick={() => onChange(option)}
          className={cn(
            'flex h-6 cursor-pointer items-center gap-1 rounded px-2 text-white/55 hover:text-white',
            mode === option && 'bg-white/10 text-white',
          )}
        >
          <Icon className={cn('size-3', option === 'ai' && mode === option && 'text-tlai-mint')} />
          {label}
        </button>
      ))}
    </div>
  )
}
