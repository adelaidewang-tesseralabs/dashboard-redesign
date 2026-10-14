import { Lock } from 'lucide-react'
import type { PresetOperator } from '../../../../data/dashboards'
import { EditorCheckbox } from '../EditorFields'
import { PRESET_OPERATOR_LABELS } from '../dashboardFilters'
import { narrowValues, viewerCanNarrow } from './narrowPresets'
import { operatorsFor, type PresetField } from './presetFields'
import { BooleanEditor, DateEditor, OptionsEditor, SegmentedChoice, ValueInput } from './PresetValueEditors'

type FieldValuePanelProps = {
  field: PresetField
  /** Editors: the preset. Viewers: their own pick, empty while they're on the preset. */
  values: string[]
  /** Viewers only: the editors' preset, which their pick can narrow but not widen. */
  preset?: string[]
  operator: PresetOperator
  /** Viewers can't change a locked filter. */
  locked: boolean
  onValuesChange: (values: string[]) => void
  /** Editors only: the operator is part of the preset. */
  onOperatorChange?: (operator: PresetOperator) => void
  allPages: boolean
  /** Editors only, once the field has a value: show the filter on every page, or only the open one. */
  onAllPagesChange?: (allPages: boolean) => void
  datasetLabel: string
}

function presetBounds(operator: PresetOperator, preset: string[]) {
  const [first, second = first] = preset
  switch (operator) {
    case 'gt':
    case 'gte':
      return { min: first, hint: `At least ${first}` }
    case 'lt':
    case 'lte':
      return { max: first, hint: `At most ${first}` }
    case 'between':
      return { min: first, max: second, hint: `From ${first} to ${second}` }
    default:
      return {}
  }
}

/** Right side of the filter builder: the editor for the selected field's type, as in the main app's FilterValuePanel. */
export function FieldValuePanel({ field, values, preset, operator, locked, onValuesChange, onOperatorChange, allPages, onAllPagesChange, datasetLabel }: FieldValuePanelProps) {
  const operators = operatorsFor(field.type)
  const narrowing = preset !== undefined && preset.length > 0
  const readOnly = locked || (narrowing && !viewerCanNarrow(operator, preset))
  const listValued = field.type === 'select' || field.type === 'user'
  // Lists show what applies; single values show the raw pick so typing isn't clamped mid-keystroke.
  const shown = !narrowing ? values : listValued ? narrowValues(operator, preset, values) : values.length ? values : preset
  const bounds = narrowing && !readOnly ? presetBounds(operator, preset) : {}
  const editor = { label: field.label, values: shown, readOnly, onChange: onValuesChange }
  const options = narrowing ? preset : field.options
  const snapToPreset = () => {
    if (!narrowing || readOnly || values.length === 0) return
    const applied = narrowValues(operator, preset, values)
    if (applied.join() !== values.join()) onValuesChange(applied)
  }

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
      {bounds.hint && <p className="text-xs text-white/50">{bounds.hint}</p>}
      {onOperatorChange && values.length > 0 && (
        <p className="text-xs text-white/50">{viewerCanNarrow(operator, values) ? 'Viewers can narrow this, not widen it.' : "Viewers can't change this."}</p>
      )}
      <div className="contents" onBlur={snapToPreset}>
        <FieldEditor field={field} editor={editor} options={options} keepOne={narrowing} min={bounds.min} max={bounds.max} />
      </div>
      <div className="mt-auto flex flex-col gap-3">
        {!readOnly && (
          <button
            type="button"
            disabled={values.length === 0}
            onClick={() => onValuesChange([])}
            className="h-7 cursor-pointer self-start rounded-md px-2 text-xs text-white/80 hover:bg-white/10 hover:text-white disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent"
          >
            {narrowing ? 'Reset to preset' : 'Clear'}
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

type FieldEditorProps = {
  field: PresetField
  editor: { label: string; values: string[]; readOnly: boolean; onChange: (values: string[]) => void }
  options: string[]
  keepOne: boolean
  min?: string
  max?: string
}

function FieldEditor({ field, editor, options, keepOne, min, max }: FieldEditorProps) {
  switch (field.type) {
    case 'select':
      return <OptionsEditor {...editor} options={options} keepOne={keepOne} />
    case 'user':
      return <OptionsEditor {...editor} options={options} keepOne={keepOne} users />
    case 'text':
      return <ValueInput {...editor} />
    case 'number':
      return <ValueInput {...editor} numeric min={min} max={max} />
    case 'date':
      return <DateEditor {...editor} min={min} max={max} />
    case 'boolean':
      return <BooleanEditor {...editor} />
    default: {
      const unhandled: never = field.type
      return unhandled
    }
  }
}
