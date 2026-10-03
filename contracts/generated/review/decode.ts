/* Generated from contracts/project-review.schema.json. Do not edit. */
import validate from './validate.cjs'
import type { ErrorObject } from 'ajv'
import type { ProjectReview } from './project-review.js'

/** The most UTF-8 bytes one encoded payload may take; readers bound their read by it. */
export const maxEncodedBytes = 65536
export function decode(text: string):
  | { status: 'valid'; value: ProjectReview }
  | { status: 'invalid'; reason: 'syntax' }
  | { status: 'invalid'; reason: 'schema'; issues: Pick<ErrorObject, 'keyword' | 'instancePath'>[] } {
  try {
    const value: unknown = JSON.parse(text)
    return validate(value) ? { status: 'valid', value }
      : { status: 'invalid', reason: 'schema', issues: (validate.errors ?? []).map(({ keyword, instancePath }) => ({ keyword, instancePath })) }
  } catch { return { status: 'invalid', reason: 'syntax' } }
}
