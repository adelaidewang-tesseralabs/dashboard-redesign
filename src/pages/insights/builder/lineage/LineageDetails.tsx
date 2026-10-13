import { useState } from 'react'
import { Columns3 } from 'lucide-react'
import { cn } from '../../../../lib/cn'
import { SearchInput } from '../../../../ui/SearchInput'
import { LINEAGE_KIND_LABELS, type LineageNode } from './lineageGraph'
import { LineageNodeIcon } from './LineageNodeIcon'

const SINGULAR: Record<LineageNode['kind'], string> = {
  upstream: 'Upstream table',
  pipeline: 'Pipeline',
  source: 'Source',
  dataset: 'Dataset',
  graph: 'Graph',
  dashboard: LINEAGE_KIND_LABELS.dashboard,
}

/** The selected node: what it is, its details, its query, and which of its columns graphs read. */
export function LineageDetails({ node }: { node: LineageNode }) {
  return (
    <aside aria-label={`${node.label} details`} className="flex w-80 shrink-0 flex-col overflow-y-auto border-l border-white/10 bg-tlai-2">
      <div className="flex items-center gap-3 border-b border-white/10 p-4">
        <LineageNodeIcon node={node} size="lg" />
        <div className="flex min-w-0 flex-col">
          <span className="text-[11px] font-medium tracking-wider text-white/45 uppercase">{SINGULAR[node.kind]}</span>
          <h3 className="truncate text-sm font-semibold text-white" title={node.label}>
            {node.label}
          </h3>
        </div>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 border-b border-white/10 p-4 text-xs">
        {node.details.map(({ label, value }) => (
          <div key={label} className="contents">
            <dt className="text-white/55">{label}</dt>
            <dd className="min-w-0 text-right break-words text-white/90">{value}</dd>
          </div>
        ))}
      </dl>

      {node.sql && (
        <div className="border-b border-white/10 p-4">
          <h4 className="mb-2 text-xs font-medium text-white/70">Query</h4>
          <pre className="overflow-x-auto rounded-md bg-tlai-1 p-3 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-white/80">{node.sql}</pre>
        </div>
      )}

      {node.columnRoles && node.columnRoles.length > 0 && (
        <div className="flex flex-col gap-2 p-4">
          <h4 className="text-xs font-medium text-white/70">Columns used · {node.columnRoles.length}</h4>
          <ul className="flex flex-col">
            {node.columnRoles.map(({ column, roles }) => (
              <li key={column} className="flex min-h-8 items-center gap-2 rounded-md px-2 py-1 text-xs text-white/85">
                <Columns3 className="size-3.5 shrink-0 text-white/40" aria-hidden />
                <span className="min-w-0 flex-1 truncate font-mono">{column}</span>
                <span className="flex shrink-0 flex-wrap justify-end gap-1">
                  {roles.map((role) => (
                    <span key={role} className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/70">
                      {role}
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {node.columns.length > 0 && <ColumnList node={node} />}
    </aside>
  )
}

/** Datasets and sources: columns graphs read come first and say how many; "Used only" hides the rest. */
function ColumnList({ node }: { node: LineageNode }) {
  const [query, setQuery] = useState('')
  const [usedOnly, setUsedOnly] = useState(false)
  const users = node.columnUsers ?? {}
  const usedCount = Object.keys(users).length
  const needle = query.trim().toLowerCase()
  const columns = node.columns
    .filter((column) => column.toLowerCase().includes(needle) && (!usedOnly || users[column]))
    .toSorted((a, b) => Number(!users[a]) - Number(!users[b]))
  const tracksUse = node.kind === 'dataset' || node.kind === 'source'

  return (
    <div className="flex min-h-0 flex-col gap-2 p-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs font-medium text-white/70">
          Columns · {node.columns.length}
          {tracksUse && <span className="text-white/45"> · {usedCount} used by graphs</span>}
        </h4>
        {tracksUse && usedCount > 0 && (
          <button
            type="button"
            aria-pressed={usedOnly}
            onClick={() => setUsedOnly((current) => !current)}
            className={cn('h-6 cursor-pointer rounded-md px-2 text-[11px] text-white/60 hover:bg-white/10 hover:text-white', usedOnly && 'bg-white/10 text-white')}
          >
            Used only
          </button>
        )}
      </div>
      {node.columns.length > 6 && <SearchInput value={query} onChange={setQuery} placeholder="Search columns" />}
      <ul className="flex flex-col">
        {columns.map((column) => {
          const graphs = users[column]
          return (
            <li key={column} title={graphs?.join('\n')} className="flex h-8 items-center gap-2 rounded-md px-2 text-xs hover:bg-white/5">
              <Columns3 className={cn('size-3.5 shrink-0', graphs ? 'text-tlai-mint' : 'text-white/30')} aria-hidden />
              <span className={cn('min-w-0 flex-1 truncate font-mono', graphs || !tracksUse ? 'text-white/85' : 'text-white/45')}>{column}</span>
              {graphs && (
                <span className="shrink-0 text-[11px] text-white/55">
                  {graphs.length} graph{graphs.length === 1 ? '' : 's'}
                </span>
              )}
            </li>
          )
        })}
        {columns.length === 0 && <li className="px-2 py-3 text-xs text-white/50">{needle ? `No columns match "${query.trim()}"` : 'No graph reads these columns'}</li>}
      </ul>
    </div>
  )
}
