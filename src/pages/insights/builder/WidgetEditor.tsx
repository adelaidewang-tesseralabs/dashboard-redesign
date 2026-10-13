import type { ReactNode } from 'react'
import { Database, FileText, Image, Minus, Plus, Table2, Video, X } from 'lucide-react'
import { DATA_OBJECTS, findObject, type DataObject } from '../../../data/dataSources'
import { isChartStyle, showsLegend, usesColor, usesLegend, usesSingleColor, type CanvasItem, type GraphItem, type MediaKind } from '../../../data/widgets'
import { cn } from '../../../lib/cn'
import { CHART_COLOR_IDS, CHART_PALETTE_IDS, CHART_PALETTES, CHART_SINGLE_COLORS, isChartColor, isChartPalette, resolvePalette, type ChartPalette } from '../../../lib/colors'
import { Button } from '../../../ui/Button'
import { Select } from '../../../ui/Select'
import { displayTitle, itemLabel } from './canvasItems'
import { CHART_STYLE_OPTIONS } from './chartStyles'
import { EditorCheckbox, EditorSection, editorInputClass, IconAction } from './EditorFields'
import { PanelResizeHandle } from './PanelResizeHandle'
import { ORIGIN_META } from './sourceKinds'
import { TextBoxSection } from './TextBoxSection'
import type { SidePanelResize } from './useSidePanelWidth'

const MEDIA_ICONS: Record<MediaKind, typeof Image> = { image: Image, pdf: FileText, video: Video }

type WidgetEditorProps = {
  item: CanvasItem
  /** Lake tables attached to the dashboard — the Object options for graphs built from them. */
  sources: DataObject[]
  onChange: (item: CanvasItem) => void
  onClose: () => void
  /** Replaces the default Data, Filters and Value sections (builder V2 picks a dataset and queries it). */
  dataSection?: ReactNode
  /** Makes the panel resizable at a width shared with the chat panel. */
  resize?: SidePanelResize
  /** Rendered in the header before the close button. */
  headerExtra?: ReactNode
  /** Fill a parent column instead of being a standalone aside. */
  embedded?: boolean
  /** `columns` flows the sections into side-by-side columns for a wide, short panel (builder V4's bottom panel). */
  layout?: 'stack' | 'columns'
}

/** Settings for the selected canvas widget, modeled on the Databricks dashboard widget panel. */
export function WidgetEditor({ item, sources, onChange, onClose, dataSection, resize, headerExtra, embedded = false, layout = 'stack' }: WidgetEditorProps) {
  const Root = embedded ? 'div' : 'aside'
  return (
    <Root
      aria-label="Widget settings"
      style={!embedded && resize ? { width: resize.width } : undefined}
      className={cn(
        'relative flex flex-col bg-tlai-1 text-sm',
        embedded ? 'min-h-0 flex-1' : 'shrink-0 border-l border-white/10',
        !embedded && !resize && 'w-80',
      )}
    >
      {!embedded && resize && <PanelResizeHandle resize={resize} />}
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-white/10 px-4">
        <span className="min-w-0 flex-1 truncate font-medium text-white">{displayTitle(item) || itemLabel(item)}</span>
        {headerExtra}
        <IconAction Icon={X} label="Close widget settings" onClick={onClose} />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* Columns sit inside the scroller: with a fixed height they would overflow sideways instead of wrapping. */}
        <div className={cn(layout === 'columns' && 'columns-3xs gap-0 *:break-inside-avoid [column-rule:1px_solid_rgb(255_255_255/0.1)]')}>
          <PresentationSection item={item} onChange={onChange} />
          {item.source === 'media' ? (
            <MediaSection item={item} onChange={onChange} />
          ) : item.source === 'text' ? (
            <TextBoxSection item={item} onChange={onChange} />
          ) : (
            <GraphSections item={item} sources={sources} onChange={onChange} dataSection={dataSection} />
          )}
        </div>
      </div>
    </Root>
  )
}

type SectionProps<T extends CanvasItem = CanvasItem> = { item: T; onChange: (item: CanvasItem) => void }

function PresentationSection({ item, onChange }: SectionProps) {
  const showTitle = item.showTitle !== false
  return (
    <EditorSection title="Widget">
      <div className="flex items-center gap-5">
        <EditorCheckbox label="Title" checked={showTitle} onChange={(checked) => onChange({ ...item, showTitle: checked })} />
        <EditorCheckbox label="Description" checked={!!item.showDescription} onChange={(checked) => onChange({ ...item, showDescription: checked })} />
      </div>
      {showTitle && (
        <input
          aria-label="Widget title"
          value={item.title ?? ''}
          placeholder={itemLabel(item)}
          onChange={(event) => onChange({ ...item, title: event.target.value })}
          className={editorInputClass}
        />
      )}
      {item.showDescription && (
        <textarea
          aria-label="Widget description"
          rows={2}
          value={item.description ?? ''}
          placeholder="Add a description"
          onChange={(event) => onChange({ ...item, description: event.target.value })}
          className={`${editorInputClass} resize-none`}
        />
      )}
    </EditorSection>
  )
}

type GraphSectionsProps = SectionProps<GraphItem> & { sources: DataObject[]; dataSection?: ReactNode }

function GraphSections({ item, sources, onChange, dataSection }: GraphSectionsProps) {
  return (
    <>
      <EditorSection title="Visualization">
        <Select aria-label="Visualization" value={item.chart} options={CHART_STYLE_OPTIONS} onChange={(chart) => isChartStyle(chart) && onChange({ ...item, chart })} />
        {usesSingleColor(item.chart) ? (
          <>
            <span className="text-xs text-white/50">Color</span>
            <Select
              aria-label="Color"
              value={item.color ?? AUTO_COLOR}
              options={SINGLE_COLOR_OPTIONS}
              onChange={(color) => onChange({ ...item, color: isChartColor(color) ? color : undefined })}
            />
          </>
        ) : (
          usesColor(item.chart) && (
            <>
              <span className="text-xs text-white/50">Colors</span>
              <Select
                aria-label="Colors"
                value={resolvePalette(item.palette)}
                options={CHART_PALETTE_IDS.map((id) => ({ value: id, label: CHART_PALETTES[id].label, icon: <PaletteSwatch palette={id} /> }))}
                onChange={(palette) => isChartPalette(palette) && onChange({ ...item, palette })}
              />
            </>
          )
        )}
        {usesLegend(item.chart) && <EditorCheckbox label="Legend" checked={showsLegend(item)} onChange={(legend) => onChange({ ...item, legend })} />}
      </EditorSection>
      {dataSection ?? (
        <>
          <DataSection item={item} sources={sources} onChange={onChange} />
          {item.source === 'object' && <FiltersSection item={item} onChange={onChange} />}
          <EditorSection title="Value">
            <span className="w-fit rounded-md bg-white/5 px-2.5 py-1.5 font-mono text-xs text-white/85">COUNT(*)</span>
          </EditorSection>
        </>
      )}
    </>
  )
}

const AUTO_COLOR = 'auto'

/** Auto keeps the dashboard's assigned color, which no unrelated graph shares. */
const SINGLE_COLOR_OPTIONS = [
  { value: AUTO_COLOR, label: 'Auto', icon: <span aria-hidden className="size-3.5 rounded-full border border-dashed border-white/40" /> },
  ...CHART_COLOR_IDS.map((id) => ({
    value: id,
    label: CHART_SINGLE_COLORS[id].label,
    icon: <span aria-hidden style={{ background: CHART_SINGLE_COLORS[id].color }} className="size-3.5 rounded-full" />,
  })),
]

function PaletteSwatch({ palette }: { palette: ChartPalette }) {
  return (
    <span aria-hidden className="grid size-3.5 grid-cols-2 gap-px">
      {CHART_PALETTES[palette].colors.slice(0, 4).map((color) => (
        <span key={color} style={{ background: color }} className="rounded-[1px]" />
      ))}
    </span>
  )
}

/** Replacing clears the file, so the block shows its drop zone on the canvas again. */
function MediaSection({ item, onChange }: SectionProps<Extract<CanvasItem, { source: 'media' }>>) {
  const { media } = item
  return (
    <EditorSection title="Media">
      {media ? (
        <>
          <SourceLabel Icon={MEDIA_ICONS[media.kind]} label={media.name} />
          <Button variant="outline" size="sm" className="w-fit" onClick={() => onChange({ ...item, media: undefined })}>
            Replace file
          </Button>
        </>
      ) : (
        <p className="text-xs text-white/45">Drop a file on the block, paste a URL, or browse for one.</p>
      )}
    </EditorSection>
  )
}

function DataSection({ item, sources, onChange }: SectionProps<GraphItem> & { sources: DataObject[] }) {
  switch (item.source) {
    case 'object': {
      const object = findObject(item.objectName)
      const origin = object?.origin ?? 'mosaic'
      const { Icon, label } = ORIGIN_META[origin]
      return (
        <EditorSection title="Data">
          <SourceLabel Icon={Icon} label={origin === 'mosaic' ? label : `${label} · ${item.objectName}`} />
          <Select
            aria-label="Object"
            value={item.objectName}
            options={(origin === 'mosaic' ? DATA_OBJECTS : sources).map((candidate) => ({ value: candidate.name, label: candidate.label }))}
            onChange={(objectName) => {
              const next = findObject(objectName)
              if (next) onChange({ ...item, objectName, fieldKey: next.fields[0].key, filters: [] })
            }}
          />
          <span className="text-xs text-white/50">Group by</span>
          <Select
            aria-label="Group by"
            value={item.fieldKey}
            options={(object?.fields ?? []).map((field) => ({ value: field.key, label: field.label }))}
            onChange={(fieldKey) => onChange({ ...item, fieldKey })}
          />
        </EditorSection>
      )
    }
    case 'sql':
      return (
        <EditorSection title="Data">
          <SourceLabel Icon={Database} label="SQL query" />
          <div className="font-mono text-xs leading-5">
            <textarea
              aria-label="SQL query"
              rows={5}
              spellCheck={false}
              value={item.sql}
              onChange={(event) => onChange({ ...item, sql: event.target.value })}
              className={`${editorInputClass} resize-y`}
            />
          </div>
        </EditorSection>
      )
    default: {
      const unhandled: never = item
      return unhandled
    }
  }
}

function SourceLabel({ Icon, label }: { Icon: typeof Table2; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-white/60">
      <Icon className="size-3.5" />
      {label}
    </span>
  )
}

function FiltersSection({ item, onChange }: SectionProps<Extract<CanvasItem, { source: 'object' }>>) {
  const object = findObject(item.objectName)
  const filters = item.filters ?? []
  if (!object) return null

  const addFilter = () => {
    const field = object.fields[0]
    onChange({ ...item, filters: [...filters, { fieldKey: field.key, value: field.values[0] }] })
  }
  const setFilter = (index: number, fieldKey: string, value?: string) => {
    const field = object.fields.find((candidate) => candidate.key === fieldKey) ?? object.fields[0]
    const next = filters.map((filter, i) => (i === index ? { fieldKey: field.key, value: value ?? field.values[0] } : filter))
    onChange({ ...item, filters: next })
  }

  return (
    <EditorSection title="Filters" action={<IconAction Icon={Plus} label="Add filter" onClick={addFilter} />}>
      {filters.length === 0 && <p className="text-xs text-white/45">No filters — every {object.label.toLowerCase()} record is counted.</p>}
      {filters.map((filter, index) => {
        const field = object.fields.find((candidate) => candidate.key === filter.fieldKey)
        return (
          <div key={`${filter.fieldKey}-${index}`} className="flex items-center gap-1.5">
            <div className="min-w-0 flex-1">
              <Select
                aria-label="Filter field"
                value={filter.fieldKey}
                options={object.fields.map((candidate) => ({ value: candidate.key, label: candidate.label }))}
                onChange={(fieldKey) => setFilter(index, fieldKey)}
              />
            </div>
            <div className="min-w-0 flex-1">
              <Select
                aria-label="Filter value"
                value={filter.value}
                options={(field?.values ?? []).map((value) => ({ value, label: value }))}
                onChange={(value) => setFilter(index, filter.fieldKey, value)}
              />
            </div>
            <IconAction Icon={Minus} label="Remove filter" onClick={() => onChange({ ...item, filters: filters.filter((_, i) => i !== index) })} />
          </div>
        )
      })}
    </EditorSection>
  )
}
