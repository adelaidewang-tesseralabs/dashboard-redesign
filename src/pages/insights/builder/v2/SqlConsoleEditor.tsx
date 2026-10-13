import type { KeyboardEvent, RefObject } from 'react'

const TOKEN =
  /(--[^\n]*|'(?:[^']|'')*'|"[^"]*"|\b\d+\b|\b(?:SELECT|FROM|WHERE|AND|OR|NOT|NULL|IS|LIMIT|GROUP|BY|HAVING|ORDER|JOIN|LEFT|INNER|ON|AS|COUNT|DISTINCT|IN|LIKE|ASC|DESC)\b)/gi

function tokenClass(token: string) {
  if (token.startsWith('--')) return 'text-white/35'
  if (token.startsWith("'")) return 'text-amber-300'
  if (token.startsWith('"')) return 'text-white/90'
  if (/^\d/.test(token)) return 'text-violet-300'
  return 'text-sky-300'
}

function highlight(sql: string) {
  return sql.split(TOKEN).map((part, index) =>
    index % 2 === 1 ? (
      <span key={index} className={tokenClass(part)}>
        {part}
      </span>
    ) : (
      part
    ),
  )
}

type SqlConsoleEditorProps = {
  value: string
  onChange: (value: string) => void
  onRun: () => void
  textareaRef: RefObject<HTMLTextAreaElement | null>
}

/** Line-numbered SQL editor with keyword highlighting: a transparent textarea over a highlighted copy. */
export function SqlConsoleEditor({ value, onChange, onRun, textareaRef }: SqlConsoleEditorProps) {
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      onRun()
    }
  }
  return (
    <div className="flex min-h-0 flex-1 overflow-auto font-mono text-[13px] leading-6">
      <div className="sticky left-0 z-10 shrink-0 bg-tlai-1 py-2 pr-3 pl-3 text-right text-white/30 select-none">
        {value.split('\n').map((_, line) => (
          <div key={line}>{line + 1}</div>
        ))}
      </div>
      <div className="relative min-w-0 flex-1 py-2">
        <pre aria-hidden className="m-0 min-h-full pr-4 whitespace-pre text-white/85">
          {highlight(value)}
          {'\n'}
        </pre>
        <textarea
          ref={textareaRef}
          aria-label="SQL editor"
          value={value}
          placeholder="Write a query, or click a column in the catalog to insert it"
          spellCheck={false}
          wrap="off"
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          className="absolute inset-0 resize-none overflow-hidden bg-transparent py-2 pr-4 whitespace-pre text-transparent caret-white outline-none placeholder:text-white/30 selection:bg-sky-300/30"
        />
      </div>
    </div>
  )
}
