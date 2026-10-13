import { createContext, useContext } from 'react'

/** Owners and editors only: where a graph's "View lineage" and "View dataset" lead. */
export type WidgetNavigation = {
  onViewLineage?: (itemId: string) => void
  onOpenDataset?: (datasetKey: string, fromItemId: string) => void
}

export const WidgetNavigationContext = createContext<WidgetNavigation>({})

export const useWidgetNavigation = () => useContext(WidgetNavigationContext)
