import { useRef, type ReactNode } from 'react'
import { cn } from '../../../../lib/cn'
import { PanelResizeHandle } from '../PanelResizeHandle'
import type { SidePanelResize } from '../useSidePanelWidth'
import { useSplitRatio, type SplitRatio } from './useSplitRatio'
import type { SidePanelLayer } from './useV3SidePanel'

const KEY_STEP = 0.05

type StackedEditorPanelProps = {
  resize: SidePanelResize
  chat?: ReactNode
  editor?: ReactNode
  /** Which layer shows when both exist (V3). */
  front: SidePanelLayer
  /** Builder V5: settings above the chat with a draggable divider, instead of layered over it. */
  split?: boolean
}

/** Builder V3/V5 side column: Tessera AI underneath, widget settings layered over it (V3) or above it (V5) while a widget is selected. */
export function StackedEditorPanel({ resize, chat, editor, front, split = false }: StackedEditorPanelProps) {
  const asideRef = useRef<HTMLElement>(null)
  const splitRatio = useSplitRatio(asideRef)
  if (!chat && !editor) return null
  const splitPanes = split && !!chat && !!editor
  const editorOnTop = !splitPanes && editor && (!chat || front === 'editor')

  return (
    <aside
      ref={asideRef}
      aria-label={splitPanes ? 'Widget settings and Tessera AI' : editorOnTop ? 'Widget settings' : 'Tessera AI'}
      style={{ width: resize.width }}
      className="relative flex min-h-0 shrink-0 flex-col border-l border-white/10 bg-tlai-1"
    >
      <PanelResizeHandle resize={resize} />
      {/* Every slot keeps its position, so the chat stays mounted across selection changes and a half-typed message survives. */}
      {splitPanes && (
        <div style={{ height: `${splitRatio.ratio * 100}%` }} className="flex min-h-0 shrink-0 flex-col">
          {editor}
        </div>
      )}
      {splitPanes && <SplitDivider split={splitRatio} />}
      {chat && <div className="flex min-h-0 flex-1 flex-col">{chat}</div>}
      {editorOnTop && <div className={chat ? 'absolute inset-0 z-[5] flex flex-col bg-tlai-1' : 'flex min-h-0 flex-1 flex-col'}>{editor}</div>}
    </aside>
  )
}

function SplitDivider({ split }: { split: SplitRatio }) {
  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      aria-label="Resize settings and chat"
      aria-valuenow={Math.round(split.ratio * 100)}
      aria-valuemin={20}
      aria-valuemax={80}
      title="Drag to resize, double-click to reset"
      tabIndex={0}
      onPointerDown={split.startResize}
      onDoubleClick={split.reset}
      onKeyDown={(event) => {
        if (event.key === 'ArrowUp') split.nudge(-KEY_STEP)
        else if (event.key === 'ArrowDown') split.nudge(KEY_STEP)
        else return
        event.preventDefault()
      }}
      className="group relative z-10 h-px shrink-0 cursor-row-resize bg-white/10 outline-none before:absolute before:inset-x-0 before:-inset-y-1 before:content-['']"
    >
      <span
        className={cn(
          'absolute inset-x-0 top-0 h-px transition-colors group-hover:bg-tlai-mint group-focus-visible:bg-tlai-mint',
          split.dragging && 'bg-tlai-mint',
        )}
      />
    </div>
  )
}
