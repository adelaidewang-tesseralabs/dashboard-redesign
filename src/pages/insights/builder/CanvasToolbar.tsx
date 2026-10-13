import type { LucideIcon } from 'lucide-react'
import { ChartColumn, Filter, Image, Monitor, Moon, Redo2, Rows3, ScrollText, Sparkles, Sun, Type, Undo2 } from 'lucide-react'
import { DASHBOARD_APPEARANCES, type DashboardAppearance, type SqlDataset } from '../../../data/dashboards'
import type { DataObject } from '../../../data/dataSources'
import type { CanvasItem } from '../../../data/widgets'
import { cn } from '../../../lib/cn'
import { Menu } from '../../../ui/Menu'
import { AddGraphMenu } from './AddGraphMenu'
import type { AddSourceKind } from './sourceKinds'

type CanvasToolbarProps = {
  chatOpen: boolean
  widgets: CanvasItem[]
  sources: { object: DataObject; label: string }[]
  queries?: SqlDataset[]
  sourcesLabel?: string
  datasetsFirst?: boolean
  datasetsOnly?: boolean
  onToggleChat: () => void
  onOpenChat: () => void
  onAddSource: (kind: AddSourceKind) => void
  onOpenAddSource?: () => void
  onAddWidget: (item: CanvasItem) => void
  onAddText: () => void
  /** Builder V6: a text block where Tessera AI sums up the story the page's graphs tell. */
  onAddSummary?: () => void
  onAddFilter: () => void
  onAddMedia: () => void
  /** Builder V6: a section row that groups the graphs below it. */
  onAddSection?: () => void
  /** Undefined when there is nothing to undo or redo. */
  onUndo?: () => void
  onRedo?: () => void
  appearance: DashboardAppearance
  onAppearanceChange: (appearance: DashboardAppearance) => void
}

const MOD_KEY = navigator.platform.toLowerCase().includes('mac') ? '⌘' : 'Ctrl+'

const APPEARANCE_META: Record<DashboardAppearance, { label: string; Icon: LucideIcon }> = {
  light: { label: 'Light', Icon: Sun },
  dark: { label: 'Dark', Icon: Moon },
  system: { label: 'System', Icon: Monitor },
}

export function CanvasToolbar(props: CanvasToolbarProps) {
  const {
    chatOpen,
    widgets,
    sources,
    queries,
    sourcesLabel,
    datasetsFirst,
    datasetsOnly,
    onToggleChat,
    onOpenChat,
    onAddSource,
    onOpenAddSource,
    onAddWidget,
    onAddText,
    onAddSummary,
    onAddFilter,
    onAddMedia,
    onAddSection,
    onUndo,
    onRedo,
    appearance,
    onAppearanceChange,
  } = props

  return (
    <div role="toolbar" aria-label="Canvas tools" className="flex items-center gap-0.5 rounded-lg border border-white/10 bg-tlai-3 p-1 shadow-lg shadow-black/60">
      <Tool Icon={Sparkles} label="Tessera AI" active={chatOpen} onClick={onToggleChat} className="text-tlai-mint" />
      <Divider />
      <AddGraphMenu
        widgets={widgets}
        sources={sources}
        queries={queries}
        sourcesLabel={sourcesLabel}
        datasetsFirst={datasetsFirst}
        datasetsOnly={datasetsOnly}
        onAdd={onAddWidget}
        onAddSource={onAddSource}
        onOpenAddSource={onOpenAddSource}
        onAskAi={onOpenChat}
        trigger={({ open, toggle }) => <Tool Icon={ChartColumn} label="Add graph" active={open} onClick={toggle} />}
      />
      <Tool Icon={Type} label="Add text" onClick={onAddText} />
      {onAddSummary && <Tool Icon={ScrollText} label="Summarize page" onClick={onAddSummary} />}
      <Tool Icon={Filter} label="Add filter" onClick={onAddFilter} />
      <Tool Icon={Image} label="Add media" onClick={onAddMedia} />
      {onAddSection && <Tool Icon={Rows3} label="Add section" onClick={onAddSection} />}
      <Divider />
      <Tool Icon={Undo2} label="Undo" shortcut={`${MOD_KEY}Z`} onClick={onUndo} disabled={!onUndo} />
      <Tool Icon={Redo2} label="Redo" shortcut={`${MOD_KEY}⇧Z`} onClick={onRedo} disabled={!onRedo} />
      <Divider />
      <Menu
        side="top"
        align="end"
        items={[
          { type: 'label', label: 'Appearance' },
          ...DASHBOARD_APPEARANCES.map((option) => ({
            label: APPEARANCE_META[option].label,
            Icon: APPEARANCE_META[option].Icon,
            active: appearance === option,
            onSelect: () => onAppearanceChange(option),
          })),
        ]}
        trigger={({ open, toggle }) => <Tool Icon={APPEARANCE_META[appearance].Icon} label="Appearance" active={open} onClick={toggle} />}
      />
    </div>
  )
}

type ToolProps = { Icon: LucideIcon; label: string; shortcut?: string; active?: boolean; disabled?: boolean; onClick?: () => void; className?: string }

function Tool({ Icon, label, shortcut, active = false, disabled = false, onClick, className }: ToolProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={shortcut ? `${label} (${shortcut})` : label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex size-7 cursor-pointer items-center justify-center rounded-md text-white/60 hover:bg-white/10 hover:text-white disabled:cursor-default disabled:text-white/25 disabled:hover:bg-transparent',
        className,
        active && 'bg-white/10 text-white',
      )}
    >
      <Icon className="size-4" />
    </button>
  )
}

function Divider() {
  return <span className="mx-1 h-4 w-px bg-white/10" />
}
