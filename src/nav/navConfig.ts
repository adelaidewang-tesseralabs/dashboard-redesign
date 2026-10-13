import {
  Brain,
  ChartNoAxesCombined,
  CircleFadingArrowUp,
  Database,
  Hammer,
  HomeIcon,
  MessagesSquare,
  type LucideIcon,
} from 'lucide-react'

export type NavL3 = { id: string; label: string; to: string }
export type NavL2 = { id: string; label: string; l3s: NavL3[] }
export type NavL1 = {
  id: string
  label: string
  Icon: LucideIcon
  /** Panel-less L1s navigate straight here (Home, Chat — same as the main app's `directTo`). */
  directTo?: string
  l2s: NavL2[]
}

/**
 * L1 → L2 → L3 registry. Shape follows the main app's `navigation/config/nav.config.tsx`;
 * the tree itself follows the "Final" IA from tessera-data-prototype (`OPTION7_GROUPS`),
 * which adds Insights as its own L1. Only Insights has built-out pages.
 */
export const NAV_CONFIG: NavL1[] = [
  { id: 'home', label: 'Home', Icon: HomeIcon, directTo: '/home', l2s: [] },
  { id: 'chat', label: 'Chat', Icon: MessagesSquare, directTo: '/chat', l2s: [] },
  {
    id: 'build',
    label: 'Build',
    Icon: Hammer,
    l2s: [
      {
        id: 'loom',
        label: 'Loom',
        l3s: [
          { id: 'workflows', label: 'Workflows', to: '/build/workflows' },
          { id: 'executions', label: 'Executions', to: '/build/executions' },
          { id: 'templates', label: 'Templates', to: '/build/templates' },
        ],
      },
    ],
  },
  {
    id: 'data',
    label: 'Data',
    Icon: Database,
    l2s: [
      {
        id: 'connect',
        label: '1 Connect',
        l3s: [
          { id: 'connectors', label: 'Connectors', to: '/data/connectors' },
          { id: 'systems', label: 'Systems', to: '/data/systems' },
        ],
      },
      {
        id: 'data-lake',
        label: '2 Data lake',
        l3s: [
          { id: 'catalog', label: 'Catalog', to: '/data/catalog' },
          { id: 'pipelines', label: 'Pipelines', to: '/data/pipelines' },
          { id: 'sql-console', label: 'SQL console', to: '/data/sql-console' },
          { id: 'exports', label: 'Export & Migrations', to: '/data/exports' },
          { id: 'lineage', label: 'Lineage explorer', to: '/data/lineage' },
        ],
      },
      {
        id: 'quality',
        label: '3 Quality',
        l3s: [
          { id: 'checks', label: 'Data checks', to: '/data/checks' },
          { id: 'execution-groups', label: 'Execution groups', to: '/data/execution-groups' },
          { id: 'coverage', label: 'Coverage map', to: '/data/coverage' },
        ],
      },
      {
        id: 'map',
        label: '4 Map',
        l3s: [
          { id: 'blueprints', label: 'Blueprints', to: '/data/blueprints' },
          { id: 'templates-library', label: 'Templates library', to: '/data/templates-library' },
        ],
      },
    ],
  },
  {
    id: 'insights',
    label: 'Insights',
    Icon: ChartNoAxesCombined,
    l2s: [
      {
        id: 'dashboards',
        label: 'Dashboards',
        l3s: [
          { id: 'custom-dashboards', label: 'Custom dashboards', to: '/insights/dashboards' },
          { id: 'system-dashboards', label: 'System dashboards', to: '/insights/system-dashboards' },
        ],
      },
    ],
  },
  {
    id: 'knowledge',
    label: 'Knowledge',
    Icon: Brain,
    l2s: [
      {
        id: 'knowledge-base',
        label: 'Knowledge base',
        l3s: [
          { id: 'wiki', label: 'Wiki', to: '/knowledge/wiki' },
          { id: 'files', label: 'Files', to: '/knowledge/files' },
          { id: 'skills', label: 'Skills', to: '/knowledge/skills' },
        ],
      },
    ],
  },
  {
    id: 'modernize',
    label: 'Modernize',
    Icon: CircleFadingArrowUp,
    l2s: [
      {
        id: 'modernize',
        label: 'Code',
        l3s: [
          { id: 'workbench', label: 'Workbench', to: '/modernize/workbench' },
          { id: 'code-remedy', label: 'Code remedy', to: '/modernize/code-remedy' },
          { id: 'assessment', label: 'Migration assessment', to: '/modernize/assessment' },
        ],
      },
    ],
  },
]

export type ActiveNav = { l1Id: string | null; l2Id: string | null; l3Id: string | null }

/** Longest-prefix match, so detail pages (`/insights/dashboards/:id`) keep their L3 highlighted. */
export function resolveActiveNav(pathname: string): ActiveNav {
  let best: (ActiveNav & { length: number }) | null = null
  for (const l1 of NAV_CONFIG) {
    if (l1.directTo && pathname.startsWith(l1.directTo)) return { l1Id: l1.id, l2Id: null, l3Id: null }
    for (const l2 of l1.l2s) {
      for (const l3 of l2.l3s) {
        const matches = pathname === l3.to || pathname.startsWith(`${l3.to}/`)
        if (matches && (!best || l3.to.length > best.length)) {
          best = { l1Id: l1.id, l2Id: l2.id, l3Id: l3.id, length: l3.to.length }
        }
      }
    }
  }
  return best ? { l1Id: best.l1Id, l2Id: best.l2Id, l3Id: best.l3Id } : { l1Id: null, l2Id: null, l3Id: null }
}

export function findL3Label(pathname: string) {
  const active = resolveActiveNav(pathname)
  const l1 = NAV_CONFIG.find((item) => item.id === active.l1Id)
  const l2 = l1?.l2s.find((item) => item.id === active.l2Id)
  return { l1, l2, l3: l2?.l3s.find((item) => item.id === active.l3Id) }
}
