import { findObject } from '../../../data/dataSources'
import type { CanvasItem } from '../../../data/widgets'

/** Resolves an object-sourced item to its object and field; undefined when the mock catalog lacks either. */
export function resolveObjectItem(item: Extract<CanvasItem, { source: 'object' }>) {
  const object = findObject(item.objectName)
  const field = object?.fields.find((candidate) => candidate.key === item.fieldKey)
  return object && field ? { object, field } : undefined
}

/** Title shown on the widget: the user's override, else the source label; empty when the title is switched off. */
export function displayTitle(item: CanvasItem) {
  return item.showTitle === false ? '' : item.title?.trim() || itemLabel(item)
}

export function displaySubtitle(item: CanvasItem) {
  return item.showDescription ? item.description?.trim() || undefined : undefined
}

/** Default title for an item, from its data source. */
export function itemLabel(item: CanvasItem): string {
  switch (item.source) {
    case 'object': {
      const resolved = resolveObjectItem(item)
      return resolved ? `${resolved.object.label} by ${resolved.field.label}` : item.id
    }
    case 'sql':
      return item.title
    case 'media':
      return item.media?.name ?? 'Media'
    case 'text':
      return 'Text'
    default: {
      const unhandled: never = item
      return unhandled
    }
  }
}
