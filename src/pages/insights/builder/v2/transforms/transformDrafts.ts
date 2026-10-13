import { useState } from 'react'
import { EMPTY_TRANSFORMS, type DatasetTransforms } from '../../../../../data/transforms'

export type TransformDrafts = {
  /** Unapplied transform edits by dataset key; graphs keep reading the applied ones. */
  drafts: Record<string, DatasetTransforms>
  setDraft: (datasetKey: string, draft: DatasetTransforms | null) => void
  clear: () => void
}

export const sameTransforms = (a: DatasetTransforms | undefined, b: DatasetTransforms | undefined) =>
  JSON.stringify(a ?? EMPTY_TRANSFORMS) === JSON.stringify(b ?? EMPTY_TRANSFORMS)

/** Lives in the builder, above the Canvas and Data tabs, so switching tab or dataset keeps the drafts. */
export function useTransformDrafts(): TransformDrafts {
  const [drafts, setDrafts] = useState<Record<string, DatasetTransforms>>({})
  const setDraft = (datasetKey: string, draft: DatasetTransforms | null) =>
    setDrafts(({ [datasetKey]: _previous, ...rest }) => (draft ? { ...rest, [datasetKey]: draft } : rest))
  return { drafts, setDraft, clear: () => setDrafts({}) }
}
