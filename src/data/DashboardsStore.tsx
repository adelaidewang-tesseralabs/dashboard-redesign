import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  CURRENT_USER,
  DASHBOARDS,
  DEFAULT_FAVORITES,
  SAMPLE_DASHBOARDS,
  type Dashboard,
  type DashboardAppearance,
  type DashboardFilter,
  type DashboardMember,
  type DashboardPage,
  type DashboardSource,
  type DatasetRef,
  type FieldLink,
  type GeneralAccess,
  type GraphGroup,
  type MemberRole,
  type SavedFilter,
  type SqlDataset,
  isPageCopy,
} from './dashboards'
import { registerPublishedTables, unregisterPublishedTables, type PublishedDataset } from './externalSources'
import { dashboardPages, resolvePageId } from './pages'
import type { DatasetTransforms } from './transforms'
import { contentOf, recordVersion, restoreVersion, type DashboardContent } from './versions'
import { sameSource, type CanvasItem, type WidgetRect } from './widgets'
import { PROTOTYPE_NOW } from '../lib/format'

const FAVORITES_KEY = 'tessera-insights-favorites'

export type DashboardDraft = { name: string; description: string; tags: string[] }

type DashboardsStore = {
  dashboards: Dashboard[]
  favorites: string[]
  isFavorite: (id: string) => boolean
  toggleFavorite: (id: string) => boolean
  createDashboard: (draft: DashboardDraft) => Dashboard
  updateDashboard: (id: string, draft: DashboardDraft) => void
  setAppearance: (id: string, appearance: DashboardAppearance) => void
  setArchived: (id: string, archived: boolean) => void
  deleteDashboard: (id: string) => void
  addWidgets: (id: string, items: CanvasItem[]) => void
  /** Adds `item` even when a graph of the same source exists (duplicate, paste), on the active page, and saves `layout` in the same edit. */
  insertWidget: (id: string, item: CanvasItem, layout: WidgetRect[]) => void
  removeWidget: (id: string, itemId: string) => void
  updateWidget: (id: string, item: CanvasItem) => void
  /** One edit, so a change made to several selected graphs undoes in one step. */
  updateWidgets: (id: string, items: CanvasItem[]) => void
  /** Saves these rects and keeps every other one, so a page's grid never drops another page's placements. */
  setLayout: (id: string, layout: WidgetRect[]) => void
  /** The page widgets and filters added from anywhere (toolbar, chat) land on. Not saved. */
  setActivePage: (id: string, pageId: string) => void
  addPage: (id: string, page: DashboardPage) => void
  updatePage: (id: string, page: DashboardPage) => void
  movePage: (id: string, pageId: string, delta: -1 | 1) => void
  /** Copies the page's widgets, layout, filters and sections onto `page`, placed right after it. */
  duplicatePage: (id: string, pageId: string, page: DashboardPage) => void
  /** Drops the page with everything on it; the last page can't be deleted. */
  deletePage: (id: string, pageId: string) => void
  /** Sends a widget to the bottom of another page; a `newPage` is created in the same edit, after the last page. */
  moveWidgetToPage: (id: string, itemId: string, pageId: string, newPage?: DashboardPage) => void
  /** `layout` holds the section's rect and any rects it pushed down, saved in the same edit. */
  addGroup: (id: string, group: GraphGroup, layout: WidgetRect[]) => void
  updateGroup: (id: string, group: GraphGroup) => void
  /** Removes the section row only; its graphs stay where they are. */
  removeGroup: (id: string, groupId: string) => void
  addFieldLink: (id: string, link: FieldLink) => void
  removeFieldLink: (id: string, linkId: string) => void
  addSources: (id: string, sources: DashboardSource[]) => void
  renameSource: (id: string, table: string, label: string) => void
  addSqlDataset: (id: string, dataset: SqlDataset) => void
  updateSqlDataset: (id: string, dataset: SqlDataset) => void
  /** Drops the dataset and every graph built from it. */
  removeDataset: (id: string, ref: DatasetRef) => void
  setDatasetTransforms: (id: string, datasetKey: string, transforms: DatasetTransforms | undefined) => void
  refresh: (id: string) => void
  addMember: (id: string, member: DashboardMember) => void
  setMemberRole: (id: string, user: string, role: MemberRole) => void
  removeMember: (id: string, user: string) => void
  setGeneralAccess: (id: string, generalAccess: GeneralAccess) => void
  /** The new owner must be a member; the previous owner stays on as an editor. */
  transferOwnership: (id: string, user: string) => void
  addFilter: (id: string, filter: DashboardFilter) => void
  updateFilter: (id: string, filter: DashboardFilter) => void
  setFilterValues: (id: string, filterId: string, values: string[]) => void
  removeFilter: (id: string, filterId: string) => void
  /** On: the filter shows on every page, replacing page-only filters on the same column. Off: it stays on the open page only. */
  setFilterAllPages: (id: string, filterId: string, allPages: boolean) => void
  addSavedFilter: (id: string, savedFilter: SavedFilter) => void
  removeSavedFilter: (id: string, savedFilterId: string) => void
  updateSavedFilter: (id: string, savedFilterId: string, patch: Partial<Pick<SavedFilter, 'name' | 'shared' | 'values' | 'operators' | 'pageId'>>) => void
  /** `runId` undefined goes back to the workflow's latest run. */
  pinRun: (id: string, workflowId: string, runId: string | undefined) => void
  /** Datasets published to Foundry from any dashboard. Not dashboard content, so undo and version restore leave them. */
  published: PublishedDataset[]
  /** Each dashboard's Foundry folder name, kept once named even if every table in it is removed. */
  foundryFolders: Record<string, string>
  /** Adds datasets to Foundry, or updates ones already published at the same path. */
  publishDatasets: (entries: PublishedDataset[]) => void
  /** Deletes these published tables from Foundry; datasets elsewhere that read them stop working. */
  unpublishDatasets: (paths: string[]) => void
  restoreVersion: (id: string, versionId: string) => void
  /** Steps back or forward one content edit on the dashboard; undoing is itself saved as a version. */
  undo: (id: string) => void
  redo: (id: string) => void
  canUndo: (id: string) => boolean
  canRedo: (id: string) => boolean
}

/** Content before each edit (`past`, oldest first) and after each undo (`future`, next redo first), per dashboard, for this session. */
type EditHistory = { past: DashboardContent[]; future: DashboardContent[] }
type StoreState = { dashboards: Dashboard[]; history: Record<string, EditHistory>; published: PublishedDataset[]; foundryFolders: Record<string, string> }

const MAX_UNDO = 100

function usesDataset(item: CanvasItem, ref: DatasetRef) {
  if (ref.kind === 'sql') return item.source === 'sql' && item.datasetId === ref.id
  return item.source === 'object' && item.objectName === ref.table
}

function pushEdit(history: Record<string, EditHistory>, id: string, before: DashboardContent): Record<string, EditHistory> {
  return { ...history, [id]: { past: [...(history[id]?.past ?? []), before].slice(-MAX_UNDO), future: [] } }
}

function stepHistory(state: StoreState, id: string, direction: 'undo' | 'redo'): StoreState {
  const entry = state.history[id]
  const dashboard = state.dashboards.find((candidate) => candidate.id === id)
  const target = direction === 'undo' ? entry?.past.at(-1) : entry?.future[0]
  if (!entry || !dashboard || !target) return state
  const current = contentOf(dashboard)
  const next = recordVersion(dashboard, { ...dashboard, ...target, updatedAt: new Date(PROTOTYPE_NOW).toISOString() }, CURRENT_USER)
  const history: EditHistory =
    direction === 'undo'
      ? { past: entry.past.slice(0, -1), future: [current, ...entry.future] }
      : { past: [...entry.past, current], future: entry.future.slice(1) }
  return { ...state, dashboards: state.dashboards.map((candidate) => (candidate.id === id ? next : candidate)), history: { ...state.history, [id]: history } }
}

/**
 * Stamps every widget, filter and section with its page. Unset ids mean "the first page", so they must be pinned before
 * pages are added, reordered or deleted, or entries would silently move to whichever page ends up first.
 */
function withExplicitPages(dashboard: Dashboard): Dashboard {
  const pin = <T extends { pageId?: string }>(entry: T): T => ({ ...entry, pageId: resolvePageId(dashboard, entry.pageId) })
  return {
    ...dashboard,
    pages: dashboardPages(dashboard),
    widgets: dashboard.widgets?.map(pin),
    filters: dashboard.filters?.map(pin),
    groups: dashboard.groups?.map(pin),
  }
}

function copyPage(dashboard: Dashboard, pageId: string, page: DashboardPage): Dashboard {
  const on = (entry: { pageId?: string }) => entry.pageId === pageId
  const ids = new Map<string, string>()
  const copyId = (oldId: string) => {
    const next = `${oldId.split('-')[0]}-${crypto.randomUUID()}`
    ids.set(oldId, next)
    return next
  }
  const widgets = (dashboard.widgets ?? []).filter(on).map((item) => ({ ...item, id: copyId(item.id), pageId: page.id }))
  const groups = (dashboard.groups ?? []).filter(on).map((group) => ({ ...group, id: copyId(group.id), pageId: page.id }))
  const layout = (dashboard.layout ?? []).flatMap((rect) => {
    const next = ids.get(rect.i)
    return next ? [{ ...rect, i: next }] : []
  })
  const filters = (dashboard.filters ?? []).filter((filter) => !filter.allPages && on(filter)).map((filter) => ({ ...filter, id: crypto.randomUUID(), pageId: page.id }))
  const pages = dashboard.pages ?? []
  const index = pages.findIndex((entry) => entry.id === pageId)
  return {
    ...dashboard,
    pages: [...pages.slice(0, index + 1), page, ...pages.slice(index + 1)],
    widgets: [...(dashboard.widgets ?? []), ...widgets],
    groups: [...(dashboard.groups ?? []), ...groups],
    layout: [...(dashboard.layout ?? []), ...layout],
    filters: [...(dashboard.filters ?? []), ...filters],
  }
}

function dropPage(dashboard: Dashboard, pageId: string): Dashboard {
  const keep = (entry: { pageId?: string }) => entry.pageId !== pageId
  const removed = new Set([...(dashboard.widgets ?? []), ...(dashboard.groups ?? [])].filter((entry) => !keep(entry)).map((entry) => entry.id))
  return {
    ...dashboard,
    pages: dashboard.pages?.filter((page) => page.id !== pageId),
    widgets: dashboard.widgets?.filter(keep),
    groups: dashboard.groups?.filter(keep),
    filters: dashboard.filters?.filter((filter) => filter.allPages || keep(filter)),
    layout: dashboard.layout?.filter((rect) => !removed.has(rect.i)),
  }
}

/** Score a canvas dashboard reports once its first widget connects it to data checks. */
const FIRST_RUN_SCORE = 87.2

const Context = createContext<DashboardsStore | null>(null)

function readFavorites() {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY)
    return stored ? (JSON.parse(stored) as string[]) : DEFAULT_FAVORITES
  } catch {
    return DEFAULT_FAVORITES
  }
}

/** `?state=new` starts the prototype as a first-time user: no dashboards of their own, only samples. */
function isNewUserState() {
  return new URLSearchParams(window.location.search).get('state') === 'new'
}

function slugify(name: string) {
  return `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now().toString(36)}`
}

export function DashboardsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>(() => ({
    dashboards: isNewUserState() ? SAMPLE_DASHBOARDS : [...DASHBOARDS, ...SAMPLE_DASHBOARDS],
    history: {},
    published: [],
    foundryFolders: {},
  }))
  const { dashboards, history, published, foundryFolders } = state
  const setDashboards = useCallback(
    (update: (current: Dashboard[]) => Dashboard[]) => setState((current) => ({ ...current, dashboards: update(current.dashboards) })),
    [],
  )
  const activePages = useRef<Record<string, string>>({})
  const [favoritesState, setFavoritesState] = useState(readFavorites)
  const favorites = favoritesState.filter((id) => dashboards.some((dashboard) => dashboard.id === id))

  const setFavorites = useCallback((next: string[]) => {
    setFavoritesState(next)
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next))
    } catch {
      /* ignore */
    }
  }, [])

  /** Content edits go through here so each one is saved as a restorable version and can be undone. */
  const setContent = useCallback(
    (update: (current: Dashboard[]) => Dashboard[]) =>
      setState((current) => {
        let nextHistory = current.history
        const nextDashboards = update(current.dashboards).map((next, index) => {
          const prev = current.dashboards[index]
          if (!prev || next === prev || next.id !== prev.id) return next
          const recorded = recordVersion(prev, next, CURRENT_USER)
          if (recorded !== next) nextHistory = pushEdit(nextHistory, next.id, contentOf(prev))
          return recorded
        })
        return { ...current, dashboards: nextDashboards, history: nextHistory }
      }),
    [],
  )

  const value = useMemo<DashboardsStore>(() => {
    const nowIso = new Date(PROTOTYPE_NOW).toISOString()
    // Only dashboards with pages stamp one, so builder versions without pages keep saving exactly what they did.
    const activePageOf = (dashboard: Dashboard) => (dashboard.pages?.length ? activePages.current[dashboard.id] : undefined)
    const editDashboard = (id: string, update: (dashboard: Dashboard) => Dashboard) =>
      setContent((current) => current.map((dashboard) => (dashboard.id === id ? { ...update(dashboard), updatedAt: nowIso } : dashboard)))
    return {
      dashboards,
      favorites,
      isFavorite: (id) => favorites.includes(id),
      toggleFavorite: (id) => {
        const adding = !favorites.includes(id)
        setFavorites(adding ? [...favorites, id] : favorites.filter((favorite) => favorite !== id))
        return adding
      },
      createDashboard: (draft) => {
        const dashboard: Dashboard = {
          id: slugify(draft.name),
          name: draft.name,
          description: draft.description || undefined,
          tags: draft.tags.length ? draft.tags : undefined,
          updatedAt: nowIso,
          updatedBy: CURRENT_USER,
          owner: CURRENT_USER,
          members: [],
          generalAccess: 'restricted',
          archived: false,
          sample: false,
          widgets: [],
          qualityScore: null,
          targetScore: 95,
          baselineScore: 75,
          vignette: 'quality-score',
          rulePrefix: 'NEW',
          table: 'ZTABLE',
          versions: [],
        }
        const created: Dashboard = {
          ...dashboard,
          versions: [{ id: crypto.randomUUID(), savedAt: new Date().toISOString(), author: CURRENT_USER, changes: ['Created dashboard'], content: contentOf(dashboard) }],
        }
        setDashboards((current) => [created, ...current])
        return created
      },
      updateDashboard: (id, draft) =>
        setContent((current) =>
          current.map((dashboard) =>
            dashboard.id === id
              ? {
                  ...dashboard,
                  name: draft.name,
                  description: draft.description || undefined,
                  tags: draft.tags.length ? draft.tags : undefined,
                  updatedAt: nowIso,
                  updatedBy: CURRENT_USER,
                }
              : dashboard,
          ),
        ),
      setAppearance: (id, appearance) =>
        setContent((current) =>
          current.map((dashboard) => (dashboard.id === id ? { ...dashboard, appearance, updatedAt: nowIso } : dashboard)),
        ),
      setArchived: (id, archived) =>
        setDashboards((current) => current.map((dashboard) => (dashboard.id === id ? { ...dashboard, archived } : dashboard))),
      addSavedFilter: (id, savedFilter) =>
        setDashboards((current) =>
          current.map((dashboard) => (dashboard.id === id ? { ...dashboard, savedFilters: [...(dashboard.savedFilters ?? []), savedFilter] } : dashboard)),
        ),
      removeSavedFilter: (id, savedFilterId) =>
        setDashboards((current) =>
          current.map((dashboard) =>
            dashboard.id === id ? { ...dashboard, savedFilters: dashboard.savedFilters?.filter((entry) => entry.id !== savedFilterId) } : dashboard,
          ),
        ),
      updateSavedFilter: (id, savedFilterId, patch) =>
        setDashboards((current) =>
          current.map((dashboard) =>
            dashboard.id === id
              ? { ...dashboard, savedFilters: dashboard.savedFilters?.map((entry) => (entry.id === savedFilterId ? { ...entry, ...patch } : entry)) }
              : dashboard,
          ),
        ),
      pinRun: (id, workflowId, runId) =>
        setDashboards((current) =>
          current.map((dashboard) => {
            if (dashboard.id !== id) return dashboard
            const { [workflowId]: _previous, ...rest } = dashboard.pinnedRuns ?? {}
            return { ...dashboard, pinnedRuns: runId ? { ...rest, [workflowId]: runId } : rest }
          }),
        ),
      published,
      foundryFolders,
      publishDatasets: (entries) => {
        registerPublishedTables(entries)
        const paths = new Set(entries.map((entry) => entry.table.name))
        setState((current) => ({
          ...current,
          published: [...current.published.filter((entry) => !paths.has(entry.table.name)), ...entries],
          foundryFolders: { ...current.foundryFolders, ...Object.fromEntries(entries.map((entry) => [entry.dashboardId, entry.folder])) },
        }))
      },
      unpublishDatasets: (paths) => {
        unregisterPublishedTables(paths)
        setState((current) => ({ ...current, published: current.published.filter((entry) => !paths.includes(entry.table.name)) }))
      },
      deleteDashboard: (id) => {
        setDashboards((current) => current.filter((dashboard) => dashboard.id !== id))
        setFavorites(favorites.filter((favorite) => favorite !== id))
      },
      addWidgets: (id, items) =>
        setContent((current) =>
          current.map((dashboard) => {
            if (dashboard.id !== id) return dashboard
            const existing = dashboard.widgets ?? []
            const pageId = activePageOf(dashboard)
            const added = items
              .filter((item) => !existing.some((widget) => sameSource(widget, item)))
              .map((item) => (pageId && !item.pageId ? { ...item, pageId } : item))
            return {
              ...dashboard,
              widgets: [...existing, ...added],
              lastExecution: dashboard.lastExecution ?? nowIso,
              qualityScore: dashboard.qualityScore ?? FIRST_RUN_SCORE,
              updatedAt: nowIso,
            }
          }),
        ),
      insertWidget: (id, item, layout) =>
        editDashboard(id, (dashboard) => {
          const pageId = activePageOf(dashboard)
          const saved = new Set(layout.map((rect) => rect.i))
          return {
            ...dashboard,
            widgets: [...(dashboard.widgets ?? []), pageId ? { ...item, pageId } : item],
            layout: [...(dashboard.layout ?? []).filter((rect) => !saved.has(rect.i)), ...layout],
          }
        }),
      removeWidget: (id, itemId) =>
        setContent((current) =>
          current.map((dashboard) =>
            dashboard.id === id
              ? {
                  ...dashboard,
                  widgets: dashboard.widgets?.filter((widget) => widget.id !== itemId),
                  layout: dashboard.layout?.filter((rect) => rect.i !== itemId),
                  updatedAt: nowIso,
                }
              : dashboard,
          ),
        ),
      updateWidget: (id, item) =>
        setContent((current) =>
          current.map((dashboard) =>
            dashboard.id === id
              ? {
                  ...dashboard,
                  widgets: dashboard.widgets?.map((widget) => (widget.id === item.id ? item : widget)),
                  updatedAt: nowIso,
                }
              : dashboard,
          ),
        ),
      updateWidgets: (id, items) =>
        setContent((current) =>
          current.map((dashboard) =>
            dashboard.id === id
              ? {
                  ...dashboard,
                  widgets: dashboard.widgets?.map((widget) => items.find((item) => item.id === widget.id) ?? widget),
                  updatedAt: nowIso,
                }
              : dashboard,
          ),
        ),
      setLayout: (id, layout) =>
        editDashboard(id, (dashboard) => {
          const saved = new Set(layout.map((rect) => rect.i))
          return { ...dashboard, layout: [...(dashboard.layout ?? []).filter((rect) => !saved.has(rect.i)), ...layout] }
        }),
      setActivePage: (id, pageId) => {
        activePages.current[id] = pageId
      },
      addPage: (id, page) =>
        editDashboard(id, (dashboard) => {
          const pinned = withExplicitPages(dashboard)
          return { ...pinned, pages: [...(pinned.pages ?? []), page] }
        }),
      updatePage: (id, page) =>
        editDashboard(id, (dashboard) => ({ ...dashboard, pages: dashboardPages(dashboard).map((entry) => (entry.id === page.id ? page : entry)) })),
      movePage: (id, pageId, delta) =>
        editDashboard(id, (dashboard) => {
          const pinned = withExplicitPages(dashboard)
          const pages = [...(pinned.pages ?? [])]
          const from = pages.findIndex((page) => page.id === pageId)
          const to = from + delta
          if (from < 0 || to < 0 || to >= pages.length) return dashboard
          ;[pages[from], pages[to]] = [pages[to], pages[from]]
          return { ...pinned, pages }
        }),
      duplicatePage: (id, pageId, page) => editDashboard(id, (dashboard) => copyPage(withExplicitPages(dashboard), pageId, page)),
      deletePage: (id, pageId) =>
        editDashboard(id, (dashboard) => (dashboardPages(dashboard).length > 1 ? dropPage(withExplicitPages(dashboard), pageId) : dashboard)),
      moveWidgetToPage: (id, itemId, pageId, newPage) =>
        editDashboard(id, (dashboard) => {
          const pinned = withExplicitPages(dashboard)
          const onTarget = new Set([...(pinned.widgets ?? []), ...(pinned.groups ?? [])].filter((entry) => entry.pageId === pageId).map((entry) => entry.id))
          const bottom = Math.max(0, ...(pinned.layout ?? []).filter((rect) => onTarget.has(rect.i)).map((rect) => rect.y + rect.h))
          return {
            ...pinned,
            pages: newPage ? [...(pinned.pages ?? []), newPage] : pinned.pages,
            widgets: pinned.widgets?.map((item) => (item.id === itemId ? { ...item, pageId } : item)),
            layout: pinned.layout?.map((rect) => (rect.i === itemId ? { ...rect, x: 0, y: bottom } : rect)),
          }
        }),
      addGroup: (id, group, layout) =>
        editDashboard(id, (dashboard) => {
          const saved = new Set(layout.map((rect) => rect.i))
          return {
            ...dashboard,
            groups: [...(dashboard.groups ?? []), { ...group, pageId: group.pageId ?? activePageOf(dashboard) }],
            layout: [...(dashboard.layout ?? []).filter((rect) => !saved.has(rect.i)), ...layout],
          }
        }),
      updateGroup: (id, group) =>
        editDashboard(id, (dashboard) => ({ ...dashboard, groups: dashboard.groups?.map((entry) => (entry.id === group.id ? group : entry)) })),
      removeGroup: (id, groupId) =>
        editDashboard(id, (dashboard) => ({
          ...dashboard,
          groups: dashboard.groups?.filter((group) => group.id !== groupId),
          layout: dashboard.layout?.filter((rect) => rect.i !== groupId),
        })),
      addFieldLink: (id, link) => editDashboard(id, (dashboard) => ({ ...dashboard, fieldLinks: [...(dashboard.fieldLinks ?? []), link] })),
      removeFieldLink: (id, linkId) =>
        editDashboard(id, (dashboard) => ({ ...dashboard, fieldLinks: dashboard.fieldLinks?.filter((link) => link.id !== linkId) })),
      addSources: (id, sources) =>
        setContent((current) =>
          current.map((dashboard) => {
            if (dashboard.id !== id) return dashboard
            const existing = dashboard.sources ?? []
            const added = sources.filter((source) => !existing.some((current) => current.table === source.table))
            return { ...dashboard, sources: [...existing, ...added], updatedAt: nowIso }
          }),
        ),
      renameSource: (id, table, label) =>
        setContent((current) =>
          current.map((dashboard) => {
            if (dashboard.id !== id) return dashboard
            const existing = dashboard.sources ?? []
            const sources = existing.some((source) => source.table === table)
              ? existing.map((source) => (source.table === table ? { ...source, label } : source))
              : [...existing, { table, label }]
            return { ...dashboard, sources, updatedAt: nowIso }
          }),
        ),
      addSqlDataset: (id, dataset) =>
        setContent((current) =>
          current.map((dashboard) =>
            dashboard.id === id ? { ...dashboard, sqlDatasets: [...(dashboard.sqlDatasets ?? []), dataset], updatedAt: nowIso } : dashboard,
          ),
        ),
      updateSqlDataset: (id, dataset) =>
        setContent((current) =>
          current.map((dashboard) =>
            dashboard.id === id
              ? { ...dashboard, sqlDatasets: dashboard.sqlDatasets?.map((entry) => (entry.id === dataset.id ? dataset : entry)), updatedAt: nowIso }
              : dashboard,
          ),
        ),
      removeDataset: (id, ref) =>
        setContent((current) =>
          current.map((dashboard) => {
            if (dashboard.id !== id) return dashboard
            const removed = new Set((dashboard.widgets ?? []).filter((item) => usesDataset(item, ref)).map((item) => item.id))
            const { [ref.kind === 'table' ? `table:${ref.table}` : `sql:${ref.id}`]: _dropped, ...datasetTransforms } = dashboard.datasetTransforms ?? {}
            return {
              ...dashboard,
              datasetTransforms,
              sources: ref.kind === 'table' ? dashboard.sources?.filter((source) => source.table !== ref.table) : dashboard.sources,
              sqlDatasets: ref.kind === 'sql' ? dashboard.sqlDatasets?.filter((entry) => entry.id !== ref.id) : dashboard.sqlDatasets,
              filters: dashboard.filters?.filter((filter) => filter.datasetKey !== (ref.kind === 'table' ? `table:${ref.table}` : `sql:${ref.id}`)),
              fieldLinks: dashboard.fieldLinks?.filter((link) =>
                link.fields.every((field) => field.datasetKey !== (ref.kind === 'table' ? `table:${ref.table}` : `sql:${ref.id}`)),
              ),
              widgets: dashboard.widgets?.filter((item) => !removed.has(item.id)),
              layout: dashboard.layout?.filter((rect) => !removed.has(rect.i)),
              updatedAt: nowIso,
            }
          }),
        ),
      setDatasetTransforms: (id, datasetKey, transforms) =>
        setContent((current) =>
          current.map((dashboard) => {
            if (dashboard.id !== id) return dashboard
            const { [datasetKey]: _previous, ...rest } = dashboard.datasetTransforms ?? {}
            return { ...dashboard, datasetTransforms: transforms ? { ...rest, [datasetKey]: transforms } : rest, updatedAt: nowIso }
          }),
        ),
      refresh: (id) =>
        setDashboards((current) =>
          current.map((dashboard) => (dashboard.id === id ? { ...dashboard, refreshedAt: new Date().toISOString() } : dashboard)),
        ),
      addMember: (id, member) =>
        setDashboards((current) =>
          current.map((dashboard) =>
            dashboard.id !== id || dashboard.owner === member.user || dashboard.members.some((entry) => entry.user === member.user)
              ? dashboard
              : { ...dashboard, members: [...dashboard.members, member] },
          ),
        ),
      setMemberRole: (id, user, role) =>
        setDashboards((current) =>
          current.map((dashboard) =>
            dashboard.id === id ? { ...dashboard, members: dashboard.members.map((entry) => (entry.user === user ? { ...entry, role } : entry)) } : dashboard,
          ),
        ),
      removeMember: (id, user) =>
        setDashboards((current) =>
          current.map((dashboard) => (dashboard.id === id ? { ...dashboard, members: dashboard.members.filter((entry) => entry.user !== user) } : dashboard)),
        ),
      setGeneralAccess: (id, generalAccess) =>
        setDashboards((current) => current.map((dashboard) => (dashboard.id === id ? { ...dashboard, generalAccess } : dashboard))),
      transferOwnership: (id, user) =>
        setDashboards((current) =>
          current.map((dashboard) => {
            if (dashboard.id !== id || !dashboard.members.some((entry) => entry.user === user)) return dashboard
            const others = dashboard.members.filter((entry) => entry.user !== user)
            return { ...dashboard, owner: user, members: [{ user: dashboard.owner, role: 'editor' }, ...others] }
          }),
        ),
      addFilter: (id, filter) =>
        editDashboard(id, (dashboard) => ({ ...dashboard, filters: [...(dashboard.filters ?? []), { ...filter, pageId: filter.pageId ?? activePageOf(dashboard) }] })),
      updateFilter: (id, filter) =>
        setContent((current) =>
          current.map((dashboard) =>
            dashboard.id === id
              ? { ...dashboard, filters: dashboard.filters?.map((entry) => (entry.id === filter.id ? filter : entry)), updatedAt: nowIso }
              : dashboard,
          ),
        ),
      setFilterValues: (id, filterId, values) =>
        setContent((current) =>
          current.map((dashboard) =>
            dashboard.id === id
              ? { ...dashboard, filters: dashboard.filters?.map((filter) => (filter.id === filterId ? { ...filter, values } : filter)), updatedAt: nowIso }
              : dashboard,
          ),
        ),
      removeFilter: (id, filterId) =>
        setContent((current) =>
          current.map((dashboard) =>
            dashboard.id === id ? { ...dashboard, filters: dashboard.filters?.filter((filter) => filter.id !== filterId), updatedAt: nowIso } : dashboard,
          ),
        ),
      setFilterAllPages: (id, filterId, allPages) =>
        editDashboard(id, (dashboard) => {
          const target = dashboard.filters?.find((filter) => filter.id === filterId)
          if (!target) return dashboard
          if (!allPages)
            return { ...dashboard, filters: dashboard.filters?.map((filter) => (filter.id === filterId ? { ...filter, allPages: undefined, pageId: activePageOf(dashboard) ?? filter.pageId } : filter)) }
          return {
            ...dashboard,
            filters: dashboard.filters
              ?.filter((filter) => filter.id === filterId || !isPageCopy(filter, target))
              .map((filter) => (filter.id === filterId ? { ...filter, allPages: true } : filter)),
          }
        }),
      restoreVersion: (id, versionId) =>
        setState((current) => {
          const dashboard = current.dashboards.find((candidate) => candidate.id === id)
          if (!dashboard) return current
          const restored = restoreVersion(dashboard, versionId, CURRENT_USER)
          if (restored === dashboard) return current
          return {
            ...current,
            dashboards: current.dashboards.map((candidate) => (candidate.id === id ? { ...restored, updatedAt: nowIso, updatedBy: CURRENT_USER } : candidate)),
            history: pushEdit(current.history, id, contentOf(dashboard)),
          }
        }),
      undo: (id) => setState((current) => stepHistory(current, id, 'undo')),
      redo: (id) => setState((current) => stepHistory(current, id, 'redo')),
      canUndo: (id) => (history[id]?.past.length ?? 0) > 0,
      canRedo: (id) => (history[id]?.future.length ?? 0) > 0,
    }
  }, [dashboards, history, published, foundryFolders, favorites, setFavorites, setContent, setDashboards])

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useDashboards() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('useDashboards must be used within DashboardsProvider')
  return ctx
}
