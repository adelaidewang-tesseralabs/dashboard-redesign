import { createContext, useContext } from 'react'

/** The teammate an editor is previewing the dashboard as; graphs load with their permissions. Unset means the editor. */
export const PreviewPersonContext = createContext<string | undefined>(undefined)

export const usePreviewPerson = () => useContext(PreviewPersonContext)
