import { useState } from "react";
import { Library, List, Plus, type LucideIcon } from "lucide-react";
import type { Dashboard, SqlDataset } from "../../../../data/dashboards";
import { useDashboards } from "../../../../data/DashboardsStore";
import type { DataObject } from "../../../../data/dataSources";
import type { DatasetTransforms } from "../../../../data/transforms";
import { cn } from "../../../../lib/cn";
import { downloadCsv, toCsv } from "../../../../lib/csv";
import { Button } from "../../../../ui/Button";
import { Dialog } from "../../../../ui/Dialog";
import { useToast } from "../../../../ui/Toast";
import { SourceIcon, type AddSourceKind } from "../sourceKinds";
import { AddDatasetMenu } from "./AddDatasetMenu";
import { CatalogConsole } from "./CatalogConsole";
import { CatalogPanel } from "./CatalogPanel";
import { DatasetList } from "./DatasetList";
import {
  datasetRef,
  datasetResult,
  datasetSql,
  datasetUsage,
  sqlKey,
  type Dataset,
  type GraphColumn,
} from "./datasets";
import { DatasetWorkspace } from "./DatasetWorkspace";
import type { ConsoleTab, ConsoleTabs } from "./useConsoleTabs";
import type { TransformDrafts } from "./transforms/transformDrafts";
import { useApplyTransforms } from "./transforms/useApplyTransforms";

export type DataPanel = "datasets" | "catalog";

const PANELS = [
  { value: "datasets", label: "Dataset list", Icon: List },
  { value: "catalog", label: "Catalog", Icon: Library },
] as const satisfies { value: DataPanel; label: string; Icon: LucideIcon }[];

type DataTabProps = {
  dashboard: Dashboard;
  datasets: Dataset[];
  activeKey: string | null;
  onActivate: (key: string | null) => void;
  panel: DataPanel;
  onPanelChange: (panel: DataPanel) => void;
  onAddTable: (table: DataObject) => void;
  onNewSql: () => void;
  consoleTabs: ConsoleTabs;
  onSaveQuery: (tab: ConsoleTab) => void;
  onOpenDataset: (key: string) => void;
  onEditAsSql: (dataset: Extract<Dataset, { kind: "table" }>) => void;
  onCreateGraph: (dataset: Dataset, column?: GraphColumn) => void;
  /** Turns Create graph into a menu of columns to group by, plus Ask AI. */
  onAskAi?: () => void;
  onOpenWidget: (itemId: string) => void;
  /** Builder V3: drops the Catalog console, so the tab lists only added datasets and adds more through the production source menu. */
  onAddSourceKind?: (kind: AddSourceKind) => void;
  /** Builder V6 turns this off: the catalog only previews and adds tables, and SQL datasets can't be edited. */
  sqlEditing?: boolean;
  transformDrafts: TransformDrafts;
  /** Hides the dataset list or catalog column, e.g. while the AI chat needs the room. */
  listCollapsed?: boolean;
  /** A rail button was clicked while the list was collapsed. */
  onShowList?: () => void;
  onCollapseList?: () => void;
};

/** Builder V2's Data tab: manage what the dashboard reads. Building stays on the canvas. */
export function DataTab(props: DataTabProps) {
  const {
    dashboard,
    datasets,
    activeKey,
    onActivate,
    panel,
    onPanelChange,
    onAddTable,
    onNewSql,
    consoleTabs,
    onSaveQuery,
    onOpenDataset,
    onEditAsSql,
    onCreateGraph,
    onAskAi,
    onOpenWidget,
    onAddSourceKind,
    sqlEditing = true,
    transformDrafts,
    listCollapsed = false,
    onShowList,
    onCollapseList,
  } = props;
  const showCatalog = panel === "catalog" && !onAddSourceKind;
  // Builder V3 has no catalog and no rail; it gets a dataset-list button only to bring a collapsed list back.
  const railPanels = onAddSourceKind
    ? PANELS.filter(({ value }) => value === "datasets")
    : PANELS;
  const pickPanel = (value: DataPanel) => {
    onPanelChange(value);
    if (listCollapsed) onShowList?.();
  };
  const {
    renameSource,
    addSqlDataset,
    updateSqlDataset,
    removeDataset,
    setDatasetTransforms,
  } = useDashboards();
  const toast = useToast();
  const [removing, setRemoving] = useState<Dataset | null>(null);
  const widgets = dashboard.widgets ?? [];
  const active =
    datasets.find((dataset) => dataset.key === activeKey) ?? datasets[0];
  const added = new Set(
    datasets.flatMap((dataset) =>
      dataset.kind === "table" ? [dataset.object.name] : [],
    ),
  );

  const rename = (dataset: Dataset, label: string) => {
    if (dataset.kind === "table")
      renameSource(dashboard.id, dataset.object.name, label);
    else updateSqlDataset(dashboard.id, { ...dataset.dataset, label });
  };
  /** A table can only be attached once, so its copy is a SQL dataset over the same rows. */
  const duplicate = (dataset: Dataset) => {
    const id = crypto.randomUUID();
    const label = `${dataset.label} copy`;
    addSqlDataset(dashboard.id, { id, label, sql: datasetSql(dataset) });
    setDatasetTransforms(
      dashboard.id,
      sqlKey(id),
      dashboard.datasetTransforms?.[dataset.key],
    );
    onActivate(sqlKey(id));
    toast(`Duplicated as ${label}`);
  };
  const download = (dataset: Dataset) => {
    const result = datasetResult(dataset, dashboard);
    if (!result.ok) {
      toast(`Can't download ${dataset.label}: ${result.error}`);
      return;
    }
    downloadCsv(dataset.label, toCsv(result.columns, result.rows));
  };
  const apply = useApplyTransforms(dashboard, transformDrafts);
  const applyTransforms = (dataset: Dataset, transforms: DatasetTransforms) =>
    apply(dataset.key, dataset.label, transforms);
  const confirmRemove = () => {
    if (!removing) return;
    removeDataset(dashboard.id, datasetRef(removing));
    if (removing.key === active?.key) onActivate(null);
    setRemoving(null);
  };
  const removingUsage = removing
    ? datasetUsage(widgets, removing.key).length
    : 0;

  return (
    <div className="flex min-h-0 flex-1">
      {(!onAddSourceKind || listCollapsed) && (
        <div
          role="tablist"
          aria-label="Side panel"
          aria-orientation="vertical"
          className="flex w-10 shrink-0 flex-col items-center gap-1 border-r border-white/10 bg-tlai-1 pt-2"
        >
          {railPanels.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={panel === value && !listCollapsed}
              aria-label={label}
              title={label}
              onClick={() => pickPanel(value)}
              className={cn(
                "flex size-7 cursor-pointer items-center justify-center rounded-md text-white/55 hover:bg-white/10 hover:text-white",
                panel === value && !listCollapsed && "bg-white/10 text-white",
              )}
            >
              <Icon className="size-4" />
            </button>
          ))}
        </div>
      )}
      {showCatalog ? (
        <>
          {!listCollapsed && (
            <CatalogPanel
              added={added}
              activeTable={consoleTabs.active?.table?.name ?? null}
              onAddTable={onAddTable}
              onOpenTable={consoleTabs.openTable}
              onNewSql={sqlEditing ? onNewSql : undefined}
              onInsertColumn={
                sqlEditing && consoleTabs.active ? consoleTabs.insert : undefined
              }
              onCollapse={onCollapseList}
            />
          )}
          <CatalogConsole
            consoleTabs={consoleTabs}
            editable={sqlEditing}
            added={added}
            onAddTable={onAddTable}
            onSaveQuery={onSaveQuery}
            onOpenDataset={onOpenDataset}
          />
        </>
      ) : (
        <>
          {!listCollapsed && (
            <DatasetList
              datasets={datasets}
              widgets={widgets}
              activeKey={active?.key ?? null}
              unapplied={new Set(Object.keys(transformDrafts.drafts))}
              onActivate={onActivate}
              onRename={rename}
              onDuplicate={duplicate}
              onDownload={download}
              onRemove={setRemoving}
              onAddSource={() => onPanelChange("catalog")}
              onAddSourceKind={onAddSourceKind}
              onCollapse={onCollapseList}
            />
          )}
          {active ? (
            <DatasetWorkspace
              key={active.key}
              dashboard={dashboard}
              dataset={active}
              usedIn={datasetUsage(widgets, active.key)}
              transforms={dashboard.datasetTransforms?.[active.key]}
              draft={transformDrafts.drafts[active.key]}
              onDraftChange={(draft) =>
                transformDrafts.setDraft(active.key, draft)
              }
              onApplyTransforms={(transforms) => applyTransforms(active, transforms)}
              onRename={(label) => rename(active, label)}
              onSaveSql={
                sqlEditing
                  ? (dataset: SqlDataset) =>
                      updateSqlDataset(dashboard.id, dataset)
                  : undefined
              }
              onCreateGraph={(column) => onCreateGraph(active, column)}
              onAskAi={onAskAi}
              onDuplicate={() => duplicate(active)}
              onDownload={() => download(active)}
              onRemove={() => setRemoving(active)}
              onOpenWidget={onOpenWidget}
              onEditAsSql={
                sqlEditing && active.kind === "table"
                  ? () => onEditAsSql(active)
                  : undefined
              }
              rowLimit={sqlEditing}
            />
          ) : (
            <EmptyData
              onAddSource={() => onPanelChange("catalog")}
              onAddSourceKind={onAddSourceKind}
              onNewSql={sqlEditing ? onNewSql : undefined}
            />
          )}
        </>
      )}

      <Dialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title={`Remove ${removing?.label ?? "dataset"}?`}
        description={
          removingUsage === 0
            ? "No graphs use this dataset."
            : `${removingUsage === 1 ? "1 graph uses" : `${removingUsage} graphs use`} this dataset and will be removed from the canvas.`
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setRemoving(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmRemove}>
              Remove
            </Button>
          </>
        }
      >
        {removing?.kind === "table" && (
          <p className="font-mono text-xs text-white/55">
            {removing.object.name}
          </p>
        )}
      </Dialog>
    </div>
  );
}

const EMPTY_ORIGINS = ["mosaic", "foundry", "workflow", "upload"] as const;

function EmptyData({
  onAddSource,
  onAddSourceKind,
  onNewSql,
}: {
  onAddSource: () => void;
  onAddSourceKind?: (kind: AddSourceKind) => void;
  onNewSql?: () => void;
}) {
  const addButton = (onClick: () => void) => (
    <Button onClick={onClick}>
      <Plus className="size-4" />
      Add dataset
    </Button>
  );
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-5 bg-tlai-1 p-8 text-center">
      <div className="flex -space-x-1.5">
        {EMPTY_ORIGINS.map((origin) => (
          <span key={origin} className="rounded-lg ring-4 ring-tlai-1">
            <SourceIcon origin={origin} size="lg" />
          </span>
        ))}
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-white">
          Add data to this dashboard
        </h2>
        <p className="max-w-sm text-sm text-white/50">
          Mosaic objects, Foundry tables, workflow outputs and uploads, all in
          one place. Any number of graphs can chart each one.
        </p>
      </div>
      <div className="flex flex-col items-center gap-2">
        {onAddSourceKind ? (
          <AddDatasetMenu
            align="start"
            onSelect={onAddSourceKind}
            trigger={({ toggle }) => addButton(toggle)}
          />
        ) : (
          addButton(onAddSource)
        )}
        {onNewSql && (
          <p className="text-sm text-white/45">
            or{" "}
            <button
              type="button"
              onClick={onNewSql}
              className="cursor-pointer text-white/80 underline decoration-white/30 underline-offset-4 hover:text-white hover:decoration-white"
            >
              write SQL
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
