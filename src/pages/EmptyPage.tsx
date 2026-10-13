import { Link, useLocation } from 'react-router-dom'
import { Construction } from 'lucide-react'
import { findL3Label } from '../nav/navConfig'
import { PageLayout, type Crumb } from '../ui/PageLayout'

function titleFromPath(pathname: string) {
  const segment = pathname.split('/').filter(Boolean).at(-1) ?? 'Page'
  return segment.replace(/-/g, ' ').replace(/^\w/, (letter) => letter.toUpperCase())
}

/** Placeholder for every non-Insights route — only Insights is detailed in this prototype. */
export function EmptyPage() {
  const { pathname } = useLocation()
  const { l1, l3 } = findL3Label(pathname)
  const title = l3?.label ?? l1?.label ?? titleFromPath(pathname)
  const crumbs: Crumb[] = l1 && l3 ? [{ label: l1.label }, { label: l3.label }] : [{ label: title }]

  return (
    <PageLayout crumbs={crumbs}>
      <title>{`${title} · Tessera`}</title>
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <Construction className="size-6 text-white/30" />
        <p className="text-sm text-white">{title}</p>
        <p className="text-xs text-white/50">Not part of this prototype.</p>
        <Link to="/insights/dashboards" className="mt-2 text-xs text-white/60 underline hover:text-white">
          Go to Custom dashboards
        </Link>
      </div>
    </PageLayout>
  )
}
