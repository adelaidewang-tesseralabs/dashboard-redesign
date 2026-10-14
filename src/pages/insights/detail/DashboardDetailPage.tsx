import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { can } from '../../../data/access'
import type { Dashboard } from '../../../data/dashboards'
import { useDashboards } from '../../../data/DashboardsStore'
import { builderPath, useBuilderVersion, type BuilderVersion } from '../../../lib/builderVersion'
import { usePanelLayout } from '../../../lib/panelLayout'
import { useEffectiveRole } from '../../../lib/roleOverride'
import { Button } from '../../../ui/Button'
import { PageLayout } from '../../../ui/PageLayout'
import { useToast } from '../../../ui/Toast'
import { DashboardBuilder } from '../builder/DashboardBuilder'
import { DashboardBuilderV2, type AddDatasetFlow, type SettingsPlacement } from '../builder/v2/DashboardBuilderV2'
import type { LineageTarget } from '../builder/lineage/lineageGraph'
import { DashboardFormDialog } from '../custom/DashboardFormDialog'
import { AccessChip } from './AccessChip'
import { DashboardIconActions, DetailHeaderActions } from './DetailHeaderActions'
import { ShareDialog } from './ShareDialog'
import { VersionHistoryDialog } from './VersionHistoryDialog'

const SETTINGS_PLACEMENT: Record<BuilderVersion, SettingsPlacement> = { v1: 'side', v2: 'side', v3: 'side', v4: 'bottom', v5: 'split', v6: 'split' }
const ADD_DATASET_FLOW: Record<BuilderVersion, AddDatasetFlow> = { v1: 'production', v2: 'catalog', v3: 'production', v4: 'production', v5: 'production', v6: 'governed' }

export function DashboardDetailPage() {
  const { dashboardId } = useParams()
  const { dashboards } = useDashboards()
  const [builderVersion] = useBuilderVersion()
  const dashboard = dashboards.find((item) => item.id === dashboardId)
  const listTo = builderPath('/insights/dashboards', builderVersion)

  if (!dashboard) {
    return (
      <PageLayout crumbs={[{ label: 'Insights' }, { label: 'Custom dashboards', to: listTo }, { label: 'Not found' }]}>
        <div className="flex flex-col items-center gap-2 py-24 text-center">
          <p className="text-sm text-white">Dashboard not found</p>
          <Link to={listTo} className="text-xs text-white/60 underline hover:text-white">
            Back to Custom dashboards
          </Link>
        </div>
      </PageLayout>
    )
  }

  return <DashboardDetail key={dashboard.id} dashboard={dashboard} />
}

function DashboardDetail({ dashboard }: { dashboard: Dashboard }) {
  const toast = useToast()
  const { updateDashboard } = useDashboards()
  const [dialog, setDialog] = useState<'share' | 'details' | 'history' | null>(null)
  const [lineage, setLineage] = useState<LineageTarget | null>(null)
  const [builderVersion] = useBuilderVersion()
  const panelLayout = usePanelLayout()
  const role = useEffectiveRole(dashboard)
  const listTo = builderPath('/insights/dashboards', builderVersion)
  const inBuilderV2 = builderVersion !== 'v1'
  const readOnly = !can(role, 'edit')
  const [invitee, setInvitee] = useState<string>()
  const share = () => {
    setInvitee(undefined)
    setDialog('share')
  }
  const shareWith = (user: string) => {
    setInvitee(user)
    setDialog('share')
  }
  const openHistory = () => setDialog('history')
  const actionProps = {
    dashboard,
    role,
    onShare: share,
    onEditDetails: () => setDialog('details'),
    onHistory: openHistory,
    onLineage: inBuilderV2 && !readOnly ? () => setLineage({ kind: 'dashboard' }) : undefined,
  }
  const badge = <AccessChip dashboard={dashboard} onClick={share} />

  if (role === null) return <NoAccess dashboard={dashboard} listTo={listTo} />

  return (
    <PageLayout
      crumbs={[{ label: 'Insights' }, { label: 'Custom dashboards', to: listTo }, { label: dashboard.name }]}
      className="flex flex-col overflow-hidden"
      actions={inBuilderV2 ? undefined : <DetailHeaderActions {...actionProps} />}
    >
      <title>{`${dashboard.name} · Insights`}</title>
      {inBuilderV2 ? (
        <DashboardBuilderV2
          dashboard={dashboard}
          headerActions={<DashboardIconActions {...actionProps} />}
          addDatasetFlow={ADD_DATASET_FLOW[builderVersion]}
          settingsPlacement={SETTINGS_PLACEMENT[builderVersion]}
          panelLayout={builderVersion === 'v3' ? panelLayout : 'layered'}
          badge={badge}
          readOnly={readOnly}
          onOpenHistory={openHistory}
          lineage={readOnly ? null : lineage}
          onLineageChange={setLineage}
          onShare={shareWith}
        />
      ) : (
        <DashboardBuilder dashboard={dashboard} badge={badge} readOnly={readOnly} onOpenHistory={openHistory} />
      )}

      <VersionHistoryDialog open={dialog === 'history'} onClose={() => setDialog(null)} dashboard={dashboard} />

      <ShareDialog open={dialog === 'share'} onClose={() => setDialog(null)} dashboard={dashboard} role={role} invitee={invitee} />

      <DashboardFormDialog
        open={dialog === 'details'}
        dashboard={dashboard}
        onClose={() => setDialog(null)}
        onSubmit={(draft) => {
          updateDashboard(dashboard.id, draft)
          toast('Dashboard updated')
          setDialog(null)
        }}
      />
    </PageLayout>
  )
}

function NoAccess({ dashboard, listTo }: { dashboard: Dashboard; listTo: string }) {
  const toast = useToast()
  return (
    <PageLayout crumbs={[{ label: 'Insights' }, { label: 'Custom dashboards', to: listTo }, { label: 'No access' }]}>
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <span className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white/70">
          <Lock className="size-5" />
        </span>
        <p className="text-sm font-medium text-white">You don't have access to this dashboard</p>
        <p className="text-xs text-white/55">Ask the owner, {dashboard.owner}, to share it with you.</p>
        <Button size="sm" onClick={() => toast(`Access requested from ${dashboard.owner}`)}>
          Request access
        </Button>
        <Link to={listTo} className="text-xs text-white/60 underline hover:text-white">
          Back to Custom dashboards
        </Link>
      </div>
    </PageLayout>
  )
}
