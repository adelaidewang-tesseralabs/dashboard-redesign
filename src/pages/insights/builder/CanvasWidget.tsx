import type { ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'
import type { Dashboard } from '../../../data/dashboards'
import { problemMessage, widgetProblem } from '../../../data/dataIssues'
import { runSql, type Cell as DataCell } from '../../../data/dataSources'
import { aggregateLabel, applyTransforms, defaultGraphValue, graphResult, type GraphQuery } from '../../../data/transforms'
import { showsLegend, usesSingleColor, type CanvasItem } from '../../../data/widgets'
import { formatNumber } from '../../../lib/format'
import { chartHighlight, type CrossHighlight } from './crossHighlight'
import { dashboardRowFilters } from './dashboardFilters'
import type { GraphViewActions, WidgetActions } from './GraphActionsMenu'
import { GraphFilterBadge } from './GraphFilterBadge'
import { GraphToolbar } from './GraphToolbar'
import { displaySubtitle, displayTitle, itemLabel, resolveObjectItem } from './canvasItems'
import { labelsOf, objectGraphQuery, type GraphColors } from './graphColors'
import { MediaWidget } from './MediaWidget'
import { usePreviewPerson } from './previewPerson'
import { SourceChart } from './SourceChart'
import { PinnedMark, SummaryText } from './SummaryText'
import { TextWidget } from './TextWidget'
import { useGraphView } from './useGraphView'
import { sqlKey, tableKey } from './v2/datasets'
import { WidgetFullScreen } from './WidgetFullScreen'

type CanvasWidgetProps = {
  dashboard: Dashboard
  item: CanvasItem
  /** Editing actions in the "…" menu; omitted for viewers and in preview, who get no "…". */
  actions?: WidgetActions
  /** Shows an "Ask AI" button that sends a request about this graph to Tessera AI. */
  onComment?: (text: string) => void
  /** Viewers and preview: media blocks without a file show no drop zone. */
  readOnly?: boolean
  /** A selected text block shows its editor. */
  selected?: boolean
  /** Builder V2+ preview: the part of the dashboard a viewer clicked, which graphs highlight or grey out against. */
  highlight?: CrossHighlight | null
  /** Builder V2+ preview: set when a viewer clicks a bar, slice, point or row. */
  onHighlight?: (highlight: CrossHighlight) => void
  /** Default-palette graphs: this graph's own colors, kept apart from unrelated graphs on the dashboard. */
  colors?: GraphColors
}

export function CanvasWidget({ dashboard, item, actions, onComment, readOnly = false, selected = false, highlight = null, onHighlight, colors }: CanvasWidgetProps) {
  const label = displayTitle(item) || itemLabel(item)
  const graphView = useGraphView({ dashboard, item, label, readOnly })
  const body = { dashboard, item, readOnly, selected, highlight, onHighlight, colors, onComment }
  return (
    <div ref={graphView.cardRef} data-widget-id={item.id} className="group/widget relative h-full">
      <WidgetBody {...body} actions={actions} viewFor={graphView.viewFor} />
      {graphView.fullScreenHost && (
        <WidgetFullScreen
          label={label}
          host={graphView.fullScreenHost}
          contentRef={graphView.fullScreenRef}
          onClose={graphView.closeFullScreen}
          onSelect={readOnly ? undefined : graphView.selectFullScreen}
        >
          <WidgetBody {...body} selected={false} viewFor={graphView.viewFor} />
        </WidgetFullScreen>
      )}
    </div>
  )
}

type WidgetBodyProps = Required<Pick<CanvasWidgetProps, 'dashboard' | 'item' | 'readOnly' | 'selected' | 'highlight'>> &
  Pick<CanvasWidgetProps, 'actions' | 'onHighlight' | 'colors' | 'onComment'> & { viewFor: (columns: string[], rows: DataCell[][]) => GraphViewActions }

function WidgetBody({ dashboard, item, actions, viewFor, readOnly, selected, highlight, onHighlight, colors, onComment }: WidgetBodyProps) {
  const previewPerson = usePreviewPerson()
  const title = displayTitle(item)
  const subtitle = displaySubtitle(item)
  const label = title || itemLabel(item)
  const toolbar = (view?: GraphViewActions) => <GraphToolbar label={label} actions={actions} view={view} onComment={onComment} />
  // Items without a chart header carry the toolbar in their top-right corner.
  const withCornerMenu = (body: ReactNode, leading?: ReactNode) => (
    <>
      {body}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
        {leading}
        {toolbar()}
      </div>
    </>
  )
  const problem = widgetProblem(item, dashboard, previewPerson)
  if (problem) return withCornerMenu(<DataError title={label} message={problemMessage(problem, previewPerson)} />)
  switch (item.source) {
    case 'media':
      return withCornerMenu(<MediaWidget dashboardId={dashboard.id} item={item} title={title} readOnly={readOnly} />)
    case 'text': {
      const { summary } = item
      if (summary) return withCornerMenu(<SummaryText dashboard={dashboard} item={{ ...item, summary }} title={title} readOnly={readOnly} selected={selected} />, !readOnly && summary.edited && <PinnedMark />)
      return withCornerMenu(<TextWidget dashboardId={dashboard.id} item={item} title={title} readOnly={readOnly} selected={selected} doubleClickToEdit />)
    }
    case 'object': {
      const resolved = resolveObjectItem(item)
      if (!resolved) return withCornerMenu(<Unavailable message="This data source is no longer available." />)
      const { object, field } = resolved
      const datasetKey = tableKey(object.name)
      const rows = applyTransforms(runSql(`SELECT * FROM ${object.name}`), dashboard.datasetTransforms?.[datasetKey])
      const query = withDashboardFilters(objectGraphQuery(item), dashboard, datasetKey)
      const result = graphResult(rows, field.key, query, field.values)
      if (!result.ok) return withCornerMenu(<Unavailable message={result.error} />)
      const columns = [field.label, aggregateLabel(query.value ?? defaultGraphValue(rows, field.key))]
      return (
        <SourceChart
          title={title}
          subtitle={subtitle}
          source={`Source: ${object.label} · ${formatNumber(rows.ok ? rows.rows.length : 0)} records`}
          chart={item.chart}
          columns={columns}
          rows={result.rows}
          actions={toolbar(viewFor(columns, result.rows))}
          colorKeys={colors?.colorKeys ?? [...new Set([...field.values, ...labelsOf(graphResult(rows, field.key, objectGraphQuery(item)))])]}
          colorOffset={colors?.offset}
          color={usesSingleColor(item.chart) ? item.color : undefined}
          palette={item.palette}
          legend={showsLegend(item)}
          highlight={chartHighlight(highlight, datasetKey, rows, field.key, query)}
          onSelectLabel={onHighlight && ((value) => onHighlight({ datasetKey, column: field.key, columnLabel: field.label, value }))}
          badge={<GraphFilterBadge dashboard={dashboard} item={item} highlight={highlight} />}
        />
      )
    }
    case 'sql': {
      const dataset = item.datasetId ? dashboard.sqlDatasets?.find((entry) => entry.id === item.datasetId) : undefined
      if (item.datasetId && !dataset) return withCornerMenu(<Unavailable message="This dataset was removed." />)
      const sql = dataset?.sql ?? item.sql
      const transforms = item.datasetId ? dashboard.datasetTransforms?.[sqlKey(item.datasetId)] : undefined
      const rows = applyTransforms(runSql(sql), transforms)
      const query = item.datasetId ? withDashboardFilters(item.query ?? {}, dashboard, sqlKey(item.datasetId)) : item.query
      const result = graphResult(rows, undefined, query)
      if (!result.ok) return withCornerMenu(<Unavailable message={result.error} />)
      // Standalone queries (no saved dataset) have nothing another graph could share, so they key on the graph itself.
      const datasetKey = item.datasetId ? sqlKey(item.datasetId) : `graph:${item.id}`
      const labelColumn = result.columns[0]
      return (
        <SourceChart
          title={title}
          subtitle={subtitle}
          source={dataset ? `Dataset: ${dataset.label}` : sql}
          chart={item.chart}
          columns={result.columns}
          rows={result.rows}
          actions={toolbar(viewFor(result.columns, result.rows))}
          colorKeys={colors?.colorKeys ?? labelsOf(graphResult(rows, undefined, item.query))}
          colorOffset={colors?.offset}
          color={usesSingleColor(item.chart) ? item.color : undefined}
          palette={item.palette}
          legend={showsLegend(item)}
          highlight={chartHighlight(highlight, datasetKey, rows, undefined, query)}
          onSelectLabel={onHighlight && labelColumn !== undefined ? (value) => onHighlight({ datasetKey, column: labelColumn, columnLabel: labelColumn, value }) : undefined}
          badge={<GraphFilterBadge dashboard={dashboard} item={item} highlight={highlight} />}
        />
      )
    }
    default: {
      const unhandled: never = item
      return unhandled
    }
  }
}

function withDashboardFilters(query: GraphQuery, dashboard: Dashboard, datasetKey: string): GraphQuery {
  return { ...query, filters: [...(query.filters ?? []), ...dashboardRowFilters(dashboard, datasetKey)] }
}

/** The graph's data is out of reach: the viewer lost access, or the dataset is gone. */
function DataError({ title, message }: { title: string; message: string }) {
  return (
    <div role="alert" className="flex h-full flex-col items-center justify-center gap-1.5 rounded-lg border border-red-400/30 bg-[var(--dash-card)] p-4 text-center">
      <TriangleAlert className="mb-1 size-5 text-red-300" aria-hidden />
      <p className="text-sm font-medium text-[var(--dash-fg)]">{title}</p>
      <p className="max-w-xs text-xs text-[var(--dash-muted)]">{message}</p>
    </div>
  )
}

function Unavailable({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-lg bg-[var(--dash-card)] p-4 text-center text-sm text-[var(--dash-muted)]">
      {message}
    </div>
  )
}
