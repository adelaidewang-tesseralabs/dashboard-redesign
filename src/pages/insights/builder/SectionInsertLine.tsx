import { Plus } from 'lucide-react'

type SectionInsertLineProps = {
  /** Pixel offset of the gap's centre within the grid. */
  top: number
  onAdd: () => void
}

/** A strip over the gap between two rows of graphs that reveals "Add section" on hover. */
export function SectionInsertLine({ top, onAdd }: SectionInsertLineProps) {
  return (
    // The strip is exactly the gap, so it never covers a graph's edge or resize handle until it's revealed.
    <div style={{ top }} className="group/insert absolute inset-x-0 z-10 flex h-3 -translate-y-1/2 items-center">
      <div className="pointer-events-none flex w-full items-center gap-2 opacity-0 transition-opacity group-hover/insert:pointer-events-auto group-hover/insert:opacity-100 group-hover/insert:delay-150 has-focus-visible:pointer-events-auto has-focus-visible:opacity-100">
        <span className="h-px flex-1 bg-[var(--dash-selected)]" />
        <button
          type="button"
          onClick={onAdd}
          className="flex h-6 cursor-pointer items-center gap-1 rounded-full border border-[var(--dash-border)] bg-[var(--dash-card)] px-2.5 text-xs text-[var(--dash-fg)] shadow-sm hover:border-[var(--dash-selected)]"
        >
          <Plus className="size-3" />
          Add section
        </button>
        <span className="h-px flex-1 bg-[var(--dash-selected)]" />
      </div>
    </div>
  )
}
