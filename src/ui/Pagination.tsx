import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatNumber } from '../lib/format'
import { Menu } from './Menu'

type PaginationProps = {
  /** Zero-based. */
  page: number
  pageSize: number
  total: number
  pageSizeOptions: number[]
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

const navClass =
  'flex size-7 cursor-pointer items-center justify-center rounded-md text-white/70 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30'

/** Port of modus `Pagination`: rows-per-page, item range, prev/next. */
export function Pagination({ page, pageSize, total, pageSizeOptions, onPageChange, onPageSizeChange }: PaginationProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const start = total === 0 ? 0 : page * pageSize + 1
  const end = Math.min(total, (page + 1) * pageSize)

  return (
    <nav aria-label="Pagination" className="flex items-center gap-4 text-[13px] text-white/60 tabular-nums">
      <div className="flex items-center gap-1">
        <span>Rows per page:</span>
        <Menu
          align="start"
          trigger={({ toggle }) => (
            <button
              type="button"
              aria-label="Rows per page"
              onClick={toggle}
              className="flex h-7 cursor-pointer items-center gap-1 rounded-md px-1.5 text-white hover:bg-white/10"
            >
              {pageSize}
              <ChevronDown className="size-3.5 opacity-60" />
            </button>
          )}
          items={pageSizeOptions.map((size) => ({
            label: String(size),
            active: size === pageSize,
            onSelect: () => onPageSizeChange(size),
          }))}
        />
      </div>
      <span>
        {formatNumber(start)}–{formatNumber(end)} of {formatNumber(total)}
      </span>
      <div className="flex items-center gap-1">
        <button type="button" aria-label="Previous page" className={navClass} disabled={page === 0} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Next page"
          className={navClass}
          disabled={page >= pageCount - 1}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </nav>
  )
}
