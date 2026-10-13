import { ChartColumn, ChevronDown, Sparkles } from 'lucide-react'
import type { CanvasItem } from '../../../../data/widgets'
import { Button } from '../../../../ui/Button'
import { Menu, type MenuEntry } from '../../../../ui/Menu'
import { graphsColumn, type GraphColumn } from './datasets'

type CreateGraphMenuProps = {
  columns: GraphColumn[]
  /** Graphs already on this dataset; their columns are checked but stay pickable for another chart of the same data. */
  usedIn: CanvasItem[]
  disabled?: boolean
  variant?: 'primary' | 'outline'
  onPick: (column: GraphColumn) => void
  onAskAi: () => void
}

/** Builder V6: Create graph asks what to group by, the same choice the canvas chart tool offers per dataset. */
export function CreateGraphMenu({ columns, usedIn, disabled = false, variant = 'primary', onPick, onAskAi }: CreateGraphMenuProps) {
  const items: MenuEntry[] = [
    ...(columns.length ? [{ type: 'label' as const, label: 'Group by' }] : []),
    ...columns.map((column) => ({ label: `by ${column.label}`, active: usedIn.some((item) => graphsColumn(item, column.key)), onSelect: () => onPick(column) })),
    ...(columns.length ? [{ type: 'separator' as const }] : []),
    { label: 'Ask Tessera AI', Icon: Sparkles, onSelect: onAskAi },
  ]
  return (
    <Menu
      align={variant === 'primary' ? 'end' : 'start'}
      items={items}
      trigger={({ open, toggle }) => (
        <Button size="sm" variant={variant === 'primary' ? 'default' : 'outline'} disabled={disabled} aria-expanded={open} onClick={toggle}>
          <ChartColumn className="size-3.5" />
          Create graph
          <ChevronDown className="size-3.5 opacity-60" />
        </Button>
      )}
    />
  )
}
