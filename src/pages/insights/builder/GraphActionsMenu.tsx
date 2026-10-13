import { Copy, Database, Download, FolderInput, Link2, Maximize2, Minimize2, MoreHorizontal, Rows3, Trash2, Waypoints } from 'lucide-react'
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

/** Graphs only. Viewers get full screen, copy link and downloads; lineage and the dataset are for owners and editors. */
export type GraphViewActions = {
  fullScreen: { open: boolean; onToggle: () => void }
  onCopyLink: () => void
  onDownloadPng: () => void
  onDownloadCsv: () => void
  onViewLineage?: () => void
  dataset?: { label: string; onOpen: () => void }
}

type GraphActionsMenuProps = {
  label: string
  /** Owners and editors only. */
  actions?: WidgetActions
  view?: GraphViewActions
  className?: string
}

/** The "…" on a canvas item. Editing actions also have shortcuts: ⌘C / ⌘V duplicates, ⌘ Delete removes. */
export function GraphActionsMenu({ label, actions, view, className }: GraphActionsMenuProps) {
  const items = menuItems(actions, view)
  if (items.length === 0) return null
  return (
    // Clicks stay here so opening the menu doesn't also select the graph underneath. Left out of PNG downloads.
    <div data-capture-ignore onClick={(event) => event.stopPropagation()} className={className}>
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
              open || view?.fullScreen.open ? 'opacity-100' : 'opacity-0 group-hover/widget:opacity-100 focus-visible:opacity-100 in-data-selected:opacity-100',
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

/** Groups in order, with a separator between each non-empty one. */
function joinGroups(groups: MenuEntry[][]): MenuEntry[] {
  return groups.filter((group) => group.length > 0).flatMap((group, index) => (index ? [{ type: 'separator' } as const, ...group] : group))
}

function viewGroups(view: GraphViewActions | undefined): { opening: MenuEntry[]; data: MenuEntry[] } {
  if (!view) return { opening: [], data: [] }
  const { fullScreen, onCopyLink, onDownloadPng, onDownloadCsv, onViewLineage, dataset } = view
  const download: MenuEntry = {
    type: 'submenu',
    label: 'Download',
    Icon: Download,
    items: [
      { label: 'Download CSV', onSelect: onDownloadCsv },
      { label: 'Download PNG', onSelect: onDownloadPng },
    ],
  }
  return {
    opening: [
      fullScreen.open
        ? { label: 'Exit full screen', Icon: Minimize2, onSelect: fullScreen.onToggle }
        : { label: 'View full screen', Icon: Maximize2, onSelect: fullScreen.onToggle },
      { label: 'Copy link', Icon: Link2, onSelect: onCopyLink },
      download,
    ],
    data: [
      ...(onViewLineage ? [{ label: 'View lineage', Icon: Waypoints, onSelect: onViewLineage }] : []),
      ...(dataset ? [{ label: `View dataset: ${dataset.label}`, Icon: Database, onSelect: dataset.onOpen }] : []),
    ],
  }
}

function menuItems(actions: WidgetActions | undefined, view: GraphViewActions | undefined): MenuEntry[] {
  const { opening, data } = viewGroups(view)
  if (!actions) return joinGroups([opening, data])
  const { onDuplicate, onRemove, move: moveTo, onAddSectionAbove } = actions
  const editing: MenuEntry[] = [
    ...(onAddSectionAbove ? [{ label: 'Add section above', Icon: Rows3, onSelect: onAddSectionAbove }] : []),
    ...(onDuplicate ? [{ label: 'Duplicate', Icon: Copy, onSelect: onDuplicate }] : []),
    ...(moveTo?.sections.length
      ? [
          {
            type: 'submenu' as const,
            label: 'Move to section',
            Icon: FolderInput,
            items: [
              { label: 'No section', onSelect: () => moveTo.onMove(null), active: moveTo.sectionId === null },
              ...moveTo.sections.map((section, index) => ({
                label: sectionLabel(moveTo.sections, index),
                onSelect: () => moveTo.onMove(section.id),
                active: moveTo.sectionId === section.id,
              })),
            ],
          },
        ]
      : []),
  ]
  return joinGroups([opening, editing, data, [{ label: 'Remove', Icon: Trash2, danger: true, onSelect: onRemove }]])
}
