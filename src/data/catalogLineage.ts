/**
 * Mock of the lineage Data Foundry's catalog would return: the pipeline or workflow that writes each table, and the
 * tables it reads. In production this comes from the catalog, not from parsing dashboard SQL.
 */

export type PipelineStatus = 'succeeded' | 'failed' | 'running'

export type Pipeline = {
  id: string
  name: string
  kind: 'Foundry pipeline' | 'Workflow'
  schedule: string
  lastRun: string
  status: PipelineStatus
  owner: string
}

export type UpstreamTable = { table: string; system: string }

export type CatalogEntry = { pipeline: Pipeline; inputs: UpstreamTable[] }

export const PIPELINE_STATUS_LABELS: Record<PipelineStatus, string> = { succeeded: 'Succeeded', failed: 'Failed', running: 'Running' }

const RULE_RUNNER: Pipeline = {
  id: 'dq-rule-runner',
  name: 'Data quality rule runner',
  kind: 'Workflow',
  schedule: 'Daily at 06:00',
  lastRun: '2026-10-13T06:00:00-07:00',
  status: 'succeeded',
  owner: 'neeraj@tesseralabs.ai',
}

const WORKLIST_SYNC: Pipeline = {
  id: 'worklist-sync',
  name: 'Worklist sync',
  kind: 'Foundry pipeline',
  schedule: 'Hourly',
  lastRun: '2026-10-13T09:00:00-07:00',
  status: 'failed',
  owner: 'arihant@tesseralabs.ai',
}

const MIGRATION_LOADER: Pipeline = {
  id: 'migration-loader',
  name: 'Migration package loader',
  kind: 'Foundry pipeline',
  schedule: 'Daily at 02:00',
  lastRun: '2026-10-13T02:00:00-07:00',
  status: 'succeeded',
  owner: 'olivier@tesseralabs.ai',
}

const MAPPING_SYNC: Pipeline = {
  id: 'mapping-sync',
  name: 'Field mapping sync',
  kind: 'Workflow',
  schedule: 'On change',
  lastRun: '2026-10-12T16:40:00-07:00',
  status: 'running',
  owner: 'sophia@tesseralabs.ai',
}

const SAP_KNA1 = { table: 'sap_ecc.master_data.kna1', system: 'SAP ECC' }
const SAP_BUT000 = { table: 'sap_ecc.master_data.but000', system: 'SAP ECC' }
const RULES = { table: 'dh.rules.rule_definitions', system: 'Data Harmonization' }

const CATALOG: Record<string, CatalogEntry> = {
  data_checks: { pipeline: RULE_RUNNER, inputs: [SAP_KNA1, SAP_BUT000, RULES] },
  work_items: { pipeline: WORKLIST_SYNC, inputs: [{ table: 'tessera.worklist.events', system: 'Tessera' }, RULES] },
  packages: { pipeline: MIGRATION_LOADER, inputs: [{ table: 'tessera.migration.package_runs', system: 'Tessera' }] },
  documents: { pipeline: MIGRATION_LOADER, inputs: [{ table: 'tessera.knowledge.documents', system: 'Tessera' }] },
  field_mappings: { pipeline: MAPPING_SYNC, inputs: [SAP_BUT000, { table: 'sap_s4.master_data.bp_fields', system: 'SAP S/4HANA' }] },
}

export function catalogEntry(table: string): CatalogEntry | undefined {
  return CATALOG[table]
}
