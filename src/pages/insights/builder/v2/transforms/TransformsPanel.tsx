import type { SqlResult } from '../../../../../data/dataSources'
import { EMPTY_TRANSFORMS, applyTransforms, columnTypes, type DatasetTransforms } from '../../../../../data/transforms'
import { CalculationsEditor } from './CalculationsEditor'
import type { TransformColumn } from './controls'
import { FiltersEditor } from './FiltersEditor'
import { ResultShapeEditor } from './ResultShapeEditor'
import { TransformSection } from './TransformSection'

type TransformsPanelProps = {
  /** The dataset's untransformed query result. */
  source: SqlResult
  transforms: DatasetTransforms | undefined
  onChange: (transforms: DatasetTransforms) => void
  /** Builder V6 turns off new dataset row limits. */
  rowLimit?: boolean
}

function columnsOf(result: SqlResult): TransformColumn[] {
  if (!result.ok) return []
  const types = columnTypes(result)
  return result.columns.map((key) => ({ key, type: types.get(key) ?? 'text' }))
}

const plural = (count: number, one: string, many: string) => (count === 0 ? undefined : `${count} ${count === 1 ? one : many}`)

function shapeSummary({ shape }: DatasetTransforms) {
  const parts = [
    shape.groupBy.length > 0 && `grouped by ${shape.groupBy.join(', ')}`,
    shape.pivot && 'pivoted',
    shape.limit && `top ${shape.limit}`,
    shape.distinct && 'distinct',
  ].filter(Boolean)
  return parts.length ? parts.join(' · ') : undefined
}

/** Calculations, Filters and Result shape for one dataset; each step only offers the columns that exist at that point. */
export function TransformsPanel({ source, transforms = EMPTY_TRANSFORMS, onChange, rowLimit = true }: TransformsPanelProps) {
  if (!source.ok) return <p className="text-sm text-white/45">Fix the query to transform its result.</p>
  const { shape } = transforms
  const baseColumns = columnsOf(source)
  const calculated = columnsOf(applyTransforms(source, { ...EMPTY_TRANSFORMS, calculations: transforms.calculations }))
  const grouped = columnsOf(applyTransforms(source, { ...transforms, shape: { ...shape, pivot: undefined, orderBy: [], limit: undefined } }))
  const output = columnsOf(applyTransforms(source, { ...transforms, shape: { ...shape, orderBy: [], limit: undefined } }))

  return (
    <div className="flex max-w-5xl flex-col gap-3">
      <TransformSection
        title="Calculations"
        description="Derived columns computed from the dataset's columns"
        summary={plural(transforms.calculations.length, 'calculation', 'calculations')}
        accentClass="border-l-tlai-mint"
      >
        <CalculationsEditor
          calculations={transforms.calculations}
          columns={baseColumns}
          onChange={(calculations) => onChange({ ...transforms, calculations })}
        />
      </TransformSection>
      <TransformSection
        title="Filters"
        description="Row conditions applied before aggregation"
        summary={plural(transforms.filters.length, 'filter', 'filters')}
        accentClass="border-l-sky-300"
      >
        <FiltersEditor filters={transforms.filters} columns={calculated} onChange={(filters) => onChange({ ...transforms, filters })} />
      </TransformSection>
      <TransformSection
        title="Result shape"
        description={rowLimit ? 'Grouping, ordering, and row limits' : 'Grouping and ordering'}
        summary={shapeSummary(transforms)}
        accentClass="border-l-violet-300"
      >
        <ResultShapeEditor
          shape={shape}
          columns={calculated}
          groupedColumns={grouped}
          outputColumns={output}
          onChange={(next) => onChange({ ...transforms, shape: next })}
          rowLimit={rowLimit}
        />
      </TransformSection>
    </div>
  )
}
