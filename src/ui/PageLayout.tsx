import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '../lib/cn'

export type Crumb = { label: string; to?: string }

type PageLayoutProps = {
  crumbs: Crumb[]
  actions?: ReactNode
  children: ReactNode
  className?: string
}

/** Content-card layout: the 48px header strip (breadcrumbs + actions) from the main app's `PageLayout`. */
export function PageLayout({ crumbs, actions, children, className }: PageLayoutProps) {
  return (
    <div className="relative flex size-full flex-col">
      <header className="flex min-h-12 w-full shrink-0 items-center gap-2 border-b border-white/10 px-4">
        <nav aria-label="Breadcrumb" className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
          {crumbs.map((crumb, index) => {
            const last = index === crumbs.length - 1
            return (
              <span key={`${crumb.label}-${index}`} className={cn('flex items-center gap-1.5', last ? 'min-w-0' : 'shrink-0')}>
                {index > 0 && <ChevronRight className="size-3.5 shrink-0 text-white/30" />}
                {crumb.to && !last ? (
                  <Link to={crumb.to} className="truncate text-white/50 hover:text-white">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={cn('truncate', last ? 'text-white' : 'text-white/50')}>{crumb.label}</span>
                )}
              </span>
            )
          })}
        </nav>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </header>
      <div className={cn('min-h-0 flex-1 overflow-auto', className)}>{children}</div>
    </div>
  )
}
