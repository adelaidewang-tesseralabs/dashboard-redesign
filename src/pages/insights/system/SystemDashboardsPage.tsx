import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarDays, ChevronDown, Gauge } from 'lucide-react'
import type { UsageUnit } from '../../../data/llmUsage'
import {
  CHAT_RANKS,
  CHAT_TYPES,
  CHAT_VALUES,
  MODEL_CATALOG,
  MODEL_VALUES,
  USAGE_GROUPS,
  USAGE_MODELS,
  USAGE_STATS,
  USAGE_USERS,
  USER_RANKS,
  USER_VALUES,
} from '../../../data/llmUsage'
import { cn } from '../../../lib/cn'
import { Button } from '../../../ui/Button'
import { ChartPanel } from '../../../ui/ChartPanel'
import { Chip } from '../../../ui/Chip'
import { Menu } from '../../../ui/Menu'
import { MetricCard } from '../../../ui/MetricCard'
import { PageLayout } from '../../../ui/PageLayout'
import { PanelTabs, type PanelTab } from '../../../ui/PanelTabs'
import { RankList, UsageBarChart, UsageLineChart } from './UsagePanels'

type SystemTab = 'llm-usage' | 'model-catalog'

const TABS: PanelTab<SystemTab>[] = [
  { id: 'llm-usage', label: 'LLM usage' },
  { id: 'model-catalog', label: 'Model catalog' },
]

const ALL_USERS = 'All users'

export function SystemDashboardsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = TABS.find((item) => item.id === searchParams.get('tab'))?.id ?? 'llm-usage'

  return (
    <PageLayout crumbs={[{ label: 'Insights' }, { label: 'System dashboards' }]}>
      <title>System dashboards · Insights</title>
      <div className="flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-1">
          <h1 className="flex items-center gap-2 text-xl font-semibold text-white">
            <Gauge className="size-5" />
            System dashboards
          </h1>
          <p className="text-sm text-white/60">Built by Tessera. Platform usage, spend and the model catalog.</p>
        </div>
        <PanelTabs
          tabs={TABS}
          value={tab}
          onChange={(next) => setSearchParams(next === 'llm-usage' ? {} : { tab: next }, { replace: true })}
        />
        {tab === 'llm-usage' ? <LlmUsage /> : <ModelCatalog />}
      </div>
    </PageLayout>
  )
}

function SelectMenu({ value, options, onChange }: { value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <Menu
      align="start"
      trigger={({ toggle }) => (
        <Button variant="outline" onClick={toggle}>
          {value}
          <ChevronDown className="size-3.5 text-white/50" />
        </Button>
      )}
      items={options.map((option) => ({ label: option, active: option === value, onSelect: () => onChange(option) }))}
    />
  )
}

function LlmUsage() {
  const [unit, setUnit] = useState<UsageUnit>('tokens')
  const [granularity, setGranularity] = useState('Daily')
  const [group, setGroup] = useState(USAGE_GROUPS[0])
  const [user, setUser] = useState(ALL_USERS)
  const [cumulative, setCumulative] = useState(false)

  const userSeries = user === ALL_USERS ? USAGE_USERS : USAGE_USERS.filter((item) => item.name === user)
  const userRanks = user === ALL_USERS ? USER_RANKS[unit] : USER_RANKS[unit].filter((row) => row.email?.startsWith(user))
  const costs = unit === 'costs'

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 bg-tlai-4/60 px-3 text-sm text-white/80">
          <CalendarDays className="size-4 text-white/50" />
          Sep 19, 2026
          <span className="text-white/35">→</span>
          Sep 25, 2026
        </span>
        <SelectMenu value={granularity} options={['Hourly', 'Daily', 'Weekly']} onChange={setGranularity} />
        <div className="flex rounded-lg border border-white/10 bg-tlai-3 p-0.5">
          {(['tokens', 'costs'] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={option === unit}
              onClick={() => setUnit(option)}
              className={cn(
                'h-8 cursor-pointer rounded-md px-3 text-sm text-white/60 capitalize hover:text-white',
                option === unit && 'bg-white/10 text-white',
              )}
            >
              {option}
            </button>
          ))}
        </div>
        <SelectMenu value={group} options={USAGE_GROUPS} onChange={setGroup} />
        <SelectMenu value={user} options={[ALL_USERS, ...USAGE_USERS.map((item) => item.name)]} onChange={setUser} />
        <Button
          variant="outline"
          className={cn('ml-auto', cumulative && 'border-white/30 bg-white/10 text-white')}
          aria-pressed={cumulative}
          onClick={() => setCumulative((current) => !current)}
        >
          Cumulative
        </Button>
      </div>

      <div className="grid gap-2 md:grid-cols-3">
        {USAGE_STATS[unit].map((stat) => (
          <MetricCard key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <ChartPanel title={costs ? 'Cost over time ($)' : 'Usage over time'}>
          <UsageBarChart unit={unit} />
        </ChartPanel>
        <ChartPanel title={costs ? 'Cost per user ($)' : 'Usage per user'} description="Top 10 of 50 users">
          <UsageLineChart series={userSeries} values={USER_VALUES} cumulative={cumulative} unit={unit} />
        </ChartPanel>
        <ChartPanel title={costs ? 'Cost per LLM over time ($)' : 'Tokens per LLM over time'}>
          <UsageLineChart series={USAGE_MODELS} values={MODEL_VALUES} cumulative={cumulative} unit={unit} />
        </ChartPanel>
        <ChartPanel title={costs ? 'Cost by chat type over time ($)' : 'Usage by chat type over time'}>
          <UsageLineChart series={CHAT_TYPES} values={CHAT_VALUES} cumulative={cumulative} unit={unit} />
        </ChartPanel>
        <RankList title={costs ? 'Top chat types by cost' : 'Top chat types'} rows={CHAT_RANKS[unit]} />
        <RankList title={costs ? 'Top users by cost' : 'Top users'} rows={userRanks} />
      </div>
    </div>
  )
}

function ModelCatalog() {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10">
      <div className="grid h-10 grid-cols-[160px_1fr_140px] items-center border-b border-white/10 bg-tlai-2 text-xs font-medium text-white/60 uppercase">
        <span className="px-4">Provider</span>
        <span className="px-4">Model</span>
        <span className="px-4">Status</span>
      </div>
      {MODEL_CATALOG.map((row) => (
        <div
          key={row.model}
          className="grid h-12 grid-cols-[160px_1fr_140px] items-center border-b border-white/5 text-sm last:border-b-0 hover:bg-white/[0.03]"
        >
          <span className="px-4 text-white/80">{row.provider}</span>
          <span className="px-4 font-mono text-xs text-white">{row.model}</span>
          <span className="px-4">
            <Chip value={row.status} tone={row.status === 'ACTIVE' ? 'success' : 'neutral'} />
          </span>
        </div>
      ))}
    </div>
  )
}
