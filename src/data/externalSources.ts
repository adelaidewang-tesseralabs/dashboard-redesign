import type { DataField, DataObject } from './dataSources'

/** Mock Data Foundry catalog, workflow outputs and uploads — the non-Mosaic sources a dashboard can attach. */

export type FoundrySchema = { name: string; tables: DataObject[] }
export type FoundryCatalog = { name: string; schemas: FoundrySchema[] }
export type Workflow = { id: string; name: string; lastRun: string; outputs: DataObject[] }

export const UPLOAD_DESTINATION = 'tsra.uploads'

const FIELD_TEMPLATES: DataField[][] = [
  [
    { key: 'check_status', label: 'Check status', values: ['Passed', 'Failed', 'Warning'] },
    { key: 'source_system', label: 'Source system', values: ['ECC', 'S/4HANA', 'Ariba'] },
  ],
  [
    { key: 'country', label: 'Country', values: ['US', 'DE', 'IN', 'BR', 'JP'] },
    { key: 'record_type', label: 'Record type', values: ['Vendor', 'Customer', 'Material'] },
  ],
  [
    { key: 'match_result', label: 'Match result', values: ['Exact', 'Fuzzy', 'No match'] },
    { key: 'confidence', label: 'Confidence', values: ['High', 'Medium', 'Low'] },
  ],
]

function hash(seed: string) {
  let value = 7
  for (const char of seed) value = (value * 31 + char.charCodeAt(0)) % 99991
  return value
}

function table(path: string, label: string, origin: DataObject['origin']): DataObject {
  const seed = hash(path)
  return { name: path, label, origin, total: 500 + (seed % 9500), fields: FIELD_TEMPLATES[seed % FIELD_TEMPLATES.length] }
}

function schema(catalog: string, name: string, tableNames: string[]): FoundrySchema {
  return { name, tables: tableNames.map((tableName) => table(`${catalog}.${name}.${tableName}`, tableName, 'foundry')) }
}

export const FOUNDRY_CATALOG: FoundryCatalog[] = [
  { name: 'cvi_dt', schemas: [schema('cvi_dt', 'vendor_core', ['lfa1_clean', 'lfb1_clean', 'vendor_dedup'])] },
  {
    name: 'dh',
    schemas: [
      schema('dh', 'dash_07155269', ['dc_7a1e2f04_batch_51c0aa12', 'dc_93bd0c6e_batch_51c0aa12']),
      schema('dh', 'dash_07801955', [
        'dc_1d0b9213_batch_324279e0',
        'dc_202071ae_batch_324279e0',
        'dc_2992a37c_batch_324279e0',
        'dc_2e5a5462_batch_324279e0',
        'dc_3d03b33a_batch_324279e0',
      ]),
    ],
  },
  { name: 'sap_ecc', schemas: [schema('sap_ecc', 'master_data', ['but000', 'kna1', 'mara'])] },
]

function workflow(id: string, name: string, lastRun: string, files: string[]): Workflow {
  return { id, name, lastRun, outputs: files.map((file) => table(`wf.${id}.${file.replace(/\W+/g, '_')}`, file, 'workflow')) }
}

export const WORKFLOWS: Workflow[] = [
  workflow('vendor_harmonization', 'Vendor harmonization', '2026-10-08T08:12:00-07:00', [
    'merge_vendors/golden_records.parquet',
    'merge_vendors/duplicates.csv',
    'validate/exceptions.csv',
  ]),
  workflow('bp_migration_load', 'BP migration load', '2026-10-07T22:40:00-07:00', ['transform/bp_staging.parquet', 'load/load_errors.csv']),
  workflow('gl_reconciliation', 'GL reconciliation', '2026-10-06T18:05:00-07:00', ['reconcile/unmatched_entries.csv']),
]

/** One run of a workflow, at the workflow version it ran. */
export type WorkflowRun = { id: string; version: number; ranAt: string; author: string }

const RUN_GAP_HOURS = [0, 26, 75, 170]
const RUN_AUTHORS = ['olivier@tessera.ai', 'sophie@tessera.ai', 'olivier@tessera.ai', 'mehdi@tessera.ai']

/** Newest first: the latest run, then a few older ones, each on an older workflow version. */
export function workflowRuns(workflow: Workflow): WorkflowRun[] {
  return RUN_GAP_HOURS.map((hours, index) => ({
    id: `${workflow.id}-run-${RUN_GAP_HOURS.length - index}`,
    version: RUN_GAP_HOURS.length - index + 1,
    ranAt: new Date(Date.parse(workflow.lastRun) - hours * 36e5).toISOString(),
    author: RUN_AUTHORS[index],
  }))
}

/** Where the workflow lives in the main app, opened from the run picker. */
export const workflowUrl = (workflow: Workflow) => `http://localhost:3000/t/staging/workflows/${workflow.id}`

const uploads: DataObject[] = []

/** Lands an uploaded file as a lake table under `destination` and returns it. */
export function uploadTable(fileName: string, destination = UPLOAD_DESTINATION) {
  const base = fileName.replace(/\.[^.]+$/, '').toLowerCase().replace(/\W+/g, '_') || 'upload'
  const uploaded = table(`${destination}.${base}`, base, 'upload')
  uploads.push(uploaded)
  return uploaded
}

export function externalTables(): DataObject[] {
  return [
    ...FOUNDRY_CATALOG.flatMap((catalog) => catalog.schemas.flatMap((entry) => entry.tables)),
    ...WORKFLOWS.flatMap((entry) => entry.outputs),
    ...uploads,
  ]
}
