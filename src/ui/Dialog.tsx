import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '../lib/cn'

type DialogProps = {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  /** Tile shown left of the title, like the main app's source dialogs. */
  icon?: ReactNode
  /** `wide` matches the main app's "Add Foundry Source"; `lg` fits two-pane pickers such as the Foundry table browser. */
  size?: 'md' | 'wide' | 'lg'
}

const SIZE_CLASS = { md: 'max-w-lg', wide: 'max-w-2xl', lg: 'max-w-4xl' } as const

export function Dialog({ open, onClose, title, description, children, footer, icon, size = 'md' }: DialogProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal
        aria-label={title}
        className={cn('flex max-h-[85vh] w-full flex-col rounded-xl border border-white/10 bg-tlai-2 shadow-2xl', SIZE_CLASS[size])}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start gap-3 px-5 pt-5">
          {icon}
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-white">{title}</h2>
            {description && <p className="mt-1 text-sm text-white/55">{description}</p>}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex size-7 cursor-pointer items-center justify-center rounded-md text-white/50 hover:bg-white/10 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-3">{footer}</div>}
      </div>
    </div>
  )
}
