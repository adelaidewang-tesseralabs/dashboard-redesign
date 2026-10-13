import { ArrowUpRight, ChartColumn } from 'lucide-react'
import { isGraph, type CanvasItem } from '../../../../data/widgets'
import { Button } from '../../../../ui/Button'
import { displayTitle, itemLabel } from '../canvasItems'
import { CHART_STYLE_META } from '../chartStyles'

type DatasetUsedInProps = {
  items: CanvasItem[]
  onOpen: (itemId: string) => void
  onCreateGraph: () => void
}

/** Graphs built on a dataset; each opens on the canvas with its settings panel. */
export function DatasetUsedIn({ items, onOpen, onCreateGraph }: DatasetUsedInProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-start gap-3 text-sm text-white/45">
        No graphs use this dataset yet.
        <Button variant="outline" size="sm" onClick={onCreateGraph}>
          <ChartColumn className="size-3.5" />
          Create graph
        </Button>
      </div>
    )
  }
  return (
    <ul className="flex flex-col gap-1">
      {items.filter(isGraph).map((item) => {
        const { Icon, label } = CHART_STYLE_META[item.chart]
        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onOpen(item.id)}
              className="group flex w-full cursor-pointer items-center gap-3 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-left hover:border-white/20 hover:bg-white/5"
            >
              <Icon className="size-4 shrink-0 text-white/55" />
              <span className="min-w-0 flex-1 truncate text-[13px] text-white">{displayTitle(item) || itemLabel(item)}</span>
              <span className="text-xs text-white/45">{label}</span>
              <span className="flex items-center gap-1 text-xs text-white/45 group-hover:text-white">
                Open on canvas
                <ArrowUpRight className="size-3.5" />
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
