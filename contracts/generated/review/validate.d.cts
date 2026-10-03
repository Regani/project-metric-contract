/* Generated from contracts/project-review.schema.json. Do not edit. */
import type { ValidateFunction } from 'ajv'
import type { ProjectReview } from './project-review.js'
declare const validate: ((value: unknown) => value is ProjectReview) & Pick<ValidateFunction<ProjectReview>, 'errors'>
export = validate
