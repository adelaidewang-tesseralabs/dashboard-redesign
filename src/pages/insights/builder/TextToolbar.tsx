import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { AlignCenter, AlignLeft, AlignRight, Bold, ChevronDown, Code, Italic, Link, List, ListOrdered, Quote, Strikethrough } from 'lucide-react'
import type { TextBoxStyle } from '../../../data/widgets'
import { cn } from '../../../lib/cn'
import { Menu } from '../../../ui/Menu'
import type { BlockType, MarkdownCommand } from './markdownEdit'

export type TextAlign = NonNullable<TextBoxStyle['textAlign']>

const MOD_KEY = navigator.platform.toLowerCase().includes('mac') ? '⌘' : 'Ctrl+'

type InlineCommand = { command: MarkdownCommand; label: string; Icon: LucideIcon; key?: string }

/** Grouped like the Databricks text toolbar; `key` is the ⌘/Ctrl shortcut the textarea handles. */
export const COMMAND_GROUPS: InlineCommand[][] = [
  [
    { command: 'bold', label: 'Bold', Icon: Bold, key: 'b' },
    { command: 'italic', label: 'Italic', Icon: Italic, key: 'i' },
    { command: 'strike', label: 'Strikethrough', Icon: Strikethrough },
    { command: 'code', label: 'Inline code', Icon: Code, key: 'e' },
  ],
  [
    { command: 'bullets', label: 'Bulleted list', Icon: List },
    { command: 'numbers', label: 'Numbered list', Icon: ListOrdered },
    { command: 'quote', label: 'Quote', Icon: Quote },
  ],
  [{ command: 'link', label: 'Link', Icon: Link, key: 'k' }],
]

const BLOCK_LABELS: Record<BlockType, string> = { paragraph: 'Text', h1: 'Heading 1', h2: 'Heading 2', h3: 'Heading 3' }
const BLOCK_TYPES: BlockType[] = ['paragraph', 'h1', 'h2', 'h3']

const ALIGN_OPTIONS: { align: TextAlign; label: string; Icon: LucideIcon }[] = [
  { align: 'left', label: 'Align left', Icon: AlignLeft },
  { align: 'center', label: 'Align center', Icon: AlignCenter },
  { align: 'right', label: 'Align right', Icon: AlignRight },
]

const buttonClass =
  'flex h-7 cursor-pointer items-center justify-center gap-1 rounded text-[var(--dash-muted)] hover:bg-[var(--dash-border)] hover:text-[var(--dash-fg)]'

type TextToolbarProps = {
  blockType: BlockType
  textAlign: TextAlign
  onCommand: (command: MarkdownCommand) => void
  onAlign: (align: TextAlign) => void
}

/** Docked along the top of the text box; wraps in narrow blocks. Mouse-down never steals focus from the textarea, so commands apply to its selection. */
export function TextToolbar({ blockType, textAlign, onCommand, onAlign }: TextToolbarProps) {
  const AlignIcon = ALIGN_OPTIONS.find((option) => option.align === textAlign)?.Icon ?? AlignLeft
  return (
    <div
      role="toolbar"
      aria-label="Text formatting"
      onMouseDown={(event) => event.preventDefault()}
      // Right padding keeps the block's corner "…" menu clear of the last control.
      className="flex shrink-0 flex-wrap items-center gap-0.5 border-b border-[var(--dash-border)] py-1 pr-10 pl-1.5"
    >
      <Menu
        side="bottom"
        align="start"
        items={BLOCK_TYPES.map((type) => ({ label: BLOCK_LABELS[type], active: type === blockType, onSelect: () => onCommand(type) }))}
        trigger={({ toggle }) => (
          <button type="button" aria-label="Block type" onClick={toggle} className={cn(buttonClass, 'w-22 justify-between px-2 text-xs font-medium')}>
            {BLOCK_LABELS[blockType]}
            <ChevronDown className="size-3" />
          </button>
        )}
      />
      <Divider />
      {COMMAND_GROUPS.map((group, index) => (
        <Group key={index} divider={index > 0}>
          {group.map(({ command, label, Icon, key }) => (
            <button
              key={command}
              type="button"
              aria-label={label}
              title={key ? `${label} (${MOD_KEY}${key.toUpperCase()})` : label}
              onClick={() => onCommand(command)}
              className={cn(buttonClass, 'w-7')}
            >
              <Icon className="size-4" />
            </button>
          ))}
        </Group>
      ))}
      <Divider />
      <Menu
        side="bottom"
        align="start"
        items={ALIGN_OPTIONS.map(({ align, label, Icon }) => ({ label, Icon, active: align === textAlign, onSelect: () => onAlign(align) }))}
        trigger={({ toggle }) => (
          <button type="button" aria-label="Text alignment" title="Text alignment" onClick={toggle} className={cn(buttonClass, 'px-1.5')}>
            <AlignIcon className="size-4" />
            <ChevronDown className="size-3" />
          </button>
        )}
      />
    </div>
  )
}

function Group({ divider, children }: { divider: boolean; children: ReactNode }) {
  return (
    <>
      {divider && <Divider />}
      {children}
    </>
  )
}

function Divider() {
  return <span aria-hidden className="mx-1 h-4 w-px bg-[var(--dash-border)]" />
}
