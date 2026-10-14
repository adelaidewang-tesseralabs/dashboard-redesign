export type SelectAllState = 'all' | 'some' | 'none'

/** How many of the listed options are ticked; `shown` is what the search left visible. */
export function selectAllState(values: string[], shown: string[]): SelectAllState {
  const ticked = shown.filter((option) => values.includes(option)).length
  if (shown.length > 0 && ticked === shown.length) return 'all'
  return ticked > 0 ? 'some' : 'none'
}

/** Ticks every listed option, or unticks them all when they already are. Options hidden by the search are kept as they were. */
export function toggleAll(values: string[], shown: string[]): string[] {
  if (selectAllState(values, shown) === 'all') return values.filter((value) => !shown.includes(value))
  return [...values, ...shown.filter((option) => !values.includes(option))]
}

/** "Select all", or how many results it covers while a search narrows the list. */
export const selectAllLabel = (searching: boolean, count: number) => (searching ? `Select all ${count} ${count === 1 ? 'result' : 'results'}` : 'Select all')
