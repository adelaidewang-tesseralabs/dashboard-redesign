import { useState } from 'react'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import type { Dashboard } from '../../../../data/dashboards'
import { cn } from '../../../../lib/cn'
import { Button } from '../../../../ui/Button'
import { LineageCanvas } from './LineageCanvas'
import { LineageDetails } from './LineageDetails'
import { buildLineage, DASHBOARD_NODE_ID, graphNodeId, withoutUnused, type LineageTarget } from './lineageGraph'

type LineageViewProps = {
  dashboard: Dashboard
  target: LineageTarget
  onBack: () => void
}

/** How a graph, or every graph on the dashboard, is built: upstream tables → pipelines → sources → datasets → graphs → dashboard. */
export function LineageView({ dashboard, target, onBack }: LineageViewProps) {
  const [showUnused, setShowUnused] = useState(false)
  const full = buildLineage(dashboard, target)
  const unusedDatasets = full.nodes.filter((node) => node.unused && node.kind === 'dataset').length
  const lineage = showUnused ? full : withoutUnused(full)
  const targetId = target.kind === 'graph' ? graphNodeId(target.itemId) : DASHBOARD_NODE_ID
  const [selectedId, setSelectedId] = useState(targetId)
  const selected = lineage.nodes.find((node) => node.id === selectedId) ?? lineage.nodes.find((node) => node.id === targetId)
  const title = target.kind === 'graph' ? lineage.nodes.find((node) => node.id === targetId)?.label : dashboard.name
  const unusedToggle = unusedDatasets > 0 && (
    <button
      type="button"
      aria-pressed={showUnused}
      onClick={() => setShowUnused((current) => !current)}
      className={cn(
        'flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-tlai-3 px-3 text-xs text-white/75 hover:border-white/25 hover:text-white',
        showUnused && 'border-white/25 text-white',
      )}
    >
      {showUnused ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
      {showUnused ? 'Hide' : 'Show'} unused datasets · {unusedDatasets}
    </button>
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b border-white/10 px-5 py-2">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="size-4" />
          Back to dashboard
        </Button>
        <span className="h-5 w-px bg-white/10" />
        <h2 className="truncate text-sm text-white">
          <span className="text-white/55">Lineage · </span>
          {title ?? 'Graph removed'}
        </h2>
      </div>
      {selected ? (
        <div className="flex min-h-0 flex-1">
          <LineageCanvas lineage={lineage} selectedId={selected.id} onSelect={setSelectedId} revealSelected={target.kind === 'graph'} toolbar={unusedToggle || undefined} />
          <LineageDetails key={selected.id} node={selected} />
        </div>
      ) : (
        <p className="p-10 text-center text-sm text-white/55">This graph is no longer on the dashboard.</p>
      )}
    </div>
  )
}
