import { useState } from 'react'
import { ChevronDown, EyeOff, Eye, GripVertical, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import type { GraphGroup } from '../../../data/dashboards'
import { cn } from '../../../lib/cn'
import { Menu } from '../../../ui/Menu'

type SectionRowProps = {
  group: GraphGroup
  count: number
  collapsed: boolean
  onToggleCollapsed: () => void
  /** Editors only. */
  onChange?: (group: GraphGroup) => void
  onRemove?: () => void
}

/** A section heading across the canvas. Dragging it moves its graphs along; collapsing hides them for this session. */
export function SectionRow({ group, count, collapsed, onToggleCollapsed, onChange, onRemove }: SectionRowProps) {
  const [renaming, setRenaming] = useState(false)

  return (
    <div className="group/section flex h-full items-end gap-1.5 border-b border-[var(--dash-border)] pb-2">
      {onChange && <GripVertical className="mb-1 size-4 shrink-0 text-[var(--dash-faint)] opacity-0 group-hover/section:opacity-100" aria-hidden />}
      <button
        type="button"
        aria-expanded={!collapsed}
        aria-label={collapsed ? `Expand ${group.name}` : `Collapse ${group.name}`}
        onClick={onToggleCollapsed}
        className="mb-0.5 flex size-6 cursor-pointer items-center justify-center rounded text-[var(--dash-muted)] hover:bg-[var(--dash-card)] hover:text-[var(--dash-fg)]"
      >
        <ChevronDown className={cn('size-4 transition-transform', collapsed && '-rotate-90')} />
      </button>
      {renaming && onChange ? (
        <SectionNameInput
          value={group.name}
          onDone={(name) => {
            setRenaming(false)
            if (name) onChange({ ...group, name })
          }}
        />
      ) : (
        <h3 onDoubleClick={onChange && (() => setRenaming(true))} className="mb-1 truncate text-base font-semibold text-[var(--dash-fg)]">
          {group.name}
        </h3>
      )}
      <span className="mb-1.5 shrink-0 text-xs text-[var(--dash-muted)]">{count === 1 ? '1 item' : `${count} items`}</span>
      {group.hidden && (
        <span className="mb-1 flex shrink-0 items-center gap-1 rounded border border-[var(--dash-border)] px-1.5 text-[11px] text-[var(--dash-muted)]">
          <EyeOff className="size-3" aria-hidden />
          Hidden from viewers
        </span>
      )}
      {onChange && onRemove && (
        <Menu
          className="mb-0.5 ml-auto"
          items={[
            { label: 'Rename', Icon: Pencil, onSelect: () => setRenaming(true) },
            { label: group.hidden ? 'Show to viewers' : 'Hide from viewers', Icon: group.hidden ? Eye : EyeOff, onSelect: () => onChange({ ...group, hidden: !group.hidden || undefined }) },
            { type: 'separator' },
            { label: 'Remove section', Icon: Trash2, danger: true, onSelect: onRemove },
          ]}
          trigger={({ open, toggle }) => (
            <button
              type="button"
              aria-label={`Section actions for ${group.name}`}
              data-popover-open={open || undefined}
              onClick={toggle}
              className="flex size-6 cursor-pointer items-center justify-center rounded text-[var(--dash-muted)] opacity-0 group-hover/section:opacity-100 hover:bg-[var(--dash-card)] hover:text-[var(--dash-fg)] focus-visible:opacity-100 data-popover-open:bg-[var(--dash-card)] data-popover-open:opacity-100"
            >
              <MoreHorizontal className="size-4" />
            </button>
          )}
        />
      )}
    </div>
  )
}

function SectionNameInput({ value, onDone }: { value: string; onDone: (name: string | null) => void }) {
  const [draft, setDraft] = useState(value)
  const finish = () => onDone(draft.trim() && draft.trim() !== value ? draft.trim() : null)
  return (
    <input
      autoFocus
      aria-label="Section name"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onFocus={(event) => event.target.select()}
      onBlur={finish}
      onKeyDown={(event) => {
        if (event.key === 'Enter') finish()
        if (event.key === 'Escape') onDone(null)
      }}
      className="mb-0.5 h-7 w-64 rounded-md border border-[var(--dash-border)] bg-[var(--dash-card)] px-2 text-base font-semibold text-[var(--dash-fg)] outline-none"
    />
  )
}
