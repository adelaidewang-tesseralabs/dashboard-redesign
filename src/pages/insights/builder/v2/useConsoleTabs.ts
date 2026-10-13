import { useRef, useState } from 'react'
import { runSql, type DataObject, type SqlResult } from '../../../../data/dataSources'

/** One open tab in the Catalog console: a table preview or a free query. */
export type ConsoleTab = {
  id: string
  title: string
  /** Set for tabs opened from the catalog tree. */
  table?: DataObject
  sql: string
  result: SqlResult | null
  /** The SQL dataset this query tab was saved as. */
  datasetId?: string
}

const CLAUSE = /\s+(FROM|WHERE|GROUP BY|HAVING|ORDER BY|LIMIT)\b/gi

/** Catalog console tabs. Lives above the Data tab so open tabs survive switching to the canvas and back. */
export function useConsoleTabs() {
  const [tabs, setTabs] = useState<ConsoleTab[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const queryCount = useRef(0)
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const active = tabs.find((tab) => tab.id === activeId) ?? null

  const open = (tab: ConsoleTab) => {
    setTabs((current) => [...current, tab])
    setActiveId(tab.id)
  }
  const update = (id: string, patch: Partial<ConsoleTab>) => setTabs((current) => current.map((tab) => (tab.id === id ? { ...tab, ...patch } : tab)))

  const openTable = (table: DataObject) => {
    const existing = tabs.find((tab) => tab.table?.name === table.name)
    if (existing) {
      setActiveId(existing.id)
      return
    }
    const sql = `SELECT *\nFROM ${table.name}`
    open({ id: crypto.randomUUID(), title: table.label, table, sql, result: runSql(sql) })
  }
  const newQuery = () => {
    queryCount.current += 1
    open({ id: crypto.randomUUID(), title: `Untitled query ${queryCount.current}`, sql: '', result: null })
  }
  const close = (id: string) => {
    const remaining = tabs.filter((tab) => tab.id !== id)
    setTabs(remaining)
    if (id === activeId) setActiveId(remaining.at(-1)?.id ?? null)
  }
  const setSql = (sql: string) => active && update(active.id, { sql })
  const run = () => active && update(active.id, { result: runSql(active.sql) })
  const format = () => active && update(active.id, { sql: active.sql.replace(CLAUSE, '\n$1').trim() })

  /** Splices a name in at the editor's caret, with a space when it would run into the word before it. */
  const insert = (text: string) => {
    const editor = editorRef.current
    if (!active || !editor) return
    const { selectionStart: start, selectionEnd: end, value } = editor
    const glued = start > 0 && !/[\s(,.]/.test(value[start - 1])
    const inserted = `${glued ? ' ' : ''}${text}`
    update(active.id, { sql: value.slice(0, start) + inserted + value.slice(end) })
    const caret = start + inserted.length
    requestAnimationFrame(() => {
      editor.focus()
      editor.setSelectionRange(caret, caret)
    })
  }

  return { tabs, active, editorRef, select: setActiveId, update, openTable, newQuery, close, setSql, run, format, insert }
}

export type ConsoleTabs = ReturnType<typeof useConsoleTabs>
