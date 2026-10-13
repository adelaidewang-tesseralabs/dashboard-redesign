import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Dashboard, DashboardPage } from '../../../../data/dashboards'
import { useDashboards } from '../../../../data/DashboardsStore'
import { dashboardPages, nextPageName, visiblePages } from '../../../../data/pages'
import { usePersonalPage } from '../usePersonalView'

/** The page on screen: `?page=` wins so a link can open a page, then the page this person last had open, then the first. */
export function useDashboardPages(dashboard: Dashboard, asViewer: boolean, onPageChange: () => void) {
  const [params, setParams] = useSearchParams()
  const [savedPageId, savePageId] = usePersonalPage(dashboard.id)
  const { setActivePage, addPage, updatePage, movePage, duplicatePage, deletePage } = useDashboards()
  const pages = visiblePages(dashboard, asViewer)
  const wanted = params.get('page') ?? savedPageId
  const activeId = pages.find((page) => page.id === wanted)?.id ?? pages[0].id

  useEffect(() => setActivePage(dashboard.id, activeId), [setActivePage, dashboard.id, activeId])

  const select = (pageId: string) => {
    savePageId(pageId)
    setParams(
      (current) => {
        current.set('page', pageId)
        return current
      },
      { replace: true },
    )
    onPageChange()
  }
  const createPage = (name: string): DashboardPage => ({ id: `page-${crypto.randomUUID()}`, name })

  return {
    pages,
    activeId,
    select,
    add: () => {
      const page = createPage(nextPageName(dashboardPages(dashboard)))
      addPage(dashboard.id, page)
      select(page.id)
    },
    update: (page: DashboardPage) => updatePage(dashboard.id, page),
    move: (pageId: string, delta: -1 | 1) => movePage(dashboard.id, pageId, delta),
    duplicate: (pageId: string) => {
      const source = pages.find((page) => page.id === pageId)
      const page = createPage(`${source?.name ?? 'Page'} copy`)
      duplicatePage(dashboard.id, pageId, page)
      select(page.id)
    },
    remove: (pageId: string) => {
      const index = pages.findIndex((page) => page.id === pageId)
      const neighbour = pages[index + 1] ?? pages[index - 1]
      deletePage(dashboard.id, pageId)
      if (pageId === activeId && neighbour) select(neighbour.id)
    },
  }
}
