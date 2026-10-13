import { Copy, Download, MoreHorizontal, Rows3, Trash2 } from 'lucide-react'
import { cn } from '../../../lib/cn'
import { Menu, type MenuEntry } from '../../../ui/Menu'

export type WidgetActions = {
  /** Omitted for the page summary, which there's only ever one of. */
  onDuplicate?: () => void
  onRemove: () => void
  /** Omitted for the page summary, which stays pinned above the grid. */
  move?: {
    /** Builder V6 sections on this page; empty without sections. */
    sections: { id: string; name: string }[]
    /** The section the graph sits in, or null above the first one. */
    sectionId: string | null
    onMove: (sectionId: string | null) => void
  }
  /** Builder V6 only. */
  onAddSectionAbove?: () => void
}

type GraphActionsMenuProps = {
  label: string
  /** Editors only. */
  actions?: WidgetActions
  /** Graphs only: saves the rows the graph shows. */
  onDownload?: () => void
  className?: string
}

/** The "…" on a canvas item. Editing actions also have shortcuts: ⌘C / ⌘V duplicates, ⌘ Delete removes. */
export function GraphActionsMenu({ label, actions, onDownload, className }: GraphActionsMenuProps) {
  const items = menuItems(actions, onDownload)
  if (items.length === 0) return null
  return (
    // Clicks stay here so opening the menu doesn't also select the graph underneath.
    <div onClick={(event) => event.stopPropagation()} className={className}>
      <Menu
        items={items}
        trigger={({ open, toggle }) => (
          <button
            type="button"
            aria-label={`Actions for ${label}`}
            data-popover-open={open || undefined}
            onClick={toggle}
            className={cn(
              'flex size-6 cursor-pointer items-center justify-center rounded text-[var(--dash-faint)] transition-opacity hover:bg-[var(--dash-canvas)] hover:text-[var(--dash-fg)]',
              open ? 'opacity-100' : 'opacity-0 group-hover/widget:opacity-100 focus-visible:opacity-100 in-data-selected:opacity-100',
            )}
          >
            <MoreHorizontal className="size-4" />
          </button>
        )}
      />
    </div>
  )
}

/** Sections can share a name, so repeats get a number to tell them apart. */
function sectionLabel(sections: NonNullable<WidgetActions['move']>['sections'], index: number) {
  const { name } = sections[index]
  const repeat = sections.slice(0, index).filter((section) => section.name === name).length
  return repeat ? `${name} (${repeat + 1})` : name
}

function menuItems(actions: WidgetActions | undefined, onDownload: (() => void) | undefined): MenuEntry[] {
  const download: MenuEntry[] = onDownload ? [{ label: 'Download CSV', Icon: Download, onSelect: onDownload }] : []
  if (!actions) return download
  const { onDuplicate, onRemove, move: moveTo, onAddSectionAbove } = actions
  const duplicate: MenuEntry[] = onDuplicate ? [{ label: 'Duplicate', Icon: Copy, onSelect: onDuplicate }] : []
  const addSection: MenuEntry[] = onAddSectionAbove ? [{ label: 'Add section above', Icon: Rows3, onSelect: onAddSectionAbove }] : []
  const move: MenuEntry[] = moveTo?.sections.length
    ? [
        { type: 'separator' },
        { type: 'label', label: 'Move to section' },
        { label: 'No section', onSelect: () => moveTo.onMove(null), active: moveTo.sectionId === null },
        ...moveTo.sections.map((section, index) => ({
          label: sectionLabel(moveTo.sections, index),
          onSelect: () => moveTo.onMove(section.id),
          active: moveTo.sectionId === section.id,
        })),
      ]
    : []
  const opening = [...duplicate, ...download, ...addSection, ...move]
  return [
    ...opening,
    ...(opening.length ? [{ type: 'separator' } as const] : []),
    { label: 'Remove', Icon: Trash2, danger: true, onSelect: onRemove },
  ]
}
