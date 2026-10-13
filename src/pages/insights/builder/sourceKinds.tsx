import type { LucideIcon } from 'lucide-react'
import { DatabaseZap, FileUp, Table2, Workflow } from 'lucide-react'
import type { SourceOrigin } from '../../../data/dataSources'
import { cn } from '../../../lib/cn'

/** Sources a dashboard can attach, in the order of the main app's dataviz "+" source menu. */
export type AddSourceKind = 'foundry' | 'workflow' | 'upload'

type OriginMeta = { label: string; Icon: LucideIcon; tile: string }

export const ORIGIN_META: Record<SourceOrigin, OriginMeta> = {
  mosaic: { label: 'Mosaic objects', Icon: Table2, tile: 'bg-white/10 text-white/70' },
  foundry: { label: 'Foundry', Icon: DatabaseZap, tile: 'bg-emerald-500/15 text-emerald-300' },
  workflow: { label: 'Workflow Output', Icon: Workflow, tile: 'bg-fuchsia-500/15 text-fuchsia-300' },
  upload: { label: 'Upload File', Icon: FileUp, tile: 'bg-sky-500/15 text-sky-300' },
}

export const ADD_SOURCE_KINDS: AddSourceKind[] = ['foundry', 'workflow', 'upload']

export function SourceIcon({ origin, size = 'sm' }: { origin: SourceOrigin; size?: 'sm' | 'lg' }) {
  const { Icon, tile } = ORIGIN_META[origin]
  return (
    <span className={cn('flex shrink-0 items-center justify-center', tile, size === 'sm' ? 'size-6 rounded-md' : 'size-9 rounded-lg')}>
      <Icon className={size === 'sm' ? 'size-3.5' : 'size-5'} />
    </span>
  )
}
