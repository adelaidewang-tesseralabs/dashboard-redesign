import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useDashboards } from "../../../data/DashboardsStore";
import type { CanvasItem } from "../../../data/widgets";
import { cn } from "../../../lib/cn";
import {
  applyMarkdown,
  blockTypeAt,
  type BlockType,
  type MarkdownCommand,
} from "./markdownEdit";
import { MarkdownView } from "./MarkdownView";
import {
  TEXT_ALIGN_CLASS,
  TONE_BACKGROUND,
  TONE_BORDER,
  VERTICAL_ALIGN_CLASS,
} from "./textBoxStyle";
import { COMMAND_GROUPS, TextToolbar, type TextAlign } from "./TextToolbar";

type TextItem = Extract<CanvasItem, { source: "text" }>;
type TextWidgetProps = {
  dashboardId: string;
  item: TextItem;
  title: string;
  readOnly: boolean;
  selected: boolean;
  /** Shown above the text, e.g. who wrote it. */
  badge?: ReactNode;
  /** Pinned below the text. */
  footer?: ReactNode;
  /** Offered to editors while the block has no text, e.g. a way to fill it. */
  emptyAction?: ReactNode;
  /** Saves edited text in place of a plain update, for blocks that track who wrote them. */
  onSaveText?: (markdown: string) => void;
  /** Sized by its text, and the editor grows as you type, instead of filling a grid cell. */
  fitContent?: boolean;
  /** Selecting only selects, so the block can be dragged and resized; double-click or Enter edits. */
  doubleClickToEdit?: boolean;
};

const SHORTCUTS = COMMAND_GROUPS.flat().filter((entry) => entry.key);

/** Blocks that should open straight into the editor when they mount, i.e. ones just added from the toolbar. */
const pendingEdits = new Set<string>();

export function requestTextEdit(itemId: string) {
  pendingEdits.add(itemId);
}

function isTyping(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName) ||
      !!target.closest("[role=dialog], [role=menu]"))
  );
}

/**
 * A text block: rendered Markdown that turns into an editor while selected (or, with `doubleClickToEdit`, on double-click).
 * The draft saves when the textarea loses focus (or on Escape), so one edit session is one undo step.
 */
export function TextWidget({
  dashboardId,
  item,
  title,
  readOnly,
  selected,
  badge,
  footer,
  emptyAction,
  onSaveText,
  fitContent = false,
  doubleClickToEdit = false,
}: TextWidgetProps) {
  const { updateWidget } = useDashboards();
  const [editRequested, setEditRequested] = useState(() =>
    pendingEdits.delete(item.id),
  );
  const [wasSelected, setWasSelected] = useState(selected);
  if (selected !== wasSelected) {
    setWasSelected(selected);
    if (!selected) setEditRequested(false);
  }
  const editing =
    !readOnly && selected && (!doubleClickToEdit || editRequested);
  const canStartEditing = doubleClickToEdit && !readOnly && selected && !editing;
  const [draft, setDraft] = useState(item.markdown);
  const [syncedMarkdown, setSyncedMarkdown] = useState(item.markdown);
  const [blockType, setBlockType] = useState<BlockType>("paragraph");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const style = item.style ?? {};
  const textAlign = style.textAlign ?? "left";

  // Undo, redo and AI edits change the saved text underneath the draft.
  if (item.markdown !== syncedMarkdown) {
    setSyncedMarkdown(item.markdown);
    setDraft(item.markdown);
  }

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!editing || !textarea) return;
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    setBlockType(blockTypeAt(textarea.value, textarea.value.length));
  }, [editing]);

  useEffect(() => {
    if (!canStartEditing) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Enter" || isTyping(event.target)) return;
      event.preventDefault();
      setEditRequested(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canStartEditing]);

  const commit = () => {
    if (draft === item.markdown) return;
    if (onSaveText) onSaveText(draft);
    else updateWidget(dashboardId, { ...item, markdown: draft });
  };
  const trackCaret = () => {
    const textarea = textareaRef.current;
    if (textarea)
      setBlockType(blockTypeAt(textarea.value, textarea.selectionStart));
  };
  const apply = (command: MarkdownCommand) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const next = applyMarkdown(
      {
        text: draft,
        start: textarea.selectionStart,
        end: textarea.selectionEnd,
      },
      command,
    );
    setDraft(next.text);
    setBlockType(blockTypeAt(next.text, next.start));
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(next.start, next.end);
    });
  };
  const align = (next: TextAlign) =>
    updateWidget(dashboardId, {
      ...item,
      markdown: draft,
      style: { ...style, textAlign: next },
    });
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Escape") {
      commit();
      if (doubleClickToEdit) {
        // Stays selected so it can be dragged; the canvas would otherwise deselect on Escape.
        event.stopPropagation();
        setEditRequested(false);
      }
      return;
    }
    if (!(event.metaKey || event.ctrlKey)) return;
    const shortcut = SHORTCUTS.find(
      (entry) => entry.key === event.key.toLowerCase(),
    );
    if (!shortcut) return;
    event.preventDefault();
    apply(shortcut.command);
  };

  return (
    <div
      data-editing={editing || undefined}
      className={cn("rounded-lg bg-[var(--dash-card)]", !fitContent && "h-full")}
    >
      {/* Only the content clips: the toolbar's dropdowns open downward over it. */}
      <div
        className={cn(
          "relative flex flex-col rounded-lg border",
          !fitContent && "h-full",
          style.border ? TONE_BORDER[style.border] : "border-transparent",
          style.background && TONE_BACKGROUND[style.background],
        )}
      >
        {editing && (
          <TextToolbar
            blockType={blockType}
            textAlign={textAlign}
            onCommand={apply}
            onAlign={align}
          />
        )}
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {badge && <div className="shrink-0 px-4 pt-3">{badge}</div>}
          {title && (
            <h4 className="shrink-0 truncate px-4 pt-3 text-sm font-medium text-[var(--dash-fg)]">
              {title}
            </h4>
          )}
          {editing ? (
            <textarea
              ref={textareaRef}
              aria-label="Text block"
              data-text-block
              value={draft}
              placeholder="Add a description, notes or context. Markdown works too."
              onChange={(event) => setDraft(event.target.value)}
              onSelect={trackCaret}
              onBlur={commit}
              onKeyDown={onKeyDown}
              className={cn(
                "cursor-text resize-none bg-transparent px-4 py-3 text-sm leading-relaxed text-[var(--dash-fg)] outline-none placeholder:text-[var(--dash-faint)]",
                fitContent ? "field-sizing-content" : "min-h-0 flex-1",
                TEXT_ALIGN_CLASS[textAlign],
                badge && "pt-1.5",
              )}
            />
          ) : (
            <div
              onDoubleClick={
                doubleClickToEdit && !readOnly
                  ? () => setEditRequested(true)
                  : undefined
              }
              className={cn(
                "flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-3",
                badge && "pt-1.5",
                VERTICAL_ALIGN_CLASS[style.verticalAlign ?? "top"],
                TEXT_ALIGN_CLASS[textAlign],
                !readOnly && !doubleClickToEdit && "cursor-text",
              )}
            >
              {item.markdown.trim() ? (
                <MarkdownView markdown={item.markdown} />
              ) : (
                !readOnly && (
                  <p className="text-sm text-[var(--dash-faint)]">
                    {doubleClickToEdit
                      ? "Double-click to add text"
                      : "Click to add text"}
                  </p>
                )
              )}
            </div>
          )}
        </div>
        {canStartEditing && item.markdown.trim() && (
          <span className="pointer-events-none absolute right-2 bottom-2 rounded-full border border-[var(--dash-border)] bg-[var(--dash-card)] px-2 py-0.5 text-[11px] text-[var(--dash-muted)]">
            Double-click to edit
          </span>
        )}
        {emptyAction && !readOnly && !draft.trim() && (
          <div className="shrink-0 px-4 pb-3">{emptyAction}</div>
        )}
        {footer}
      </div>
    </div>
  );
}
