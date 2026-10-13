import { DATA_OBJECTS } from '../../../data/dataSources'
import { DATA_CHECKS_TABLE, objectItem, sameSource, type CanvasItem, type ChartStyle } from '../../../data/widgets'
import { itemLabel } from './canvasItems'

/** Data Checks graphs the assistant offers when a prompt names no other source, in suggestion order. */
const CHECK_GRAPHS: { fieldKey: string; chart: ChartStyle; keywords: RegExp }[] = [
  { fieldKey: 'priority', chart: 'bar', keywords: /\b(priority|priorities|severity|critical)\b/i },
  { fieldKey: 'dimension', chart: 'bar', keywords: /\b(dimensions?|completeness|validity|accuracy|uniqueness|consistency|quality)\b/i },
  { fieldKey: 'status', chart: 'pie', keywords: /\b(status|fail\w*|pass\w*|runs?|executed|coverage|checks?)\b/i },
]

const checksGraph = ({ fieldKey, chart }: (typeof CHECK_GRAPHS)[number]): CanvasItem => ({ ...objectItem(DATA_CHECKS_TABLE, fieldKey), chart })

const listFormat = new Intl.ListFormat('en', { type: 'conjunction' })

export function describe(items: CanvasItem[]) {
  return listFormat.format(items.map((item) => itemLabel(item).toLowerCase()))
}

/**
 * Object charts need an explicit source: "work items by status", or an "@Work Items" mention
 * (which falls back to the object's first field). A bare "data checks" gets the Data Checks starter graphs.
 */
export function matchObjects(prompt: string): CanvasItem[] {
  const text = prompt.toLowerCase()
  return DATA_OBJECTS.flatMap((object) => {
    const name = object.label.toLowerCase()
    if (!text.includes(name)) return []
    const fields = object.fields.filter((field) => text.includes(`by ${field.label.toLowerCase()}`) || text.includes(`by ${field.key}`))
    if (fields.length) return fields.map((field) => objectItem(object.name, field.key))
    return text.includes(`@${name}`) ? [objectItem(object.name, object.fields[0].key)] : []
  })
}

/** Prototype stand-in for the assistant: maps a prompt to the widgets it should add, plus a reply. */
export function planWidgets(prompt: string, existing: CanvasItem[]): { items: CanvasItem[]; reply: string } {
  const isNew = (item: CanvasItem) => !existing.some((widget) => sameSource(widget, item))

  const objectItems = matchObjects(prompt)
  if (objectItems.length) {
    const added = objectItems.filter(isNew)
    if (!added.length) return { items: [], reply: `The dashboard already shows ${describe(objectItems)}.` }
    return { items: added, reply: `Added ${describe(added)}, counted from the live records. Drag a graph to rearrange it.` }
  }

  const matched = CHECK_GRAPHS.filter((graph) => graph.keywords.test(prompt)).map(checksGraph)
  const requested = matched.length ? matched : CHECK_GRAPHS.map(checksGraph)
  const added = requested.filter(isNew)
  const missing = CHECK_GRAPHS.map(checksGraph).filter((item) => isNew(item) && !added.some((add) => sameSource(add, item)))

  if (!added.length) {
    return {
      items: [],
      reply: `The dashboard already shows ${describe(requested)}.${missing.length ? ` I can also add ${describe(missing)}.` : ''}`,
    }
  }
  const next = missing.length ? ` Ask for ${describe(missing)} to go deeper.` : ''
  if (!matched.length) return { items: added, reply: `I started you with an overview from the Data Checks dataset: ${describe(added)}.${next}` }
  return { items: added, reply: `Added ${describe(added)}, from the Data Checks dataset.${next}` }
}
