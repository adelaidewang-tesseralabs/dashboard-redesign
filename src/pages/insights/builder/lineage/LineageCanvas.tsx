import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Maximize, Minus, Plus } from 'lucide-react'
import { cn } from '../../../../lib/cn'
import { SearchInput } from '../../../../ui/SearchInput'
import { LINEAGE_KIND_LABELS, downstreamOf, upstreamOf, type Lineage } from './lineageGraph'
import { edgePath, layoutLineage, NODE_H, NODE_W } from './lineageLayout'
import { LineageNodeIcon } from './LineageNodeIcon'

const MIN_SCALE = 0.25
const MAX_SCALE = 1.5
const SCALE_STEP = 0.1
const OPENING_MIN_SCALE = 0.8

type LineageCanvasProps = {
  lineage: Lineage
  selectedId: string
  onSelect: (nodeId: string) => void
  /** Scroll the selected node into view on open, instead of starting at the sources. */
  revealSelected?: boolean
  /** Floats top right, opposite the search. */
  toolbar?: ReactNode
}

const clampScale = (scale: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.round(scale * 100) / 100))

/** Nodes left to right with the selected node's path lit. Search dims what doesn't match; Enter selects the first match. */
export function LineageCanvas({ lineage, selectedId, onSelect, revealSelected = false, toolbar }: LineageCanvasProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [query, setQuery] = useState('')
  const layout = layoutLineage(lineage.nodes)
  const path = new Set([...upstreamOf(lineage.edges, selectedId), ...downstreamOf(lineage.edges, selectedId)])
  const needle = query.trim().toLowerCase()
  const matches = needle ? lineage.nodes.filter((node) => node.label.toLowerCase().includes(needle)) : lineage.nodes
  const matchIds = new Set(matches.map((node) => node.id))

  const fitScale = () => {
    const viewport = viewportRef.current
    return viewport ? clampScale(Math.min(1, viewport.clientWidth / layout.width, viewport.clientHeight / layout.height)) : 1
  }
  const fit = () => setScale(fitScale())
  // Opens zoomed out to fit, but never so far that labels get hard to read; the rest scrolls.
  useLayoutEffect(() => setScale(Math.max(OPENING_MIN_SCALE, fitScale())), [])
  useEffect(() => {
    if (!revealSelected) return
    const frame = requestAnimationFrame(() => viewportRef.current?.querySelector('[aria-pressed="true"]')?.scrollIntoView({ block: 'center', inline: 'center' }))
    return () => cancelAnimationFrame(frame)
  }, [revealSelected])

  return (
    <div className="relative flex min-h-0 min-w-0 flex-1">
      <div ref={viewportRef} className="flex min-h-0 min-w-0 flex-1 overflow-auto bg-tlai-1 bg-[radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] bg-size-[18px_18px]">
        <div className="relative m-auto shrink-0" style={{ width: layout.width * scale, height: layout.height * scale }}>
          <div className="absolute top-0 left-0 origin-top-left" style={{ width: layout.width, height: layout.height, transform: `scale(${scale})` }}>
            {layout.headers.map(({ kind, x, count }) => (
              <div key={kind} className="absolute top-8 text-[11px] font-medium tracking-wider text-white/45 uppercase" style={{ left: x, width: NODE_W }}>
                {LINEAGE_KIND_LABELS[kind]} · {count}
              </div>
            ))}
            <svg width={layout.width} height={layout.height} className="pointer-events-none absolute inset-0" aria-hidden>
              {lineage.edges.map(({ from, to }) => {
                const start = layout.positions.get(from)
                const end = layout.positions.get(to)
                if (!start || !end) return null
                const lit = path.has(from) && path.has(to)
                return <path key={`${from}->${to}`} d={edgePath(start, end)} fill="none" strokeWidth={lit ? 1.75 : 1.25} className={lit ? 'stroke-tlai-mint/70' : 'stroke-white/15'} />
              })}
            </svg>
            {lineage.nodes.map((node) => {
              const position = layout.positions.get(node.id)
              if (!position) return null
              const selected = node.id === selectedId
              return (
                <button
                  key={node.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onSelect(node.id)}
                  className={cn(
                    'absolute flex cursor-pointer items-center gap-2.5 rounded-lg border bg-tlai-3 px-3 text-left shadow-sm transition-[opacity,border-color]',
                    selected ? 'border-tlai-mint/70 ring-1 ring-tlai-mint/40' : 'border-white/10 hover:border-white/30',
                    node.unused && !selected && 'border-dashed border-white/25 bg-tlai-2',
                    node.status === 'failed' && !selected && 'border-red-400/40',
                    (!path.has(node.id) || !matchIds.has(node.id)) && 'opacity-35',
                    needle && matchIds.has(node.id) && !selected && 'border-white/40',
                  )}
                  style={{ left: position.x, top: position.y, width: NODE_W, height: NODE_H }}
                >
                  <LineageNodeIcon node={node} />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-[13px] font-medium text-white">{node.label}</span>
                    <span className="truncate text-xs text-white/55">{node.caption}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          if (needle && matches[0]) onSelect(matches[0].id)
        }}
        className="absolute top-3 left-3 w-64 shadow-lg"
      >
        <SearchInput value={query} onChange={setQuery} placeholder="Search lineage" />
      </form>

      {toolbar && <div className="absolute top-3 right-3 shadow-lg">{toolbar}</div>}

      <div className="absolute bottom-3 left-3 flex items-center gap-0.5 rounded-lg border border-white/10 bg-tlai-3 p-0.5 shadow-lg">
        <ZoomButton label="Zoom out" onClick={() => setScale((current) => clampScale(current - SCALE_STEP))} disabled={scale <= MIN_SCALE}>
          <Minus className="size-4" />
        </ZoomButton>
        <span className="w-11 text-center text-xs text-white/70 tabular-nums">{Math.round(scale * 100)}%</span>
        <ZoomButton label="Zoom in" onClick={() => setScale((current) => clampScale(current + SCALE_STEP))} disabled={scale >= MAX_SCALE}>
          <Plus className="size-4" />
        </ZoomButton>
        <span className="mx-0.5 h-5 w-px bg-white/10" />
        <ZoomButton label="Fit to screen" onClick={fit}>
          <Maximize className="size-3.5" />
        </ZoomButton>
      </div>
    </div>
  )
}

function ZoomButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="flex size-7 cursor-pointer items-center justify-center rounded-md text-white/70 hover:bg-white/10 hover:text-white disabled:cursor-default disabled:opacity-40"
    >
      {children}
    </button>
  )
}
