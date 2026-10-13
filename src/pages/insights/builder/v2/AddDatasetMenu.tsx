import type { ReactNode } from 'react'
import { Menu } from '../../../../ui/Menu'
import { ADD_SOURCE_KINDS, ORIGIN_META, type AddSourceKind } from '../sourceKinds'

type AddDatasetMenuProps = {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode
  onSelect: (kind: AddSourceKind) => void
  align?: 'start' | 'end'
}

/** The main app's "+ Add Data Source" menu from the dashboard's Data Sources settings. */
export function AddDatasetMenu({ trigger, onSelect, align = 'end' }: AddDatasetMenuProps) {
  return (
    <Menu
      align={align}
      trigger={trigger}
      items={ADD_SOURCE_KINDS.map((kind) => ({ label: ORIGIN_META[kind].label, Icon: ORIGIN_META[kind].Icon, onSelect: () => onSelect(kind) }))}
    />
  )
}
