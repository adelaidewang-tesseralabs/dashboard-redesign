import { useState } from 'react'
import { CURRENT_USER } from '../../../../data/dashboards'

const storageKey = (dashboardId: string) => `tessera-insights-transforms-closed:${CURRENT_USER}:${dashboardId}`

function readClosed(dashboardId: string): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(storageKey(dashboardId)) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((key): key is string => typeof key === 'string') : []
  } catch {
    return []
  }
}

/** Which datasets have the transforms panel open, per person and dashboard in this browser. Open unless closed on that dataset. */
export function useTransformsOpen(dashboardId: string) {
  const [closed, setClosed] = useState(() => readClosed(dashboardId))
  const isOpen = (datasetKey: string) => !closed.includes(datasetKey)
  const setOpen = (datasetKey: string, open: boolean) => {
    const next = open ? closed.filter((key) => key !== datasetKey) : [...new Set([...closed, datasetKey])]
    setClosed(next)
    try {
      localStorage.setItem(storageKey(dashboardId), JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }
  return { isOpen, setOpen }
}
