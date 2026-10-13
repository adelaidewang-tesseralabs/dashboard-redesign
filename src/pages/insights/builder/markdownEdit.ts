/** A textarea's value and selection after a formatting command. */
export type TextEdit = { text: string; start: number; end: number }

export type BlockType = 'paragraph' | 'h1' | 'h2' | 'h3'

export type MarkdownCommand = BlockType | 'bold' | 'italic' | 'strike' | 'code' | 'bullets' | 'numbers' | 'quote' | 'link'

const LINE_PREFIX = /^(#{1,3}\s+|[-*]\s+|\d+[.)]\s+|>\s?)/

/** Toggles `marker` around the selection; with nothing selected, inserts a placeholder and selects it. */
function wrap({ text, start, end }: TextEdit, marker: string, placeholder: string): TextEdit {
  const selected = text.slice(start, end)
  const before = text.slice(0, start)
  const after = text.slice(end)
  if (before.endsWith(marker) && after.startsWith(marker)) {
    return { text: before.slice(0, -marker.length) + selected + after.slice(marker.length), start: start - marker.length, end: end - marker.length }
  }
  const inner = selected || placeholder
  return { text: before + marker + inner + marker + after, start: start + marker.length, end: start + marker.length + inner.length }
}

function lineBounds(text: string, start: number, end: number) {
  const lineStart = text.lastIndexOf('\n', start - 1) + 1
  const nextBreak = text.indexOf('\n', end)
  return { lineStart, lineEnd: nextBreak === -1 ? text.length : nextBreak }
}

/** Adds `prefix(index)` to every line the selection touches, or strips it when every line already has it. */
function prefixLines({ text, start, end }: TextEdit, pattern: RegExp, prefix: (index: number) => string, toggle = true): TextEdit {
  const { lineStart, lineEnd } = lineBounds(text, start, end)
  const lines = text.slice(lineStart, lineEnd).split('\n')
  const remove = toggle && lines.every((line) => pattern.test(line))
  const next = lines.map((line, index) => (remove ? line.replace(pattern, '') : prefix(index) + line.replace(LINE_PREFIX, ''))).join('\n')
  const replaced = text.slice(0, lineStart) + next + text.slice(lineEnd)
  return { text: replaced, start: lineStart, end: lineStart + next.length }
}

function link({ text, start, end }: TextEdit): TextEdit {
  const label = text.slice(start, end) || 'link text'
  const url = 'https://'
  const inserted = `[${label}](${url})`
  const urlStart = start + label.length + 3
  return { text: text.slice(0, start) + inserted + text.slice(end), start: urlStart, end: urlStart + url.length }
}

/**
 * The block type of the line the caret is on, for the toolbar's Text / Heading picker.
 * @example blockTypeAt('## Title', 3) // 'h2'
 */
export function blockTypeAt(text: string, position: number): BlockType {
  const { lineStart, lineEnd } = lineBounds(text, position, position)
  const hashes = text.slice(lineStart, lineEnd).match(/^(#{1,3})\s/)?.[1].length
  switch (hashes) {
    case 1:
      return 'h1'
    case 2:
      return 'h2'
    case 3:
      return 'h3'
    default:
      return 'paragraph'
  }
}

/**
 * Applies a toolbar command to a textarea's Markdown.
 * @example applyMarkdown({ text: 'Hi', start: 0, end: 2 }, 'bold') // { text: '**Hi**', start: 2, end: 4 }
 */
export function applyMarkdown(edit: TextEdit, command: MarkdownCommand): TextEdit {
  switch (command) {
    case 'paragraph':
      return prefixLines(edit, /^#{1,3}\s+/, () => '', false)
    case 'h1':
      return prefixLines(edit, /^#\s+/, () => '# ', false)
    case 'h2':
      return prefixLines(edit, /^##\s+/, () => '## ', false)
    case 'h3':
      return prefixLines(edit, /^###\s+/, () => '### ', false)
    case 'bold':
      return wrap(edit, '**', 'bold text')
    case 'italic':
      return wrap(edit, '*', 'italic text')
    case 'strike':
      return wrap(edit, '~~', 'struck text')
    case 'code':
      return wrap(edit, '`', 'code')
    case 'bullets':
      return prefixLines(edit, /^[-*]\s+/, () => '- ')
    case 'numbers':
      return prefixLines(edit, /^\d+[.)]\s+/, (index) => `${index + 1}. `)
    case 'quote':
      return prefixLines(edit, /^>\s?/, () => '> ')
    case 'link':
      return link(edit)
    default: {
      const unhandled: never = command
      return unhandled
    }
  }
}
