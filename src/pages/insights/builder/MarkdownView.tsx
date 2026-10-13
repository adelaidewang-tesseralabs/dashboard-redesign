import type { ReactNode } from 'react'
import { cn } from '../../../lib/cn'

type Block =
  | { type: 'heading'; level: 1 | 2 | 3; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'quote'; lines: string[] }
  | { type: 'paragraph'; lines: string[] }

const HEADING = /^(#{1,3})\s+(.*)$/
const BULLET = /^[-*]\s+(.*)$/
const NUMBERED = /^\d+[.)]\s+(.*)$/
const QUOTE = /^>\s?(.*)$/
const INLINE = /(\*\*[^*]+\*\*|~~[^~]+~~|\*[^*\s][^*]*\*|_[^_\s][^_]*_|`[^`]+`|\[[^\]]+\]\([^)\s]+\))/g
const SAFE_LINK = /^(https?:|mailto:)/i

function parseBlocks(markdown: string): Block[] {
  const blocks: Block[] = []
  for (const line of markdown.split('\n')) {
    const last = blocks.at(-1)
    const heading = line.match(HEADING)
    const bullet = line.match(BULLET)
    const numbered = line.match(NUMBERED)
    const quote = line.match(QUOTE)
    if (!line.trim()) blocks.push({ type: 'paragraph', lines: [] })
    else if (heading) blocks.push({ type: 'heading', level: heading[1].length as 1 | 2 | 3, text: heading[2] })
    else if (quote) {
      if (last?.type === 'quote') last.lines.push(quote[1])
      else blocks.push({ type: 'quote', lines: [quote[1]] })
    }
    else if (bullet || numbered) {
      const ordered = !bullet
      const text = (bullet ?? numbered)?.[1] ?? ''
      if (last?.type === 'list' && last.ordered === ordered) last.items.push(text)
      else blocks.push({ type: 'list', ordered, items: [text] })
    } else if (last?.type === 'paragraph' && last.lines.length > 0) last.lines.push(line)
    else blocks.push({ type: 'paragraph', lines: [line] })
  }
  return blocks.filter((block) => block.type !== 'paragraph' || block.lines.length > 0)
}

function renderInline(text: string): ReactNode[] {
  return text.split(INLINE).map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) return <strong key={index}>{renderInline(part.slice(2, -2))}</strong>
    if (part.startsWith('~~') && part.endsWith('~~') && part.length > 4) return <s key={index}>{renderInline(part.slice(2, -2))}</s>
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code key={index} className="rounded bg-[var(--dash-border)] px-1 py-0.5 font-mono text-[0.9em]">
          {part.slice(1, -1)}
        </code>
      )
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/)
    if (link) {
      if (!SAFE_LINK.test(link[2])) return link[1]
      return (
        <a key={index} href={link[2]} target="_blank" rel="noreferrer noopener" className="underline underline-offset-2 hover:opacity-80">
          {link[1]}
        </a>
      )
    }
    if (/^(\*[^*].*\*|_.+_)$/.test(part) && part.length > 2) return <em key={index}>{renderInline(part.slice(1, -1))}</em>
    return part
  })
}

const HEADING_CLASS = { 1: 'text-xl font-semibold', 2: 'text-base font-semibold', 3: 'text-sm font-semibold' } as const

function Lines({ lines }: { lines: string[] }) {
  return lines.map((line, lineIndex) => (
    <span key={lineIndex}>
      {lineIndex > 0 && <br />}
      {renderInline(line)}
    </span>
  ))
}

/** Basic Markdown: headings (#–###), **bold**, *italic*, ~~strike~~, `code`, [links](https://…), > quotes, and bulleted or numbered lists. */
export function MarkdownView({ markdown, className }: { markdown: string; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-2 text-sm leading-relaxed text-[var(--dash-fg)]', className)}>
      {parseBlocks(markdown).map((block, index) => {
        switch (block.type) {
          case 'heading': {
            const Tag = `h${block.level}` as const
            return (
              <Tag key={index} className={HEADING_CLASS[block.level]}>
                {renderInline(block.text)}
              </Tag>
            )
          }
          case 'list': {
            const Tag = block.ordered ? 'ol' : 'ul'
            return (
              <Tag key={index} className={cn('flex flex-col gap-0.5 pl-5', block.ordered ? 'list-decimal' : 'list-disc')}>
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex}>{renderInline(item)}</li>
                ))}
              </Tag>
            )
          }
          case 'quote':
            return (
              <blockquote key={index} className="border-l-2 border-[var(--dash-border)] pl-3 text-[var(--dash-muted)]">
                <Lines lines={block.lines} />
              </blockquote>
            )
          case 'paragraph':
            return (
              <p key={index}>
                <Lines lines={block.lines} />
              </p>
            )
          default: {
            const unhandled: never = block
            return unhandled
          }
        }
      })}
    </div>
  )
}
