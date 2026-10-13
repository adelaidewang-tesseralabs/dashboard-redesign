import { createContext, useContext } from 'react'

/** The one graph filling the canvas, and the element over the canvas it renders into. */
export type CanvasFullScreen = {
  itemId: string | null
  setItemId: (itemId: string | null) => void
  host: HTMLElement | null
  /** Clicking the full-screen graph selects it, so its settings and Tessera AI open beside it. */
  onSelect?: (itemId: string) => void
}

export const FullScreenContext = createContext<CanvasFullScreen>({ itemId: null, setItemId: () => {}, host: null })

export const useCanvasFullScreen = () => useContext(FullScreenContext)
