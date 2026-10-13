import { Tag } from 'lucide-react'
import { cn } from '../lib/cn'
import { stringToColor } from '../lib/colors'

const TONES = {
  success: 'bg-emerald-400/10 text-emerald-300',
  danger: 'bg-red-400/10 text-red-300',
  warning: 'bg-amber-400/10 text-amber-300',
  info: 'bg-sky-400/10 text-sky-300',
  neutral: 'bg-white/10 text-white/70',
} as const

export type ChipTone = keyof typeof TONES

type ChipProps = { value: string; tone?: ChipTone; className?: string }

/** Tonal badge — mirrors the DH `Chip variant="tonal"` (auto-colored with a tag icon when untoned). */
export function Chip({ value, tone, className }: ChipProps) {
  const auto = tone ? undefined : stringToColor(value)
  return (
    <span
      className={cn(
        'inline-flex h-[22px] max-w-[160px] items-center gap-1 rounded px-1.5 text-xs font-medium',
        tone && TONES[tone],
        className,
      )}
      style={auto ? { backgroundColor: auto.bg, color: auto.text } : undefined}
    >
      {!tone && <Tag className="size-3 shrink-0" aria-hidden />}
      <span className="truncate">{value}</span>
    </span>
  )
}
