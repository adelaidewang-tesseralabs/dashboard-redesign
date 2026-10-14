import type { FilterColumn } from '../dashboardFilters'

type AddFieldPanelProps = {
  /** The dataset's filterable columns that aren't preset yet. */
  columns: FilterColumn[]
  onAdd: (column: FilterColumn) => void
}

/** Editors pick a column of the dataset to preset. It starts on this page; the field's panel can widen it to every page. */
export function AddFieldPanel({ columns, onAdd }: AddFieldPanelProps) {
  return (
    <div className="flex w-full flex-col gap-3 text-left">
      <span className="text-sm font-medium text-white">Add a field</span>
      {columns.length === 0 ? (
        <p className="text-xs text-white/50">Every field with a short list of values is already here.</p>
      ) : (
        <ul className="flex max-h-48 flex-col gap-0.5 overflow-y-auto">
          {columns.map((column) => (
            <li key={column.column}>
              <button
                type="button"
                onClick={() => onAdd(column)}
                className="flex min-h-[30px] w-full cursor-pointer items-center justify-between gap-2 rounded px-1.5 text-xs text-white/80 hover:bg-white/10 hover:text-white"
              >
                <span className="truncate">{column.label}</span>
                <span className="shrink-0 text-[11px] text-white/45">{column.values.length} values</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
