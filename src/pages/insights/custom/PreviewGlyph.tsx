import { Image } from 'lucide-react'
import type { ChartStyle } from '../../../data/widgets'

/** What a thumbnail tile draws: a graph style, a text or media block, or the dashboard's own quality score. */
export type GlyphKind = ChartStyle | 'text' | 'media' | 'score'

type PreviewGlyphProps = {
  kind: GlyphKind
  colors: readonly string[]
  /** Varies bar heights, line shape and slice sizes so graphs of one style don't look identical. */
  seed: string
  score?: string
}

/** Stylised miniature of one widget; shapes are seeded, colors are the widget's real ones. */
export function PreviewGlyph({ kind, colors, seed, score }: PreviewGlyphProps) {
  const random = seededRandom(seed)
  switch (kind) {
    case 'bar': {
      const heights = Array.from({ length: 3 + Math.floor(random() * 3) }, () => 30 + random() * 70)
      return (
        <div className="flex h-full items-end gap-[2px]">
          {heights.map((height, index) => (
            <span key={index} className="flex-1 rounded-t-[1px]" style={{ height: `${height}%`, backgroundColor: colors[index % colors.length] }} />
          ))}
        </div>
      )
    }
    case 'line':
    case 'area': {
      const values = Array.from({ length: 6 }, () => 4 + random() * 16)
      const points = values.map((value, index) => `${(index / (values.length - 1)) * 40},${value}`).join(' ')
      return (
        <svg viewBox="0 0 40 24" preserveAspectRatio="none" className="size-full overflow-visible">
          {kind === 'area' && <polygon points={`0,24 ${points} 40,24`} fill={colors[0]} fillOpacity={0.25} />}
          <polyline points={points} fill="none" stroke={colors[0]} strokeWidth={1.25} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
      )
    }
    case 'pie': {
      const shares = Array.from({ length: 2 + Math.floor(random() * 3) }, () => 0.5 + random() * 3)
      return (
        <div className="flex h-full items-center justify-center gap-[12%]">
          <svg viewBox="0 0 24 24" className="h-[85%] max-h-16 shrink-0">
            {arcs(shares).map(([start, end], index) => (
              <path key={index} d={donutArc(start, end)} fill={colors[index % colors.length]} />
            ))}
          </svg>
          <div className="flex w-1/4 flex-col gap-[3px]">
            {shares.map((share, index) => (
              <span key={index} className="flex items-center gap-[3px]">
                <span className="size-[4px] shrink-0 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                <span className="h-[3px] rounded-full bg-white/15" style={{ width: `${40 + (share / 3.5) * 60}%` }} />
              </span>
            ))}
          </div>
        </div>
      )
    }
    case 'gauge':
      return (
        <svg viewBox="0 0 24 14" className="size-full">
          <path d="M 3 12 A 9 9 0 0 1 21 12" fill="none" stroke="currentColor" strokeOpacity={0.12} strokeWidth={3} />
          <path d="M 3 12 A 9 9 0 0 1 21 12" fill="none" stroke={colors[0]} strokeWidth={3} pathLength={100} strokeDasharray={`${50 + random() * 40} 100`} />
        </svg>
      )
    case 'metric':
      return (
        <div className="flex h-full flex-col justify-center gap-1">
          <span className="h-2 w-2/3 rounded-full bg-white/60" />
          <span className="h-[3px] w-1/2 rounded-full bg-white/15" />
        </div>
      )
    case 'score': {
      const values = Array.from({ length: 7 }, (_, index) => 18 - index * 1.6 - random() * 6)
      const points = values.map((value, index) => `${(index / (values.length - 1)) * 40},${value}`).join(' ')
      return (
        <div className="flex h-full flex-col justify-between gap-1">
          {score ? <span className="text-xs leading-none font-semibold text-white/85">{score}</span> : <span className="h-2 w-2/3 rounded-full bg-white/30" />}
          <svg viewBox="0 0 40 20" preserveAspectRatio="none" className="h-1/2 w-full overflow-visible">
            <polyline points={points} fill="none" stroke={colors[0]} strokeWidth={1.25} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
      )
    }
    case 'table':
      return (
        <div className="flex h-full flex-col justify-center gap-[3px]">
          {[0, 1, 2, 3].map((row) => (
            <span key={row} className="flex gap-[3px]">
              <span className="h-[3px] flex-[2] rounded-full bg-white/20" />
              <span className="h-[3px] flex-1 rounded-full bg-white/10" />
            </span>
          ))}
        </div>
      )
    case 'text':
      return (
        <div className="flex h-full flex-col gap-[3px] pt-0.5">
          {[90, 75, 55].map((width) => (
            <span key={width} className="h-[3px] rounded-full bg-white/15" style={{ width: `${width}%` }} />
          ))}
        </div>
      )
    case 'media':
      return (
        <div className="flex h-full items-center justify-center rounded-[2px] bg-white/[0.04]">
          <Image className="size-3 text-white opacity-30" />
        </div>
      )
    default: {
      const unhandled: never = kind
      return unhandled
    }
  }
}

/** FNV-1a into mulberry32: near-identical ids ("…-1", "…-2") still get unrelated shapes. */
function seededRandom(seed: string) {
  let state = 2166136261
  for (let i = 0; i < seed.length; i++) state = Math.imul(state ^ seed.charCodeAt(i), 16777619)
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32
  }
}

function arcs(shares: number[]): [number, number][] {
  const total = shares.reduce((sum, share) => sum + share, 0)
  let offset = 0
  return shares.map((share) => {
    const start = offset
    offset += share / total
    return [start, offset]
  })
}

function donutArc(start: number, end: number) {
  const [outer, inner] = [11, 6.5]
  const polar = (radius: number, t: number) => {
    const angle = t * Math.PI * 2 - Math.PI / 2
    return `${12 + Math.cos(angle) * radius} ${12 + Math.sin(angle) * radius}`
  }
  const large = end - start > 0.5 ? 1 : 0
  return `M ${polar(outer, start)} A ${outer} ${outer} 0 ${large} 1 ${polar(outer, end)} L ${polar(inner, end)} A ${inner} ${inner} 0 ${large} 0 ${polar(inner, start)} Z`
}
