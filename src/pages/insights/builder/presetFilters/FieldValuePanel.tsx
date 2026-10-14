import { Lock } from 'lucide-react'
import type { PresetOperator } from '../../../../data/dashboards'
import { EditorCheckbox } from '../EditorFields'
import { PRESET_OPERATOR_LABELS } from '../dashboardFilters'
import { operatorsFor, type PresetField } from './presetFields'
import { BooleanEditor, DateEditor, OptionsEditor, SegmentedChoice, ValueInput } from './PresetValueEditors'

type FieldValuePanelProps = {
  field: PresetField
  values: string[]
  operator: PresetOperator
  /** Viewers can't change a locked filter. */
  readOnly: boolean
  onValuesChange: (values: string[]) => void
  /** Editors only: the operator is part of the preset. */
  onOperatorChange?: (operator: PresetOperator) => void
  allPages: boolean
  /** Editors only, once the field has a value: show the filter on every page, or only the open one. */
  onAllPagesChange?: (allPages: boolean) => void
  datasetLabel: string
}

/** Right side of the filter builder: the editor for the selected field's type, as in the main app's FilterValuePanel. */
export function FieldValuePanel({ field, values, operator, readOnly, onValuesChange, onOperatorChange, allPages, onAllPagesChange, datasetLabel }: FieldValuePanelProps) {
  const operators = operatorsFor(field.type)
  const editor = { label: field.label, values, readOnly, onChange: onValuesChange }

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-3 text-left">
      <span className="truncate text-sm font-medium text-white">{field.label}</span>
      {operators.length > 1 &&
        (onOperatorChange ? (
          <SegmentedChoice
            label={`${field.label} operator`}
            options={operators.map((value) => ({ value, label: PRESET_OPERATOR_LABELS[value] }))}
            value={operator}
            onChange={onOperatorChange}
          />
        ) : (
          <p className="text-xs text-white/55">{PRESET_OPERATOR_LABELS[operator]}</p>
        ))}
      {readOnly && (
        <p className="flex items-center gap-1.5 text-xs text-white/50">
          <Lock className="size-3" aria-hidden />
          Set by the dashboard's editors
        </p>
      )}
      <FieldEditor field={field} editor={editor} />
      <div className="mt-auto flex flex-col gap-3">
        {!readOnly && (
          <button
            type="button"
            disabled={values.length === 0}
            onClick={() => onValuesChange([])}
            className="h-7 cursor-pointer self-start rounded-md px-2 text-xs text-white/80 hover:bg-white/10 hover:text-white disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent"
          >
            Clear
          </button>
        )}
        {onAllPagesChange && (
          <div className="flex flex-col gap-1 border-t border-white/10 pt-3">
            <EditorCheckbox label="Apply to all pages" checked={allPages} onChange={onAllPagesChange} />
            {allPages && <p className="pl-6 text-[11px] text-white/45">Applies to {datasetLabel} graphs on every page.</p>}
          </div>
        )}
      </div>
    </div>
  )
}

type FieldEditorProps = { field: PresetField; editor: { label: string; values: string[]; readOnly: boolean; onChange: (values: string[]) => void } }

function FieldEditor({ field, editor }: FieldEditorProps) {
  switch (field.type) {
    case 'select':
      return <OptionsEditor {...editor} options={field.options} />
    case 'user':
      return <OptionsEditor {...editor} options={field.options} users />
    case 'text':
      return <ValueInput {...editor} />
    case 'number':
      return <ValueInput {...editor} numeric />
    case 'date':
      return <DateEditor {...editor} />
    case 'boolean':
      return <BooleanEditor {...editor} />
    default: {
      const unhandled: never = field.type
      return unhandled
    }
  }
}
