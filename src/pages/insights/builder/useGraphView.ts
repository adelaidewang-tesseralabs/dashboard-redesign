import { useRef } from 'react'
import type { Dashboard } from '../../../data/dashboards'
import type { Cell } from '../../../data/dataSources'
import { resolvePageId } from '../../../data/pages'
import type { CanvasItem } from '../../../data/widgets'
import { downloadCsv, toCsv } from '../../../lib/csv'
import { downloadPng } from '../../../lib/downloadImage'
import { useToast } from '../../../ui/Toast'
import { useCanvasFullScreen } from './fullScreen'
import type { GraphViewActions } from './GraphActionsMenu'
import { itemDatasetKey, listDatasets } from './v2/datasets'
import { useWidgetNavigation } from './widgetNavigation'

/** Search param a copied graph link carries; the canvas scrolls to and flashes that graph. */
export const LINKED_WIDGET_PARAM = 'widget'

type UseGraphViewArgs = { dashboard: Dashboard; item: CanvasItem; label: string; readOnly: boolean }

/** The graph menu's viewing actions, plus the refs and state behind full screen and PNG downloads. */
export function useGraphView({ dashboard, item, label, readOnly }: UseGraphViewArgs) {
  const navigation = useWidgetNavigation()
  const canvasFullScreen = useCanvasFullScreen()
  const toast = useToast()
  const cardRef = useRef<HTMLDivElement>(null)
  const fullScreenRef = useRef<HTMLDivElement>(null)
  const fullScreen = canvasFullScreen.itemId === item.id
  const setFullScreen = (open: boolean) => canvasFullScreen.setItemId(open ? item.id : null)
  const datasetKey = itemDatasetKey(item)
  const dataset = datasetKey ? listDatasets(dashboard).find((entry) => entry.key === datasetKey) : undefined
  const { onViewLineage, onOpenDataset } = navigation

  const copyLink = () => {
    const url = new URL(window.location.href)
    url.searchParams.set('page', resolvePageId(dashboard, item.pageId))
    url.searchParams.set(LINKED_WIDGET_PARAM, item.id)
    navigator.clipboard.writeText(url.toString()).then(
      () => toast('Link copied'),
      () => toast("Couldn't copy the link"),
    )
  }
  const downloadImage = () => {
    const node = fullScreen ? fullScreenRef.current : cardRef.current
    if (!node) return
    const background = getComputedStyle(node).getPropertyValue('--dash-canvas').trim()
    downloadPng(node, label, background).catch(() => toast("Couldn't save the image"))
  }
  /** Leaving the canvas from full screen shouldn't leave the overlay behind. */
  const leaving = (go: () => void) => () => {
    setFullScreen(false)
    go()
  }

  const viewFor = (columns: string[], rows: Cell[][]): GraphViewActions => ({
    fullScreen: { open: fullScreen, onToggle: () => setFullScreen(!fullScreen) },
    onCopyLink: copyLink,
    onDownloadPng: downloadImage,
    onDownloadCsv: () => downloadCsv(label, toCsv(columns, rows)),
    // Viewers, and editors previewing as one, don't get the editor-only Data tab or lineage.
    ...(!readOnly && {
      onViewLineage: onViewLineage && leaving(() => onViewLineage(item.id)),
      dataset: dataset && onOpenDataset ? { label: dataset.label, onOpen: leaving(() => onOpenDataset(dataset.key, item.id)) } : undefined,
    }),
  })

  const fullScreenHost = fullScreen ? canvasFullScreen.host : null
  const selectFullScreen = canvasFullScreen.onSelect && (() => canvasFullScreen.onSelect?.(item.id))
  return { cardRef, fullScreenRef, fullScreenHost, selectFullScreen, closeFullScreen: () => setFullScreen(false), viewFor }
}
