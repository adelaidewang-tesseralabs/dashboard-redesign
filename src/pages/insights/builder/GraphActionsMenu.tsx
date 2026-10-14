import { Copy, Database, Download, FolderInput, Link2, Maximize2, Minimize2, MoreHorizontal, Plus, Rows3, Sparkles, Trash2, Waypoints } from 'lucide-react'
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
  /** Final builder, in place of sections. */
  moveToPage?: {
    /** The other pages. */
    pages: { id: string; name: string }[]
    onMove: (pageId: string) => void
    onMoveToNewPage: () => void
  }
}

/** Graphs only. Viewers get full screen, copy link (not in Final) and downloads; lineage and the dataset are for owners and editors. */
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
  /** Narrow cards drop the full screen, copy link and download buttons, so the menu carries them instead. */
  viewInMenu?: boolean
  /** Final builder: no full screen or copy link anywhere, so download is the only viewing action. */
  downloadOnly?: boolean
  /** Set when the Ask AI button is folded into the menu too. */
  onAskAi?: () => void
}

/** Icon buttons in a canvas item's top-right toolbar. */
export const graphToolButtonClass =
  'flex size-6 cursor-pointer items-center justify-center rounded text-[var(--dash-faint)] hover:bg-[var(--dash-canvas)] hover:text-[var(--dash-fg)] data-popover-open:bg-[var(--dash-canvas)] data-popover-open:text-[var(--dash-fg)]'

/** The "…" on a canvas item. Editing actions also have shortcuts: ⌘C / ⌘V duplicates, ⌘ Delete removes. */
export function GraphActionsMenu({ label, actions, view, viewInMenu = false, downloadOnly = false, onAskAi }: GraphActionsMenuProps) {
  const askAi: MenuEntry[] = onAskAi ? [{ label: 'Ask AI', Icon: Sparkles, onSelect: onAskAi }] : []
  const items = joinGroups([askAi, menuItems(actions, view, viewInMenu, downloadOnly)])
  if (items.length === 0) return null
  return (
    <Menu
      items={items}
      surfaceClassName="w-64"
      trigger={({ open, toggle }) => (
        <button type="button" aria-label={`Actions for ${label}`} title="More actions" data-popover-open={open || undefined} onClick={toggle} className={graphToolButtonClass}>
          <MoreHorizontal className="size-4" />
        </button>
      )}
    />
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

function viewGroup(view: GraphViewActions | undefined, downloadOnly: boolean): MenuEntry[] {
  if (!view) return []
  const { fullScreen, onCopyLink, onDownloadCsv, onDownloadPng } = view
  const opening: MenuEntry[] = [
    fullScreen.open
      ? { label: 'Exit full screen', Icon: Minimize2, onSelect: fullScreen.onToggle }
      : { label: 'View full screen', Icon: Maximize2, onSelect: fullScreen.onToggle },
    { label: 'Copy link', Icon: Link2, onSelect: onCopyLink },
  ]
  return [
    ...(downloadOnly ? [] : opening),
    {
      type: 'submenu',
      label: 'Download',
      Icon: Download,
      items: [
        { label: 'Download CSV', onSelect: onDownloadCsv },
        { label: 'Download PNG', onSelect: onDownloadPng },
      ],
    },
  ]
}

function dataGroup(view: GraphViewActions | undefined): MenuEntry[] {
  if (!view) return []
  const { onViewLineage, dataset } = view
  return [
    ...(onViewLineage ? [{ label: 'View lineage', Icon: Waypoints, onSelect: onViewLineage }] : []),
    ...(dataset ? [{ label: `View dataset: ${dataset.label}`, Icon: Database, onSelect: dataset.onOpen }] : []),
  ]
}

function menuItems(actions: WidgetActions | undefined, view: GraphViewActions | undefined, viewInMenu: boolean, downloadOnly: boolean): MenuEntry[] {
  const opening = viewInMenu ? viewGroup(view, downloadOnly) : []
  const data = dataGroup(view)
  if (!actions) return joinGroups([opening, data])
  const { onDuplicate, onRemove, move: moveTo, onAddSectionAbove, moveToPage } = actions
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
    ...(moveToPage
      ? [
          {
            type: 'submenu' as const,
            label: 'Move to page',
            Icon: FolderInput,
            items: [
              ...moveToPage.pages.map((page) => ({ label: page.name, onSelect: () => moveToPage.onMove(page.id) })),
              { label: 'New page', Icon: Plus, onSelect: moveToPage.onMoveToNewPage },
            ],
          },
        ]
      : []),
  ]
  return joinGroups([opening, editing, data, [{ label: 'Remove', Icon: Trash2, danger: true, onSelect: onRemove }]])
}
