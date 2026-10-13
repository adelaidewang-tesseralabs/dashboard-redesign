export type UsageUnit = 'tokens' | 'costs'
export type UsageSeries = { key: string; name: string; color: string }
export type RankRow = { name: string; email?: string; total: string; detail: string }

export const USAGE_DAYS = ['Sep 19', 'Sep 20', 'Sep 21', 'Sep 22', 'Sep 23', 'Sep 24', 'Sep 25']

export const USAGE_BARS = [
  { day: 'Sep 19', input: 20, output: 2 },
  { day: 'Sep 20', input: 99, output: 9 },
  { day: 'Sep 21', input: 172, output: 16 },
  { day: 'Sep 22', input: 62, output: 6 },
  { day: 'Sep 23', input: 90, output: 8 },
  { day: 'Sep 24', input: 103, output: 9 },
  { day: 'Sep 25', input: 149, output: 9.3 },
]

export const USAGE_USERS: UsageSeries[] = [
  { key: 'minju', name: 'minju.lee', color: '#8b5cf6' },
  { key: 'jacques', name: 'jacques', color: '#60a5fa' },
  { key: 'himanshu', name: 'himanshu', color: '#34d399' },
  { key: 'bench', name: 'bench', color: '#f59e0b' },
  { key: 'viswanathan', name: 'viswanathan.subramanian', color: '#22d3ee' },
  { key: 'sanket', name: 'sanket.shah', color: '#e879f9' },
  { key: 'system', name: 'system', color: '#94a3b8' },
  { key: 'rishikesh', name: 'rishikesh', color: '#a3e635' },
  { key: 'joseph', name: 'joseph.watts', color: '#fb923c' },
  { key: 'arhant', name: 'arhant', color: '#f87171' },
]

export const USER_VALUES: Record<string, number[]> = {
  minju: [6, 14, 22, 10, 16, 72, 102],
  jacques: [10, 34, 38, 22, 16, 10, 8],
  himanshu: [4, 16, 42, 8, 20, 6, 4],
  bench: [8, 18, 16, 12, 22, 14, 10],
  viswanathan: [2, 6, 14, 22, 10, 6, 4],
  sanket: [1, 4, 8, 6, 12, 4, 3],
  system: [3, 8, 6, 4, 5, 3, 2],
  rishikesh: [2, 10, 28, 6, 4, 3, 2],
  joseph: [1, 3, 6, 4, 8, 5, 3],
  arhant: [1, 2, 4, 3, 5, 4, 2],
}

export const USAGE_MODELS: UsageSeries[] = [
  { key: 'sonnet5', name: 'claude-sonnet-5', color: '#8b5cf6' },
  { key: 'sonnet46', name: 'claude-sonnet-4-6', color: '#60a5fa' },
  { key: 'haiku', name: 'claude-haiku-4-5', color: '#34d399' },
  { key: 'opus', name: 'claude-opus-5', color: '#f59e0b' },
  { key: 'gpt56', name: 'gpt-5.6-sol', color: '#f87171' },
  { key: 'gpt54', name: 'gpt-5.4', color: '#e879f9' },
]

export const MODEL_VALUES: Record<string, number[]> = {
  sonnet5: [8, 48, 58, 32, 36, 78, 142],
  sonnet46: [6, 22, 55, 28, 16, 12, 8],
  haiku: [2, 12, 44, 8, 6, 4, 3],
  opus: [4, 24, 28, 12, 20, 8, 6],
  gpt56: [1, 6, 16, 4, 3, 2, 2],
  gpt54: [1, 4, 8, 2, 2, 1, 1],
}

export const CHAT_TYPES: UsageSeries[] = [
  { key: 'conversations', name: 'Conversations', color: '#8b5cf6' },
  { key: 'workflow', name: 'Workflow', color: '#60a5fa' },
  { key: 'system', name: 'System', color: '#34d399' },
  { key: 'knowledge', name: 'Knowledge Base', color: '#f59e0b' },
  { key: 'harmonization', name: 'Data Harmonization', color: '#f87171' },
  { key: 'foundry', name: 'Data Foundry', color: '#e879f9' },
  { key: 'workbench', name: 'Workbench', color: '#22d3ee' },
  { key: 'remediation', name: 'Code Remediation', color: '#fb923c' },
  { key: 'other', name: 'Other', color: '#94a3b8' },
]

export const CHAT_VALUES: Record<string, number[]> = {
  conversations: [18, 62, 88, 42, 52, 86, 72],
  workflow: [4, 14, 22, 8, 12, 18, 48],
  system: [2, 8, 28, 6, 8, 4, 3],
  knowledge: [1, 4, 10, 3, 4, 2, 2],
  harmonization: [1, 3, 6, 2, 3, 2, 1],
  foundry: [1, 2, 4, 2, 2, 1, 1],
  workbench: [1, 3, 5, 2, 3, 2, 2],
  remediation: [0.4, 1, 3, 1, 1, 1, 1],
  other: [0.8, 3, 6, 2, 3, 2, 2],
}

export const USAGE_GROUPS = ['All groups', 'Engineering', 'Finance', 'Platform']

export const USAGE_STATS: Record<UsageUnit, { label: string; value: string }[]> = {
  tokens: [
    { label: 'Input tokens', value: '695.0M' },
    { label: 'Output tokens', value: '59.3M' },
    { label: 'Total tokens', value: '754.4M' },
  ],
  costs: [
    { label: 'Input cost', value: '$1.24M' },
    { label: 'Output cost', value: '$412.6k' },
    { label: 'Total cost', value: '$1.65M' },
  ],
}

export const CHAT_RANKS: Record<UsageUnit, RankRow[]> = {
  tokens: [
    { name: 'Conversations', total: '319.1M', detail: '311.2M in · 8.0M out' },
    { name: 'Workflow', total: '225.7M', detail: '192.5M in · 33.3M out' },
    { name: 'System', total: '111.9M', detail: '93.5M in · 18.5M out' },
    { name: 'Knowledge Base', total: '42.1M', detail: '39.4M in · 2.7M out' },
  ],
  costs: [
    { name: 'Conversations', total: '$684.2k', detail: '$412.0k in · $272.2k out' },
    { name: 'Workflow', total: '$498.1k', detail: '$255.4k in · $242.7k out' },
    { name: 'System', total: '$241.6k', detail: '$124.0k in · $117.6k out' },
    { name: 'Knowledge Base', total: '$86.4k', detail: '$52.1k in · $34.3k out' },
  ],
}

export const USER_RANKS: Record<UsageUnit, RankRow[]> = {
  tokens: [
    { name: 'Minju Lee', email: 'minju.lee@tesseralabs.ai', total: '217.6M', detail: '174.4M in · 43.2M out' },
    { name: 'Jacques Maeda', email: 'jacques@tesseralabs.ai', total: '111.3M', detail: '108.4M in · 2.9M out' },
    { name: 'Himanshu Goswami', email: 'himanshu@tesseralabs.ai', total: '101.5M', detail: '99.1M in · 2.4M out' },
    { name: 'bench', email: 'bench@local', total: '91.7M', detail: '86.2M in · 5.5M out' },
  ],
  costs: [
    { name: 'Minju Lee', email: 'minju.lee@tesseralabs.ai', total: '$486.2k', detail: '$231.4k in · $254.8k out' },
    { name: 'Jacques Maeda', email: 'jacques@tesseralabs.ai', total: '$248.6k', detail: '$143.8k in · $104.8k out' },
    { name: 'Himanshu Goswami', email: 'himanshu@tesseralabs.ai', total: '$226.4k', detail: '$131.5k in · $94.9k out' },
    { name: 'bench', email: 'bench@local', total: '$198.1k', detail: '$114.4k in · $83.7k out' },
  ],
}

export const MODEL_CATALOG = [
  { provider: 'Anthropic', model: 'claude-sonnet-5', status: 'ACTIVE' },
  { provider: 'Anthropic', model: 'claude-sonnet-4-6', status: 'ACTIVE' },
  { provider: 'Anthropic', model: 'claude-haiku-4-5', status: 'ACTIVE' },
  { provider: 'Anthropic', model: 'claude-opus-5', status: 'ACTIVE' },
  { provider: 'OpenAI', model: 'gpt-5.6-sol', status: 'ACTIVE' },
  { provider: 'OpenAI', model: 'gpt-5.4', status: 'ACTIVE' },
  { provider: 'Anthropic', model: 'claude-3-haiku', status: 'DEPRECATED' },
]

export function usageRows(series: UsageSeries[], values: Record<string, number[]>, cumulative: boolean) {
  const running: Record<string, number> = {}
  return USAGE_DAYS.map((day, index) => {
    const row: Record<string, string | number> = { day }
    for (const item of series) {
      const next = values[item.key][index] ?? 0
      running[item.key] = cumulative ? (running[item.key] ?? 0) + next : next
      row[item.key] = running[item.key]
    }
    return row
  })
}

export function formatUsageAxis(value: number, unit: UsageUnit) {
  if (value === 0) return unit === 'costs' ? '$0' : '0'
  return unit === 'costs' ? `$${value.toFixed(0)}k` : `${value.toFixed(1)}M`
}
