import { useEffect, useState } from 'react'
import type { Dashboard, DashboardSource } from '../../../data/dashboards'
import { useDashboards } from '../../../data/DashboardsStore'
import type { CanvasItem } from '../../../data/widgets'
import { itemLabel } from './canvasItems'
import type { ChatChoice, ChatMessage, ChatSource } from './ChatPanel'
import { planWidgetEdit } from './planWidgetEdit'
import { planWidgets } from './planWidgets'

const THINKING_MS = 1400

/** What the assistant does with a prompt: graphs to add, sources to attach first, and the reply. */
export type ChatPlan = { items: CanvasItem[]; reply: string; attach?: DashboardSource[]; sources?: ChatSource[]; choices?: ChatChoice[] }
/** Must be stable (module-level) — it is an effect dependency. */
export type ChatPlanner = (prompt: string, dashboard: Dashboard) => ChatPlan

const planFromInsights: ChatPlanner = (prompt, dashboard) => planWidgets(prompt, dashboard.widgets ?? [])

/** `targetId` scopes the prompt to one graph: the assistant edits it instead of adding graphs. */
type PendingPrompt = { text: string; targetId?: string }

/** Tessera AI chat for a builder: sends a prompt, "thinks", then adds or edits graphs and replies. */
export function useBuilderChat(dashboard: Dashboard, planner: ChatPlanner = planFromInsights) {
  const { addWidgets, addSources, updateWidget } = useDashboards()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [pending, setPending] = useState<PendingPrompt | null>(null)
  const [chatOpen, setChatOpen] = useState(false)

  useEffect(() => {
    if (pending === null) return
    const timer = window.setTimeout(() => {
      const reply = (message: Omit<ChatMessage, 'id' | 'role'>) => setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'assistant', ...message }])
      const target = pending.targetId ? dashboard.widgets?.find((widget) => widget.id === pending.targetId) : undefined
      if (pending.targetId && !target) {
        reply({ text: 'That graph is no longer on the canvas.' })
      } else if (target) {
        const edit = planWidgetEdit(pending.text, target)
        if (edit.item) updateWidget(dashboard.id, edit.item)
        reply({ text: edit.reply })
      } else {
        const { items, reply: text, attach, sources, choices } = planner(pending.text, dashboard)
        if (attach?.length) addSources(dashboard.id, attach)
        if (items.length) addWidgets(dashboard.id, items)
        reply({ text, sources, choices })
      }
      setPending(null)
    }, THINKING_MS)
    return () => window.clearTimeout(timer)
  }, [pending, dashboard, planner, addWidgets, addSources, updateWidget])

  const send = (text: string, target?: CanvasItem) => {
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'user', text, target: target && itemLabel(target) }])
    setPending({ text, targetId: target?.id })
    setChatOpen(true)
  }

  return { messages, thinking: pending !== null, editingId: pending?.targetId ?? null, chatOpen, setChatOpen, send }
}
