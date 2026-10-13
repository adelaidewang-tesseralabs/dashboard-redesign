import { useState } from 'react'
import { ArrowLeft, ArrowRight, Copy, EyeOff, Eye, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import type { DashboardPage } from '../../../../data/dashboards'
import { cn } from '../../../../lib/cn'
import { Menu, type MenuEntry } from '../../../../ui/Menu'

type PageTabsProps = {
  pages: DashboardPage[]
  activeId: string
  onSelect: (pageId: string) => void
  /** Editors only: add, rename, reorder, hide and delete pages. */
  onAdd?: () => void
  onUpdate?: (page: DashboardPage) => void
  onMove?: (pageId: string, delta: -1 | 1) => void
  onDuplicate?: (pageId: string) => void
  onDelete?: (pageId: string) => void
}

/** The dashboard's pages, like Power BI's report tabs; each page has its own graphs and filters. */
export function PageTabs({ pages, activeId, onSelect, onAdd, onUpdate, onMove, onDuplicate, onDelete }: PageTabsProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const editable = !!onUpdate

  return (
    // Tabs wrap rather than scroll: a scrolling row would clip each tab's actions menu.
    <div role="tablist" aria-label="Pages" className="relative z-20 flex min-h-11 shrink-0 flex-wrap items-center gap-1 border-b border-white/10 px-4 py-2">
      {pages.map((page, index) => {
        const active = page.id === activeId
        if (renamingId === page.id && onUpdate) {
          const rename = (name: string | null) => {
            setRenamingId(null)
            if (name) onUpdate({ ...page, name })
          }
          return <RenameInput key={page.id} page={page} onDone={rename} />
        }
        return (
          <div
            key={page.id}
            className={cn(
              'group/page flex h-7 shrink-0 items-center rounded-md text-xs',
              active ? 'bg-white/10 text-white' : 'text-white/55 hover:bg-white/5 hover:text-white',
            )}
          >
            <button
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onSelect(page.id)}
              onDoubleClick={editable ? () => setRenamingId(page.id) : undefined}
              title={page.hidden ? `${page.name} · hidden from viewers` : page.name}
              className={cn('flex h-full max-w-48 cursor-pointer items-center gap-1.5 px-2.5', editable && 'pr-1')}
            >
              {page.hidden && <EyeOff className="size-3 shrink-0 text-white/45" aria-label="Hidden from viewers" />}
              <span className="truncate">{page.name}</span>
            </button>
            {editable && (
              <Menu
                align="start"
                items={pageMenu({ page, index, count: pages.length, onRename: () => setRenamingId(page.id), onUpdate, onMove, onDuplicate, onDelete })}
                trigger={({ toggle }) => (
                  <button
                    type="button"
                    aria-label={`Page actions for ${page.name}`}
                    onClick={toggle}
                    className={cn(
                      'mr-0.5 flex size-5 cursor-pointer items-center justify-center rounded text-white/50 hover:bg-white/10 hover:text-white',
                      !active && 'opacity-0 group-hover/page:opacity-100 focus-visible:opacity-100',
                    )}
                  >
                    <MoreHorizontal className="size-3.5" />
                  </button>
                )}
              />
            )}
          </div>
        )
      })}
      {onAdd && (
        <button
          type="button"
          aria-label="Add page"
          title="Add page"
          onClick={onAdd}
          className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-white/55 hover:bg-white/10 hover:text-white"
        >
          <Plus className="size-4" />
        </button>
      )}
    </div>
  )
}

type PageMenuArgs = Pick<PageTabsProps, 'onUpdate' | 'onMove' | 'onDuplicate' | 'onDelete'> & {
  page: DashboardPage
  index: number
  count: number
  onRename: () => void
}

function pageMenu({ page, index, count, onRename, onUpdate, onMove, onDuplicate, onDelete }: PageMenuArgs): MenuEntry[] {
  return [
    { label: 'Rename', Icon: Pencil, onSelect: onRename },
    ...(onDuplicate ? [{ label: 'Duplicate', Icon: Copy, onSelect: () => onDuplicate(page.id) }] : []),
    ...(onUpdate
      ? [{ label: page.hidden ? 'Show to viewers' : 'Hide from viewers', Icon: page.hidden ? Eye : EyeOff, onSelect: () => onUpdate({ ...page, hidden: !page.hidden || undefined }) }]
      : []),
    ...(onMove && index > 0 ? [{ label: 'Move left', Icon: ArrowLeft, onSelect: () => onMove(page.id, -1) }] : []),
    ...(onMove && index < count - 1 ? [{ label: 'Move right', Icon: ArrowRight, onSelect: () => onMove(page.id, 1) }] : []),
    ...(onDelete && count > 1 ? [{ type: 'separator' as const }, { label: 'Delete page', Icon: Trash2, danger: true, onSelect: () => onDelete(page.id) }] : []),
  ]
}

function RenameInput({ page, onDone }: { page: DashboardPage; onDone: (name: string | null) => void }) {
  const [draft, setDraft] = useState(page.name)
  const finish = () => onDone(draft.trim() && draft.trim() !== page.name ? draft.trim() : null)
  return (
    <input
      autoFocus
      aria-label="Page name"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onFocus={(event) => event.target.select()}
      onBlur={finish}
      onKeyDown={(event) => {
        if (event.key === 'Enter') finish()
        if (event.key === 'Escape') onDone(null)
      }}
      className="h-7 w-36 shrink-0 rounded-md border border-sky-300/50 bg-tlai-3 px-2.5 text-xs text-white outline-none"
    />
  )
}
