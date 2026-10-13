import type { TextBoxStyle, TextTone } from '../../../data/widgets'

export const TONE_LABELS: Record<TextTone, string> = {
  gray: 'Gray',
  blue: 'Blue',
  mint: 'Mint',
  amber: 'Amber',
  red: 'Red',
  purple: 'Purple',
}

/** Translucent tints, so the same tone reads on both the dark and the light canvas. */
export const TONE_BACKGROUND: Record<TextTone, string> = {
  gray: 'bg-[rgba(148,163,184,0.16)]',
  blue: 'bg-[rgba(96,165,250,0.16)]',
  mint: 'bg-[rgba(52,211,153,0.16)]',
  amber: 'bg-[rgba(251,191,36,0.18)]',
  red: 'bg-[rgba(248,113,113,0.16)]',
  purple: 'bg-[rgba(167,139,250,0.18)]',
}

/** Solid swatches for the Background picker; the tints themselves are too faint to read on the settings panel. */
export const TONE_SWATCH: Record<TextTone, string> = {
  gray: 'bg-[#94a3b8]',
  blue: 'bg-[#60a5fa]',
  mint: 'bg-[#34d399]',
  amber: 'bg-[#fbbf24]',
  red: 'bg-[#f87171]',
  purple: 'bg-[#a78bfa]',
}

export const TONE_BORDER: Record<TextTone, string> = {
  gray: 'border-[#94a3b8]',
  blue: 'border-[#60a5fa]',
  mint: 'border-[#34d399]',
  amber: 'border-[#fbbf24]',
  red: 'border-[#f87171]',
  purple: 'border-[#a78bfa]',
}

/** `-safe` keeps overflowing text scrollable from its first line instead of clipping the top. */
export const VERTICAL_ALIGN_CLASS: Record<NonNullable<TextBoxStyle['verticalAlign']>, string> = {
  top: 'justify-start',
  middle: 'justify-center-safe',
  bottom: 'justify-end-safe',
}

export const TEXT_ALIGN_CLASS: Record<NonNullable<TextBoxStyle['textAlign']>, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}
