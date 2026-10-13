import { PanelLeftClose } from 'lucide-react'

/** Header button on the Data tab's left column; the rail's icons bring it back. */
export function CollapseListButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Collapse panel"
      title="Collapse panel"
      onClick={onClick}
      className="flex size-7 cursor-pointer items-center justify-center rounded text-white/60 hover:bg-white/10 hover:text-white"
    >
      <PanelLeftClose className="size-4" />
    </button>
  )
}
