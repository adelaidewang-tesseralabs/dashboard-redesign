import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Dashboard } from '../../../data/dashboards'
import { useDashboards } from '../../../data/DashboardsStore'
import { builderPath, useBuilderVersion } from '../../../lib/builderVersion'
import { Button } from '../../../ui/Button'
import { Dialog } from '../../../ui/Dialog'
import { PageLayout } from '../../../ui/PageLayout'
import { Pagination } from '../../../ui/Pagination'
import { useToast } from '../../../ui/Toast'
import { buildFilterFields, queryDashboards } from './dashboardQuery'
import { DashboardFormDialog } from './DashboardFormDialog'
import { DashboardsEmptyState } from './DashboardsEmptyState'
import { DashboardsGrid } from './DashboardsGrid'
import { DashboardsTable } from './DashboardsTable'
import { DashboardsToolbar } from './DashboardsToolbar'
import { SampleDashboardsBanner } from './SampleDashboardsBanner'
import { PAGE_SIZES, useDashboardListState } from './useDashboardListState'

type DialogState =
  | { kind: 'edit'; dashboard: Dashboard }
  | { kind: 'delete'; dashboard: Dashboard }
  | { kind: 'credentials' }
  | null

const pad = (value: number) => String(value).padStart(2, '0')

/** "New Dashboard 10/08/2026 13:53" */
function defaultDashboardName(date: Date) {
  return `New Dashboard ${pad(date.getMonth() + 1)}/${pad(date.getDate())}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function CustomDashboardsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const store = useDashboards()
  const [builderVersion] = useBuilderVersion()
  const list = useDashboardListState()
  const [dialog, setDialog] = useState<DialogState>(null)

  const ownDashboards = store.dashboards.filter((dashboard) => !dashboard.sample)
  const showingSamples = ownDashboards.length === 0
  const listed = showingSamples ? store.dashboards : ownDashboards
  const fields = buildFilterFields(listed)
  const filtered = queryDashboards(listed, list, store.favorites)
  const pageCount = Math.max(1, Math.ceil(filtered.length / list.pageSize))
  const currentPage = Math.min(list.page, pageCount - 1)
  const pageRows = filtered.slice(currentPage * list.pageSize, (currentPage + 1) * list.pageSize)

  const createDashboard = () => {
    const created = store.createDashboard({
      name: defaultDashboardName(new Date()),
      description: '',
      workstream: '',
    })
    navigate(builderPath(`/insights/dashboards/${created.id}`, builderVersion))
  }

  const rowProps = {
    rows: pageRows,
    favorites: store.favorites,
    onToggleFavorite: store.toggleFavorite,
    onEdit: (dashboard: Dashboard) => setDialog({ kind: 'edit', dashboard }),
    onDelete: (dashboard: Dashboard) => setDialog({ kind: 'delete', dashboard }),
    onToggleArchived: (dashboard: Dashboard) => {
      store.setArchived(dashboard.id, !dashboard.archived)
      toast(dashboard.archived ? 'Dashboard restored' : 'Dashboard archived')
    },
  }

  return (
    <PageLayout crumbs={[{ label: 'Insights' }, { label: 'Custom dashboards' }]}>
      <title>Custom dashboards · Insights</title>
      <div className="mx-auto flex w-full flex-col gap-5 p-5">
        <h1 className="text-xl font-semibold text-white">Custom dashboards</h1>

        {showingSamples && store.dashboards.length > 0 && (
          <SampleDashboardsBanner />
        )}

        <div className="flex flex-col gap-3">
          <DashboardsToolbar
            fields={fields}
            filters={list.filters}
            sort={list.sort}
            archived={list.archived}
            search={list.search}
            view={list.view}
            onFiltersChange={list.setFilters}
            onSortChange={list.setSort}
            onArchivedChange={list.setArchived}
            onSearchChange={list.setSearch}
            onViewChange={list.setView}
            onOpenSettings={() => setDialog({ kind: 'credentials' })}
            onCreate={createDashboard}
          />

          {pageRows.length === 0 ? (
            <DashboardsEmptyState
              hasDashboards={store.dashboards.length > 0}
              archived={list.archived}
              isNarrowed={list.hasActiveFilters || list.search !== ''}
              onCreate={createDashboard}
              onShowAll={list.showAll}
            />
          ) : list.view === 'grid' ? (
            <DashboardsGrid {...rowProps} />
          ) : (
            <DashboardsTable {...rowProps} />
          )}

          {filtered.length > 0 && (
            <Pagination
              page={currentPage}
              pageSize={list.pageSize}
              total={filtered.length}
              pageSizeOptions={PAGE_SIZES}
              onPageChange={list.setPage}
              onPageSizeChange={list.setPageSize}
            />
          )}
        </div>
      </div>

      <DashboardFormDialog
        open={dialog?.kind === 'edit'}
        dashboard={dialog?.kind === 'edit' ? dialog.dashboard : undefined}
        onClose={() => setDialog(null)}
        onSubmit={(draft) => {
          if (dialog?.kind !== 'edit') return
          store.updateDashboard(dialog.dashboard.id, draft)
          toast('Dashboard updated')
          setDialog(null)
        }}
      />

      <Dialog
        open={dialog?.kind === 'delete'}
        onClose={() => setDialog(null)}
        title="Delete dashboard"
        description={dialog?.kind === 'delete' ? `“${dialog.dashboard.name}” and its graphs will be removed.` : undefined}
        footer={
          <>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (dialog?.kind === 'delete') store.deleteDashboard(dialog.dashboard.id)
                toast('Dashboard deleted')
                setDialog(null)
              }}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-white/60">Data checks stay in their library.</p>
      </Dialog>

      <Dialog open={dialog?.kind === 'credentials'} onClose={() => setDialog(null)} title="Credentials">
        <p className="text-sm text-white/60">Source-system credentials used when dashboards execute data checks.</p>
      </Dialog>
    </PageLayout>
  )
}
