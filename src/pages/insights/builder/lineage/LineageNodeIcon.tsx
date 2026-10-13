import { Database, FileCode2, LayoutDashboard, Table2, TriangleAlert, Workflow } from 'lucide-react'
import type { PipelineStatus } from '../../../../data/catalogLineage'
import { cn } from '../../../../lib/cn'
import { CHART_STYLE_META } from '../chartStyles'
import { ORIGIN_META } from '../sourceKinds'
import type { LineageNode } from './lineageGraph'

const PIPELINE_TILES: Record<PipelineStatus, string> = {
  succeeded: 'bg-sky-500/15 text-sky-300',
  running: 'bg-sky-500/15 text-sky-300',
  failed: 'bg-red-500/15 text-red-300',
}

function iconOf(node: LineageNode) {
  switch (node.kind) {
    case 'upstream':
      return { Icon: Database, tile: 'bg-white/10 text-white/60' }
    case 'pipeline':
      return { Icon: Workflow, tile: PIPELINE_TILES[node.status ?? 'succeeded'] }
    case 'source':
      return node.origin ? { Icon: ORIGIN_META[node.origin].Icon, tile: ORIGIN_META[node.origin].tile } : { Icon: TriangleAlert, tile: 'bg-red-500/15 text-red-300' }
    case 'dataset':
      return { Icon: node.query ? FileCode2 : Table2, tile: 'bg-amber-500/15 text-amber-300' }
    case 'graph':
      return { Icon: node.chart ? CHART_STYLE_META[node.chart].Icon : Table2, tile: 'bg-tlai-mint/15 text-tlai-mint' }
    case 'dashboard':
      return { Icon: LayoutDashboard, tile: 'bg-violet-500/15 text-violet-300' }
    default: {
      const unhandled: never = node.kind
      return unhandled
    }
  }
}

export function LineageNodeIcon({ node, size = 'sm' }: { node: LineageNode; size?: 'sm' | 'lg' }) {
  const { Icon, tile } = iconOf(node)
  return (
    <span className={cn('flex shrink-0 items-center justify-center', tile, size === 'sm' ? 'size-8 rounded-md' : 'size-10 rounded-lg')}>
      <Icon className={size === 'sm' ? 'size-4' : 'size-5'} />
    </span>
  )
}
