import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import type { DataObject } from '../../../data/dataSources'
import { WORKFLOWS } from '../../../data/externalSources'
import { formatDateTime } from '../../../lib/format'
import { Button } from '../../../ui/Button'
import { Dialog } from '../../../ui/Dialog'
import { Select } from '../../../ui/Select'
import { EditorCheckbox, editorInputClass } from './EditorFields'
import { SourceIcon } from './sourceKinds'

type WorkflowOutputDialogProps = {
  open: boolean
  attached: Set<string>
  onClose: () => void
  onAttach: (tables: DataObject[], name: string) => void
}

const NO_WORKFLOW = ''

/** Main app's "Attach Workflow Output": pick output files from a workflow's newest completed run. */
export function WorkflowOutputDialog({ open, attached, onClose, onAttach }: WorkflowOutputDialogProps) {
  const [name, setName] = useState('')
  const [workflowId, setWorkflowId] = useState(NO_WORKFLOW)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!open) return
    setName('')
    setWorkflowId(NO_WORKFLOW)
    setSelected(new Set())
  }, [open])

  const workflow = WORKFLOWS.find((candidate) => candidate.id === workflowId)
  const toggle = (output: string, checked: boolean) =>
    setSelected((current) => {
      const next = new Set(current)
      if (checked) next.add(output)
      else next.delete(output)
      return next
    })
  const submit = () => onAttach(workflow?.outputs.filter((output) => selected.has(output.name)) ?? [], name.trim())

  return (
    <Dialog
      open={open}
      onClose={onClose}
      icon={<SourceIcon origin="workflow" size="lg" />}
      title="Attach Workflow Output"
      description="Pick one or more output files — graphs follow the newest completed run's data"
      footer={
        <>
          <span className="mr-auto self-center text-xs text-white/50">
            {selected.size ? `${selected.size} file${selected.size === 1 ? '' : 's'} selected` : 'Pick output files above'}
          </span>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={selected.size === 0} onClick={submit}>
            <Plus className="size-4" />
            Add Source
          </Button>
        </>
      }
    >
      <div className="flex min-h-72 flex-col gap-3 text-sm">
        <label className="flex flex-col gap-1.5 text-white/80">
          Data source name
          <input
            value={name}
            disabled={selected.size > 1}
            placeholder={selected.size > 1 ? 'Each file keeps its node/filename' : 'Defaults to node/filename'}
            onChange={(event) => setName(event.target.value)}
            className={`${editorInputClass} disabled:opacity-60`}
          />
        </label>
        <Select
          aria-label="Workflow"
          size="form"
          value={workflowId}
          placeholder="Select a workflow…"
          options={WORKFLOWS.map((candidate) => ({ value: candidate.id, label: candidate.name, description: `Last run ${formatDateTime(candidate.lastRun)}` }))}
          onChange={(value) => {
            setWorkflowId(value)
            setSelected(new Set())
          }}
        />
        {workflow ? (
          <div className="flex flex-col gap-2 rounded-lg border border-white/10 p-3">
            <span className="text-xs text-white/50">Latest completed run · {formatDateTime(workflow.lastRun)}</span>
            {workflow.outputs.map((output) =>
              attached.has(output.name) ? (
                <span key={output.name} className="font-mono text-xs text-white/40">
                  {output.label} · already a source
                </span>
              ) : (
                <div key={output.name} className="font-mono">
                  <EditorCheckbox label={output.label} checked={selected.has(output.name)} onChange={(checked) => toggle(output.name, checked)} />
                </div>
              ),
            )}
          </div>
        ) : (
          <p className="py-4 text-white/45">Select a workflow to list its latest run's outputs</p>
        )}
        <p className="mt-auto text-xs text-white/40">Graphs read the newest completed run's output — they update automatically on every new run.</p>
      </div>
    </Dialog>
  )
}
