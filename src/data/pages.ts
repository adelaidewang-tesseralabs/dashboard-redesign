import type { Dashboard, DashboardPage } from './dashboards'

/** The page every dashboard starts with, before anyone adds a second one. */
export const FIRST_PAGE: DashboardPage = { id: 'page-1', name: 'Page 1' }

export function dashboardPages(dashboard: Pick<Dashboard, 'pages'>): DashboardPage[] {
  return dashboard.pages?.length ? dashboard.pages : [FIRST_PAGE]
}

/** Entries saved before pages existed, or whose page was deleted, belong to the first page. */
export function resolvePageId(dashboard: Pick<Dashboard, 'pages'>, pageId: string | undefined): string {
  const pages = dashboardPages(dashboard)
  return pages.some((page) => page.id === pageId) ? (pageId as string) : pages[0].id
}

/** What one page shows: its own widgets, filters and sections. Layout keeps every rect; the grid only reads its own. */
export function pageView(dashboard: Dashboard, pageId: string): Dashboard {
  const onPage = (entry: { pageId?: string }) => resolvePageId(dashboard, entry.pageId) === pageId
  return {
    ...dashboard,
    widgets: dashboard.widgets?.filter(onPage),
    filters: dashboard.filters?.filter(onPage),
    groups: dashboard.groups?.filter(onPage),
  }
}

/** Pages a viewer can open; an editor sees hidden pages too. Never empty, so a viewer always lands somewhere. */
export function visiblePages(dashboard: Pick<Dashboard, 'pages'>, asViewer: boolean): DashboardPage[] {
  const pages = dashboardPages(dashboard)
  if (!asViewer) return pages
  const shown = pages.filter((page) => !page.hidden)
  return shown.length ? shown : pages.slice(0, 1)
}

/** `Page 2`, `Page 3`…: the first number no page is named after yet. */
export function nextPageName(pages: DashboardPage[]): string {
  const names = new Set(pages.map((page) => page.name))
  let number = pages.length + 1
  while (names.has(`Page ${number}`)) number++
  return `Page ${number}`
}
