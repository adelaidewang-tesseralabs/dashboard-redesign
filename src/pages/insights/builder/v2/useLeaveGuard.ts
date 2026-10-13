import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export type LeaveGuard = {
  /** Where an intercepted link was heading, while the confirmation is open. */
  pendingHref: string | null
  stay: () => void
  leave: () => void
}

/**
 * While `active`, asks before leaving the page: the browser's prompt on reload or close, and `pendingHref` for in-app
 * links. The app uses `BrowserRouter`, which has no `useBlocker`, so links are caught in the capture phase before React
 * Router's own click handler. The browser's back button isn't covered.
 */
export function useLeaveGuard(active: boolean): LeaveGuard {
  const navigate = useNavigate()
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  useEffect(() => {
    if (!active) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault()
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href]') : null
      if (!link || link.target === '_blank') return
      const url = new URL(link.href)
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return
      event.preventDefault()
      event.stopPropagation()
      setPendingHref(url.pathname + url.search + url.hash)
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    document.addEventListener('click', onClick, true)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      document.removeEventListener('click', onClick, true)
    }
  }, [active])

  return {
    pendingHref,
    stay: () => setPendingHref(null),
    leave: () => {
      setPendingHref(null)
      if (pendingHref) navigate(pendingHref)
    },
  }
}
