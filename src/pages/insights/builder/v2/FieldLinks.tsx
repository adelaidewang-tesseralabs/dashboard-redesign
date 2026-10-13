import { useState } from 'react'
import { Link2, X } from 'lucide-react'
import type { Dashboard, FieldRef } from '../../../../data/dashboards'
import { useDashboards } from '../../../../data/DashboardsStore'
import { findFilterColumn, linkedFields, type FilterColumn } from '../dashboardFilters'
import { LinkFieldDialog } from '../LinkFieldDialog'

type FieldLinksProps = {
  dashboard: Dashboard
  field: FieldRef
  columns: FilterColumn[]
}

const sameField = (a: FieldRef, b: FieldRef) => a.datasetKey === b.datasetKey && a.column === b.column

/** A column's links to columns in other datasets; page filters on any of them narrow all of them. */
export function FieldLinks({ dashboard, field, columns }: FieldLinksProps) {
  const { addFieldLink, removeFieldLink } = useDashboards()
  const [linking, setLinking] = useState(false)
  const links = (dashboard.fieldLinks ?? []).flatMap((link) => {
    const [a, b] = link.fields
    const other = sameField(a, field) ? b : sameField(b, field) ? a : undefined
    return other ? [{ id: link.id, other }] : []
  })

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {links.map(({ id, other }) => {
        const column = findFilterColumn(columns, other)
        const name = column ? `${column.datasetLabel} · ${column.label}` : `${other.datasetKey} · ${other.column}`
        return (
          <span key={id} className="flex h-6 items-center gap-1 rounded border border-white/10 bg-white/5 pr-0.5 pl-1.5 text-xs text-white/80">
            <Link2 className="size-3 text-white/45" aria-hidden />
            {name}
            <button
              type="button"
              aria-label={`Unlink ${name}`}
              onClick={() => removeFieldLink(dashboard.id, id)}
              className="flex size-5 cursor-pointer items-center justify-center rounded text-white/45 hover:bg-white/10 hover:text-white"
            >
              <X className="size-3" />
            </button>
          </span>
        )
      })}
      <button type="button" onClick={() => setLinking(true)} className="h-6 cursor-pointer rounded px-1.5 text-xs text-white/55 hover:bg-white/10 hover:text-white">
        Link to…
      </button>
      {linking && (
        <LinkFieldDialog
          from={field}
          columns={columns}
          linked={linkedFields(dashboard, field)}
          onClose={() => setLinking(false)}
          onLink={(link) => {
            addFieldLink(dashboard.id, link)
            setLinking(false)
          }}
        />
      )}
    </div>
  )
}
