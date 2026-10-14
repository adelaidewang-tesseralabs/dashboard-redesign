import { History, RotateCcw } from 'lucide-react'
import { formatDateTime } from '../../../../lib/format'
import { Button } from '../../../../ui/Button'

type VersionPreviewBarProps = {
  number: number
  savedAt: string
  onRestore: () => void
  onBackToCurrent: () => void
}

/** Above the canvas while an older version is previewed: nothing is editable until it's restored or left. */
export function VersionPreviewBar({ number, savedAt, onRestore, onBackToCurrent }: VersionPreviewBarProps) {
  return (
    <div role="status" className="flex shrink-0 items-center gap-3 border-b border-sky-300/20 bg-sky-400/10 px-5 py-2 text-sm text-sky-50">
      <History className="size-4 shrink-0 text-sky-300" aria-hidden />
      <span className="min-w-0 flex-1 truncate">
        Viewing version {number} <span className="text-sky-100/60">· {formatDateTime(savedAt)} · read-only</span>
      </span>
      <Button variant="ghost" size="sm" onClick={onBackToCurrent}>
        Back to current
      </Button>
      <Button size="sm" onClick={onRestore}>
        <RotateCcw className="size-3.5" />
        Restore
      </Button>
    </div>
  )
}
