import type { LucideIcon } from 'lucide-react'
import { ChartColumn, Eye, Filter, Image, Pin, Monitor, Moon, Redo2, Rows3, ScrollText, Sparkles, Sun, Type, Undo2 } from 'lucide-react'
import { DASHBOARD_APPEARANCES, type DashboardAppearance, type SqlDataset } from '../../../data/dashboards'
import type { DataObject } from '../../../data/dataSources'
import type { CanvasItem } from '../../../data/widgets'
import { cn } from '../../../lib/cn'
import { Menu } from '../../../ui/Menu'
import { AddGraphMenu } from './AddGraphMenu'
import type { FilterKind } from './FilterBar'
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
  onAddFilter: (kind: FilterKind) => void
  onAddMedia: () => void
  /** Builder V6: a section row that groups the graphs below it. */
  onAddSection?: () => void
  /** Undefined when there is nothing to undo or redo. */
  onUndo?: () => void
  onRedo?: () => void
  appearance: DashboardAppearance
  onAppearanceChange: (appearance: DashboardAppearance) => void
  /** A graph is expanded: only the tools that make sense over one graph (AI, undo, redo, appearance). */
  fullScreen?: boolean
  /** `vertical`: a rail docked on the canvas's left edge, like the workflow canvas; menus and tooltips open to its right. */
  orientation?: 'horizontal' | 'vertical'
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
    fullScreen = false,
    orientation = 'horizontal',
  } = props
  const vertical = orientation === 'vertical'
  const menuSide = vertical ? 'right' : 'top'

  return (
    <div
      role="toolbar"
      aria-label="Canvas tools"
      aria-orientation={orientation}
      className={cn(
        'flex items-center',
        vertical
          ? 'relative z-40 h-full w-12 shrink-0 flex-col gap-1 border-r border-white/10 bg-tlai-1 py-3'
          : 'gap-0.5 rounded-lg border border-white/10 bg-tlai-3 p-1 shadow-lg shadow-black/60',
      )}
    >
      <Tool Icon={Sparkles} label="Ask AI" active={chatOpen} onClick={onToggleChat} className="text-tlai-mint" vertical={vertical} />
      <Divider vertical={vertical} />
      {!fullScreen && (
        <>
          <AddGraphMenu
            side={menuSide}
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
            trigger={({ open, toggle }) => <Tool Icon={ChartColumn} label="Add graph" active={open} onClick={toggle} vertical={vertical} />}
          />
          <Tool Icon={Type} label="Add text" onClick={onAddText} vertical={vertical} />
          {onAddSummary && <Tool Icon={ScrollText} label="Summarize page" onClick={onAddSummary} vertical={vertical} />}
          <Menu
            side={menuSide}
            align={vertical ? 'start' : 'end'}
            items={[
              { label: 'Filter viewers can change', Icon: Eye, onSelect: () => onAddFilter('viewer') },
              { label: 'Fixed filter, hidden from viewers', Icon: Pin, onSelect: () => onAddFilter('fixed') },
            ]}
            trigger={({ open, toggle }) => <Tool Icon={Filter} label="Add filter" active={open} onClick={toggle} vertical={vertical} />}
          />
          <Tool Icon={Image} label="Add media" onClick={onAddMedia} vertical={vertical} />
          {onAddSection && <Tool Icon={Rows3} label="Add section" onClick={onAddSection} vertical={vertical} />}
          {!vertical && <Divider />}
        </>
      )}
      <div className={cn('flex items-center', vertical ? 'mt-auto flex-col gap-1' : 'gap-0.5')}>
        <Tool Icon={Undo2} label="Undo" shortcut={`${MOD_KEY}Z`} onClick={onUndo} disabled={!onUndo} vertical={vertical} />
        <Tool Icon={Redo2} label="Redo" shortcut={`${MOD_KEY}⇧Z`} onClick={onRedo} disabled={!onRedo} vertical={vertical} />
        <Divider vertical={vertical} />
        <Menu
          side={menuSide}
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
          trigger={({ open, toggle }) => <Tool Icon={APPEARANCE_META[appearance].Icon} label="Appearance" active={open} onClick={toggle} vertical={vertical} />}
        />
      </div>
    </div>
  )
}

type ToolProps = {
  Icon: LucideIcon
  label: string
  shortcut?: string
  active?: boolean
  disabled?: boolean
  onClick?: () => void
  className?: string
  vertical?: boolean
}

function Tool({ Icon, label, shortcut, active = false, disabled = false, onClick, className, vertical = false }: ToolProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={shortcut ? `${label} (${shortcut})` : label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      data-tip-side={vertical ? 'right' : undefined}
      className={cn(
        'flex cursor-pointer items-center justify-center rounded-md text-white/60 hover:bg-white/10 hover:text-white disabled:cursor-default disabled:text-white/25 disabled:hover:bg-transparent',
        vertical ? 'size-8' : 'size-7',
        className,
        active && 'bg-white/10 text-white',
      )}
    >
      <Icon className="size-4" />
    </button>
  )
}

function Divider({ vertical = false }: { vertical?: boolean }) {
  return <span className={vertical ? 'my-1 h-px w-5 bg-white/10' : 'mx-1 h-4 w-px bg-white/10'} />
}
