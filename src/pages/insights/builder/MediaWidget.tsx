import { useRef, useState, type DragEvent } from 'react'
import { Image } from 'lucide-react'
import { useDashboards } from '../../../data/DashboardsStore'
import type { CanvasItem, MediaFile, MediaKind } from '../../../data/widgets'
import { cn } from '../../../lib/cn'

type MediaItem = Extract<CanvasItem, { source: 'media' }>

const ACCEPTED_TYPES: Record<string, MediaKind> = {
  'image/png': 'image',
  'image/jpeg': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'image/svg+xml': 'image',
  'application/pdf': 'pdf',
  'video/mp4': 'video',
}

const MAX_BYTES = 10 * 1024 * 1024

const MEDIA_FORMATS = 'PNG, JPEG, GIF, WebP, SVG, PDF or MP4'

const linkClass = 'cursor-pointer font-medium text-[var(--dash-fg)] underline decoration-[var(--dash-faint)] underline-offset-2 hover:decoration-[var(--dash-fg)]'

/** A pasted link has no MIME type to check, so its extension decides how it is shown. */
function kindFromUrl(url: URL): MediaKind {
  const path = url.pathname.toLowerCase()
  if (path.endsWith('.pdf')) return 'pdf'
  if (path.endsWith('.mp4') || path.endsWith('.webm')) return 'video'
  return 'image'
}

export function mediaFromFile(file: File): MediaFile | string {
  const kind = ACCEPTED_TYPES[file.type]
  if (!kind) return `${file.name} isn't a supported file. Use ${MEDIA_FORMATS}.`
  if (file.size > MAX_BYTES) return `${file.name} is larger than 10 MB.`
  return { name: file.name, kind, url: URL.createObjectURL(file) }
}

function mediaFromUrl(text: string): MediaFile | string {
  let url: URL
  try {
    url = new URL(text.trim())
  } catch {
    return 'Enter a full link, starting with https://'
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return 'Enter a full link, starting with https://'
  return { name: decodeURIComponent(url.pathname.split('/').filter(Boolean).at(-1) ?? url.hostname), kind: kindFromUrl(url), url: url.href }
}

type MediaWidgetProps = { dashboardId: string; item: MediaItem; title: string; readOnly: boolean }

/** An image, PDF or video on the canvas; until a file is added, editors see a drop zone and viewers see nothing to load. */
export function MediaWidget({ dashboardId, item, title, readOnly }: MediaWidgetProps) {
  const { updateWidget } = useDashboards()
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg bg-[var(--dash-card)]">
      {title && <h4 className="shrink-0 truncate px-4 pt-3 pb-2 text-sm font-medium text-[var(--dash-fg)]">{title}</h4>}
      <div className="min-h-0 flex-1">
        {item.media ? (
          <MediaView media={item.media} interactive={readOnly} />
        ) : readOnly ? (
          <p className="flex h-full items-center justify-center p-4 text-sm text-[var(--dash-muted)]">No media added yet.</p>
        ) : (
          <div className="h-full p-3">
            <MediaDropZone onAdd={(media) => updateWidget(dashboardId, { ...item, media })} />
          </div>
        )}
      </div>
    </div>
  )
}

/** While editing, PDFs and videos ignore the pointer so the block can still be selected and dragged. */
function MediaView({ media, interactive }: { media: MediaFile; interactive: boolean }) {
  switch (media.kind) {
    case 'image':
      return <img src={media.url} alt={media.name} draggable={false} className="size-full object-contain" />
    case 'pdf':
      return <iframe src={media.url} title={media.name} className={cn('size-full bg-white', !interactive && 'pointer-events-none')} />
    case 'video':
      return <video src={media.url} controls={interactive} className={cn('size-full object-contain', !interactive && 'pointer-events-none')} />
    default: {
      const unhandled: never = media.kind
      return unhandled
    }
  }
}

export function MediaDropZone({ onAdd }: { onAdd: (media: MediaFile) => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<'drop' | 'url'>('drop')
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const accept = (result: MediaFile | string) => {
    if (typeof result === 'string') {
      setError(result)
      return
    }
    setError(null)
    onAdd(result)
  }
  const onDrop = (event: DragEvent) => {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files[0]
    if (file) accept(mediaFromFile(file))
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        'flex h-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-[var(--dash-border)] p-4 text-center',
        dragging && 'border-[var(--dash-fg)] bg-white/5',
      )}
    >
      <Image className="size-7 text-[var(--dash-muted)]" strokeWidth={1.5} aria-hidden />
      {mode === 'drop' ? (
        <p className="text-sm text-[var(--dash-fg)]">
          Drop a file here,{' '}
          <button type="button" onClick={() => setMode('url')} className={linkClass}>
            use a URL
          </button>
          , or{' '}
          <button type="button" onClick={() => fileRef.current?.click()} className={linkClass}>
            browse
          </button>
          .
        </p>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            accept(mediaFromUrl(url))
          }}
          className="flex w-full max-w-sm items-center gap-1.5"
        >
          <input
            type="url"
            aria-label="Media URL"
            autoFocus
            value={url}
            placeholder="https://"
            onChange={(event) => setUrl(event.target.value)}
            className="h-8 min-w-0 flex-1 rounded-md border border-[var(--dash-border)] bg-transparent px-2.5 text-sm text-[var(--dash-fg)] outline-none placeholder:text-[var(--dash-faint)] focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button type="submit" disabled={!url.trim()} className="h-8 cursor-pointer rounded-md bg-[var(--dash-fg)] px-3 text-xs font-medium text-[var(--dash-card)] disabled:cursor-default disabled:opacity-40">
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('drop')
              setError(null)
            }}
            className="h-8 cursor-pointer rounded-md px-2 text-xs text-[var(--dash-muted)] hover:text-[var(--dash-fg)]"
          >
            Cancel
          </button>
        </form>
      )}
      {error ? <p className="text-xs text-red-400">{error}</p> : <p className="text-xs text-[var(--dash-muted)]">{MEDIA_FORMATS}. Max 10 MB.</p>}
      <input
        ref={fileRef}
        type="file"
        accept={Object.keys(ACCEPTED_TYPES).join(',')}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) accept(mediaFromFile(file))
          event.target.value = ''
        }}
      />
    </div>
  )
}
