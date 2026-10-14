import { TriangleAlert, User, X } from 'lucide-react'
import type { Dashboard } from '../../../../data/dashboards'
import { dataIssues } from '../../../../data/dataIssues'
import type { DashboardVersion } from '../../../../data/versions'
import { cn } from '../../../../lib/cn'
import { formatDateTime, formatDay, formatTime } from '../../../../lib/format'
import { IconAction } from '../EditorFields'

type VersionHistoryPanelProps = {
  dashboard: Dashboard
  /** The version shown on the canvas; null is the current one. */
  selectedId: string | null
  onSelect: (versionId: string | null) => void
  onClose: () => void
}

/** Versions are numbered oldest first, so v1 is the dashboard's creation. */
export const versionNumber = (dashboard: Dashboard, version: DashboardVersion) => dashboard.versions.length - dashboard.versions.indexOf(version)

function nameOf(user: string) {
  const local = user.split('@')[0]
  return local.charAt(0).toUpperCase() + local.slice(1)
}

function byDay(versions: DashboardVersion[]) {
  const days = new Map<string, DashboardVersion[]>()
  for (const version of versions) {
    const day = formatDay(version.savedAt)
    days.set(day, [...(days.get(day) ?? []), version])
  }
  return [...days]
}

/** Final builder: modeled on the workflow version history panel. Selecting a version previews it on the canvas, read-only. */
export function VersionHistoryPanel({ dashboard, selectedId, onSelect, onClose }: VersionHistoryPanelProps) {
  const current = dashboard.versions[0]
  return (
    <aside aria-label="Version history" className="flex h-full w-80 shrink-0 flex-col overflow-hidden border-l border-white/10 bg-tlai-1">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-4">
        <div className="flex flex-col">
          <h3 className="text-sm font-semibold text-white">Version history</h3>
          <p className="text-xs text-white/50">{dashboard.versions.length === 1 ? '1 version' : `${dashboard.versions.length} versions`}</p>
        </div>
        <IconAction Icon={X} label="Close version history" onClick={onClose} />
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto pb-4">
        {byDay(dashboard.versions).map(([day, versions]) => (
          <section key={day}>
            <h4 className="sticky top-0 z-10 bg-tlai-1 px-4 pt-4 pb-1 text-[11px] font-medium tracking-wider text-white/45 uppercase">{day}</h4>
            <ol>
              {versions.map((version, index) => (
                <VersionRow
                  key={version.id}
                  version={version}
                  number={versionNumber(dashboard, version)}
                  current={version === current}
                  selected={version === current ? selectedId === null : selectedId === version.id}
                  isFirst={index === 0}
                  isLast={index === versions.length - 1}
                  onSelect={() => onSelect(version === current ? null : version.id)}
                />
              ))}
            </ol>
          </section>
        ))}
      </div>
    </aside>
  )
}

type VersionRowProps = { version: DashboardVersion; number: number; current: boolean; selected: boolean; isFirst: boolean; isLast: boolean; onSelect: () => void }

function VersionRow({ version, number, current, selected, isFirst, isLast, onSelect }: VersionRowProps) {
  const issues = dataIssues(version.content)
  const summary = version.restoredFrom ? `Restored the version from ${formatDateTime(version.restoredFrom)}` : version.changes.join(', ')
  return (
    <li className={cn('group relative flex items-stretch hover:bg-white/5', selected && 'bg-white/10 hover:bg-white/10')}>
      <div aria-hidden className="relative ml-4 flex w-2.5 shrink-0 justify-center">
        <span className={cn('absolute left-1/2 w-px -translate-x-1/2 bg-white/15', isFirst ? 'top-4' : 'top-0', isLast ? 'h-4' : 'bottom-0')} />
        <span className="relative mt-4 flex size-2.5 items-center justify-center">
          {current && <span className="absolute inline-flex size-full animate-ping rounded-full bg-tlai-mint/40" />}
          <span className={cn('relative size-2.5 rounded-full', current ? 'bg-tlai-mint' : 'bg-white/35 group-hover:bg-white')} />
        </span>
      </div>
      <button type="button" aria-pressed={selected} onClick={onSelect} className="flex min-w-0 flex-1 cursor-pointer flex-col items-start gap-1.5 py-2.5 pr-4 pl-3 text-left">
        <span className="flex items-center gap-1.5">
          <span className="h-5 rounded-md bg-white/10 px-1 text-xs leading-5 font-medium text-white tabular-nums">v{number}</span>
          {current && <span className="h-5 rounded-md border border-tlai-mint/30 bg-tlai-mint/10 px-1.5 text-xs leading-[18px] text-tlai-mint">Current</span>}
          <span className="text-xs text-white/50">{formatTime(version.savedAt)}</span>
        </span>
        <span className="line-clamp-2 text-xs leading-snug text-white/80">{summary}</span>
        <span className="flex items-center gap-1 text-xs text-white/40">
          <User className="size-3 shrink-0" aria-hidden />
          <span className="truncate">{nameOf(version.author)}</span>
        </span>
        {issues.length > 0 && (
          <span className="flex items-center gap-1.5 text-xs text-amber-300">
            <TriangleAlert className="size-3.5 shrink-0" aria-hidden />
            {issues.length === 1 ? `Uses ${issues[0].label}, which you can't load now` : `Uses ${issues.length} datasets you can't load now`}
          </span>
        )}
      </button>
    </li>
  )
}
