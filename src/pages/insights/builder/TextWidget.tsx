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
  /** Saves edited text in place of a plain update, for blocks that track who wrote them. */
  onSaveText?: (markdown: string) => void;
  /** Sized by its text, and the editor grows as you type, instead of filling a grid cell. */
  fitContent?: boolean;
};

const SHORTCUTS = COMMAND_GROUPS.flat().filter((entry) => entry.key);

/**
 * A text block: rendered Markdown that turns into an editor while selected.
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
  onSaveText,
  fitContent = false,
}: TextWidgetProps) {
  const { updateWidget } = useDashboards();
  const editing = !readOnly && selected;
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
          "flex flex-col rounded-lg border",
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
              className={cn(
                "flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-3",
                badge && "pt-1.5",
                VERTICAL_ALIGN_CLASS[style.verticalAlign ?? "top"],
                TEXT_ALIGN_CLASS[textAlign],
                !readOnly && "cursor-text",
              )}
            >
              {item.markdown.trim() ? (
                <MarkdownView markdown={item.markdown} />
              ) : (
                !readOnly && (
                  <p className="text-sm text-[var(--dash-faint)]">
                    Click to add text
                  </p>
                )
              )}
            </div>
          )}
        </div>
        {footer}
      </div>
    </div>
  );
}
