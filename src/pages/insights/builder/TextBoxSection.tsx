import type { ReactNode } from 'react'
import { AlignVerticalJustifyCenter, ArrowDownToLine, ArrowUpToLine } from 'lucide-react'
import { TEXT_TONES, type CanvasItem, type TextBoxStyle, type TextTone } from '../../../data/widgets'
import { cn } from '../../../lib/cn'
import { ViewToggle } from '../../../ui/ViewToggle'
import { EditorSection } from './EditorFields'
import { TONE_BORDER, TONE_LABELS, TONE_SWATCH } from './textBoxStyle'

type TextItem = Extract<CanvasItem, { source: 'text' }>
type VerticalAlign = NonNullable<TextBoxStyle['verticalAlign']>

const VERTICAL_OPTIONS: { id: VerticalAlign; label: string; Icon: typeof ArrowUpToLine }[] = [
  { id: 'top', label: 'Top', Icon: ArrowUpToLine },
  { id: 'middle', label: 'Middle', Icon: AlignVerticalJustifyCenter },
  { id: 'bottom', label: 'Bottom', Icon: ArrowDownToLine },
]

/** The Databricks "Textbox" settings: fill, outline and vertical alignment. Formatting lives in the block's own toolbar. */
export function TextBoxSection({ item, onChange }: { item: TextItem; onChange: (item: CanvasItem) => void }) {
  const style = item.style ?? {}
  const setStyle = (patch: TextBoxStyle) => onChange({ ...item, style: { ...style, ...patch } })
  return (
    <EditorSection title="Textbox">
      <Row label="Background">
        <TonePicker label="Background" value={style.background} swatchClass={TONE_SWATCH} onChange={(background) => setStyle({ background })} />
      </Row>
      <Row label="Border">
        <TonePicker label="Border" value={style.border} swatchClass={TONE_BORDER} outline onChange={(border) => setStyle({ border })} />
      </Row>
      <Row label="Vertical alignment">
        <ViewToggle ariaLabel="Vertical alignment" options={VERTICAL_OPTIONS} value={style.verticalAlign ?? 'top'} onChange={(verticalAlign) => setStyle({ verticalAlign })} />
      </Row>
    </EditorSection>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-8 items-center justify-between gap-3">
      <span className="text-sm text-white/85">{label}</span>
      {children}
    </div>
  )
}

type TonePickerProps = {
  label: string
  value: TextTone | undefined
  swatchClass: Record<TextTone, string>
  /** Border swatches show the tone as a ring instead of a fill. */
  outline?: boolean
  onChange: (tone: TextTone | undefined) => void
}

function TonePicker({ label, value, swatchClass, outline = false, onChange }: TonePickerProps) {
  return (
    <div role="radiogroup" aria-label={label} className="flex items-center gap-1">
      <button
        type="button"
        role="radio"
        aria-checked={!value}
        onClick={() => onChange(undefined)}
        className={cn(
          'h-6 cursor-pointer rounded-md border border-transparent px-1.5 text-xs text-white/60 hover:bg-white/10 hover:text-white',
          !value && 'border-white/15 bg-white/10 text-white',
        )}
      >
        Auto
      </button>
      {TEXT_TONES.map((tone) => (
        <button
          key={tone}
          type="button"
          role="radio"
          aria-checked={value === tone}
          aria-label={TONE_LABELS[tone]}
          title={TONE_LABELS[tone]}
          onClick={() => onChange(tone)}
          className={cn(
            'flex size-6 cursor-pointer items-center justify-center rounded-md border border-transparent hover:bg-white/10',
            value === tone && 'border-white/40',
          )}
        >
          <span aria-hidden className={cn('size-3.5 rounded-full', outline ? cn('border-2', swatchClass[tone]) : swatchClass[tone])} />
        </button>
      ))}
    </div>
  )
}
