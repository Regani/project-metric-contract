import type { ProjectMetric } from 'project-metric-contract/types'
import validate from 'project-metric-contract/validator'
import { decode } from 'project-metric-contract/decoder'
import schema from 'project-metric-contract/schema' with { type: 'json' }
import definitions from 'project-metric-contract/definitions' with { type: 'json' }
import timeZones from 'project-metric-contract/time-zones' with { type: 'json' }
import type { ProjectReview } from 'project-metric-contract/review/types'
import validateReview from 'project-metric-contract/review/validator'
import { decode as decodeReview, maxEncodedBytes } from 'project-metric-contract/review/decoder'
import reviewSchema from 'project-metric-contract/review/schema' with { type: 'json' }

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
if (!timeZones.enum.includes('Europe/Kyiv') || !schema.$id || !definitions.$id) throw new Error('Schema export failed')

const review: ProjectReview = { version: 1, observedAt: '2026-10-03T00:00:00Z', validUntil: '2026-10-03T00:00:00Z', items: [] }
if (!validateReview(review)) throw new Error('Review validator rejected an empty review')
const decodedReview = decodeReview(JSON.stringify(review))
if (decodedReview.status !== 'valid' || decodedReview.value.items.length !== 0) throw new Error('Review decoder failed')
if (maxEncodedBytes !== reviewSchema.maxEncodedBytes) throw new Error('Review byte bound export failed')
console.log('Consumer: metric and review types, validators, decoders and schemas OK; measured zero preserved')
