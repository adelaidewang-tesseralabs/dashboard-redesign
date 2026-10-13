import { useEffect, useState } from 'react'
import { ChevronRight, FileText, Upload, X } from 'lucide-react'
import type { DataObject } from '../../../data/dataSources'
import { UPLOAD_DESTINATION, uploadTable } from '../../../data/externalSources'
import { cn } from '../../../lib/cn'
import { Button } from '../../../ui/Button'
import { Dialog } from '../../../ui/Dialog'
import { editorInputClass } from './EditorFields'
import { SourceIcon } from './sourceKinds'

type UploadFileDialogProps = {
  open: boolean
  onClose: () => void
  onAttach: (tables: DataObject[], name: string) => void
}

const ACCEPT = '.csv,.tsv,.json,.jsonl,.parquet,.xlsx,.xlsm'

/** Main app's "Upload Data Files": each file lands as a lake table and becomes a Foundry source. */
export function UploadFileDialog({ open, onClose, onAttach }: UploadFileDialogProps) {
  const [files, setFiles] = useState<File[]>([])
  const [dragging, setDragging] = useState(false)
  const [showDestination, setShowDestination] = useState(false)
  const [destination, setDestination] = useState(UPLOAD_DESTINATION)

  useEffect(() => {
    if (!open) return
    setFiles([])
    setShowDestination(false)
    setDestination(UPLOAD_DESTINATION)
  }, [open])

  const addFiles = (list: FileList | null) => setFiles((current) => [...current, ...Array.from(list ?? [])])
  const upload = () => onAttach(files.map((file) => uploadTable(file.name, destination.trim() || UPLOAD_DESTINATION)), '')

  return (
    <Dialog
      open={open}
      onClose={onClose}
      icon={<SourceIcon origin="upload" size="lg" />}
      title="Upload Data Files"
      description="Each file lands as a lake table and becomes a Foundry source on this dashboard"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={files.length === 0} onClick={upload}>
            <Upload className="size-4" />
            Upload
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3 text-sm">
        <span className="font-medium text-white">Data files</span>
        <label
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragging(false)
            addFiles(event.dataTransfer.files)
          }}
          className={cn(
            'flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-white/20 px-4 py-4 hover:border-white/35 hover:bg-white/5',
            dragging && 'border-sky-300/60 bg-sky-500/5',
          )}
        >
          <Upload className="size-5 text-white/60" />
          <span className="flex flex-col">
            <span className="text-white">Click or drag file to upload</span>
            <span className="text-xs text-white/45">Accepts: CSV, TSV, JSON, JSONL, Parquet, XLSX, XLSM</span>
          </span>
          <input type="file" multiple accept={ACCEPT} className="sr-only" onChange={(event) => addFiles(event.target.files)} />
        </label>
        {files.map((file, index) => (
          <div key={`${file.name}-${index}`} className="flex items-center gap-2 rounded-md bg-white/5 px-3 py-1.5">
            <FileText className="size-4 text-white/50" />
            <span className="min-w-0 flex-1 truncate text-white/85">{file.name}</span>
            <button
              type="button"
              aria-label={`Remove ${file.name}`}
              onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
              className="cursor-pointer rounded p-0.5 text-white/50 hover:bg-white/10 hover:text-white"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          aria-expanded={showDestination}
          onClick={() => setShowDestination((current) => !current)}
          className="flex w-fit cursor-pointer items-center gap-1 rounded-full border border-white/15 px-2 py-0.5 text-xs text-white/70 hover:bg-white/5"
        >
          <ChevronRight className={cn('size-3 transition-transform', showDestination && 'rotate-90')} />
          Destination <span className="text-white/40">(defaults to {UPLOAD_DESTINATION})</span>
        </button>
        {showDestination && (
          <div className="font-mono">
            <input aria-label="Destination schema" value={destination} onChange={(event) => setDestination(event.target.value)} className={editorInputClass} />
          </div>
        )}
      </div>
    </Dialog>
  )
}
