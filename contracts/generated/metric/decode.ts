/* Generated from contracts/project-metric.schema.json. Do not edit. */
import validate from './validate.cjs'
import type { ErrorObject } from 'ajv'
import type { ProjectMetric } from './project-metric.js'
export function decode(text: string):
  | { status: 'valid'; value: ProjectMetric }
  | { status: 'invalid'; reason: 'syntax' }
  | { status: 'invalid'; reason: 'schema'; issues: Pick<ErrorObject, 'keyword' | 'instancePath'>[] } {
  try {
    const value: unknown = JSON.parse(text)
    return validate(value) ? { status: 'valid', value }
      : { status: 'invalid', reason: 'schema', issues: (validate.errors ?? []).map(({ keyword, instancePath }) => ({ keyword, instancePath })) }
  } catch { return { status: 'invalid', reason: 'syntax' } }
}
