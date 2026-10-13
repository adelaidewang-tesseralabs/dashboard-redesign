import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { CircleCheck } from 'lucide-react'
import { cn } from '../lib/cn'

type ToastAction = { label: string; onSelect: () => void }
type Toast = { id: number; message: string; action?: ToastAction }
type ShowToast = (message: string, action?: ToastAction) => void

const ToastContext = createContext<ShowToast>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => setToasts((current) => current.filter((toast) => toast.id !== id)), [])
  const show = useCallback<ShowToast>(
    (message, action) => {
      const id = Date.now() + Math.random()
      setToasts((current) => [...current, { id, message, action }])
      // Toasts with an action stay longer so there's time to reach the button.
      window.setTimeout(() => dismiss(id), action ? 5000 : 2800)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-[60] flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'flex items-center gap-2 rounded-lg border border-white/10 bg-tlai-3 px-4 py-3 text-sm text-white shadow-xl',
              toast.action && 'pointer-events-auto',
            )}
          >
            <CircleCheck className="size-4 text-status-success" />
            {toast.message}
            {toast.action && (
              <button
                type="button"
                onClick={() => {
                  toast.action?.onSelect()
                  dismiss(toast.id)
                }}
                className="-my-1 ml-2 cursor-pointer rounded px-2 py-1 text-sm font-medium text-tlai-mint hover:bg-white/10"
              >
                {toast.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
