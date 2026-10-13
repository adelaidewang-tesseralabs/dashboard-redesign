import { Archive, ArchiveRestore, Pencil, Trash2 } from 'lucide-react'
import { can, type Access } from '../../../data/access'
import type { Dashboard } from '../../../data/dashboards'
import type { MenuItem } from '../../../ui/Menu'

type Handlers = { onEdit: () => void; onDelete: () => void; onToggleArchived: () => void }

/** Card and row actions: editors can edit details; only the owner archives or deletes. */
export function dashboardMenuItems(dashboard: Dashboard, role: Access, { onEdit, onDelete, onToggleArchived }: Handlers): MenuItem[] {
  return [
    ...(can(role, 'editDetails') ? [{ label: 'Edit details', Icon: Pencil, onSelect: onEdit }] : []),
    ...(can(role, 'archive')
      ? [
          dashboard.archived
            ? { label: 'Restore', Icon: ArchiveRestore, onSelect: onToggleArchived }
            : { label: 'Archive', Icon: Archive, onSelect: onToggleArchived },
        ]
      : []),
    ...(can(role, 'delete') ? [{ label: 'Delete', Icon: Trash2, onSelect: onDelete, danger: true }] : []),
  ]
}
