import type { ReactNode } from "react";
import type { Dashboard } from "../../../data/dashboards";
import { useDashboards } from "../../../data/DashboardsStore";
import { TagChips } from "../../../ui/TagChips";
import { EditableTitle } from "./EditableTitle";

type BuilderHeaderProps = {
  dashboard: Dashboard;
  /** Shown right after the name, e.g. who has access. */
  badge?: ReactNode;
  trailing?: ReactNode;
  /** Viewers see the name without the rename field. */
  readOnly?: boolean;
};

/** Builder header: editable name, access badge and tags with an optional right-hand slot, and the description below. */
export function BuilderHeader({
  dashboard,
  badge,
  trailing,
  readOnly = false,
}: BuilderHeaderProps) {
  const { updateDashboard } = useDashboards();
  return (
    <div className="flex shrink-0 flex-col gap-0.5 border-b border-white/10 px-5 py-3">
      <div className="flex min-w-0 items-center gap-2">
        {readOnly ? (
          <h1 className="min-w-0 truncate py-0.5 text-base/6 font-semibold text-white">
            {dashboard.name}
          </h1>
        ) : (
          <EditableTitle
            value={dashboard.name}
            onChange={(name) =>
              updateDashboard(dashboard.id, {
                name,
                description: dashboard.description ?? "",
                tags: dashboard.tags ?? [],
              })
            }
          />
        )}
        {badge}
        {dashboard.tags?.length ? <TagChips tags={dashboard.tags} max={2} /> : null}
        {trailing && <div className="ml-auto shrink-0">{trailing}</div>}
      </div>
      {dashboard.description && (
        <p className="min-w-0 truncate text-sm text-white/50">
          {dashboard.description}
        </p>
      )}
    </div>
  );
}
