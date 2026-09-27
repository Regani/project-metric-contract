import type { ProjectMetric } from 'project-metric-contract/types'
import validate from 'project-metric-contract/validator'
import { decode } from 'project-metric-contract/decoder'
import schema from 'project-metric-contract/schema' with { type: 'json' }
import timeZones from 'project-metric-contract/time-zones' with { type: 'json' }

const snapshot: ProjectMetric = {
  version: 1, id: 'requests', label: 'Requests', unit: 'requests', scope: 'Service',
  period: { kind: 'point', at: '2026-09-27T00:00:00Z' },
  observedAt: '2026-09-27T00:00:00Z', validUntil: '2026-09-27T00:00:00Z',
  coverage: 'complete', result: { status: 'measured', value: 0 },
}
if (!validate(snapshot)) throw new Error('Validator rejected a valid measurement')
if (validate({ ...snapshot, version: 2 })) throw new Error('Validator accepted an invalid version')
const result = decode(JSON.stringify(snapshot))
if (result.status !== 'valid') throw new Error('Decoder rejected a valid measurement')
const typed: ProjectMetric = result.value
if (typed.result.status !== 'measured' || typed.result.value !== 0) throw new Error('Zero was lost')
if (decode('{').status !== 'invalid') throw new Error('Decoder accepted invalid JSON')
if (!timeZones.enum.includes('Europe/Kyiv') || !schema.$id) throw new Error('Schema export failed')
console.log('Consumer: types, validator, decoder and both schemas OK; measured zero preserved')
