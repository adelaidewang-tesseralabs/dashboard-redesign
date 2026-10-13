import type { DataObject } from '../../../../data/dataSources'
import type { AddSourceKind } from '../sourceKinds'
import { UploadFileDialog } from '../UploadFileDialog'
import { WorkflowOutputDialog } from '../WorkflowOutputDialog'
import { AddFoundrySourceDialog, type FoundrySourceMode } from './AddFoundrySourceDialog'

export type AddDatasetRequest = { kind: AddSourceKind; foundryMode: FoundrySourceMode }

type AddDatasetDialogsProps = {
  request: AddDatasetRequest | null
  attached: Set<string>
  onClose: () => void
  onAddTables: (tables: DataObject[], name: string) => void
  onAddQuery: (name: string, sql: string) => void
}

/** Builder V3: the production source dialogs, one per entry in the "+ Add Data Source" menu. */
export function AddDatasetDialogs({ request, attached, onClose, onAddTables, onAddQuery }: AddDatasetDialogsProps) {
  return (
    <>
      {request?.kind === 'foundry' && (
        <AddFoundrySourceDialog initialMode={request.foundryMode} attached={attached} onClose={onClose} onAddTables={onAddTables} onAddQuery={onAddQuery} />
      )}
      <WorkflowOutputDialog open={request?.kind === 'workflow'} attached={attached} onClose={onClose} onAttach={onAddTables} />
      <UploadFileDialog open={request?.kind === 'upload'} onClose={onClose} onAttach={onAddTables} />
    </>
  )
}
