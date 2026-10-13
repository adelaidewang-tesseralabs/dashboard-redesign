import { useEffect, useState, type SetStateAction } from 'react'
import type { useBuilderChat } from '../useBuilderChat'

type BuilderChat = ReturnType<typeof useBuilderChat>
export type SidePanelLayer = 'chat' | 'editor'

const STORAGE_KEY = 'insights-prototype.v3-chat-open'

function rememberedOpen() {
  return localStorage.getItem(STORAGE_KEY) !== 'false'
}

type V3SidePanelOptions = {
  /** Off in builder V2, which keeps its AI / Manual switch. */
  enabled: boolean
  chat: BuilderChat
  hasWidgets: boolean
  /** A widget's settings sit over the chat (V3). False in V4, where they dock under the canvas instead. */
  editorCoversChat: boolean
  setSelectedId: (itemId: string | null) => void
}

/**
 * Builder V3/V4 side column: Tessera AI is the default panel. In V3 a selected widget's settings cover it, and deselecting reveals it again.
 * Closing the chat is remembered, so deselecting never reopens it. Empty dashboards start without it — the canvas has its own prompt.
 */
export function useV3SidePanel({ enabled, chat, hasWidgets, editorCoversChat, setSelectedId }: V3SidePanelOptions) {
  const [front, setFront] = useState<SidePanelLayer>('editor')
  const [seenReplies, setSeenReplies] = useState(0)
  const { setChatOpen: setChatOpenRaw } = chat
  const chatVisible = chat.chatOpen && (!editorCoversChat || front === 'chat')
  const replies = chat.messages.filter((message) => message.role === 'assistant').length

  if (chatVisible && seenReplies !== replies) setSeenReplies(replies)

  useEffect(() => {
    if (enabled && hasWidgets && rememberedOpen()) setChatOpenRaw(true)
  }, [enabled, hasWidgets, setChatOpenRaw])

  const setChatOpen = (next: SetStateAction<boolean>) => {
    const open = typeof next === 'function' ? next(chatVisible) : next
    localStorage.setItem(STORAGE_KEY, String(open))
    if (open) setFront('chat')
    setChatOpenRaw(open)
  }

  return {
    front,
    unread: !chatVisible && replies > seenReplies,
    /** Passed to the canvas so its AI toggle and launcher treat a covered chat as closed. */
    chat: { ...chat, chatOpen: chatVisible, setChatOpen },
    select: (itemId: string | null) => {
      setSelectedId(itemId)
      if (itemId) setFront('editor')
    },
    showChat: () => setChatOpen(true),
    showEditor: () => setFront('editor'),
    closeChat: () => setChatOpen(false),
  }
}
