/* Generated from contracts/project-metric.schema.json. Do not edit. */
import type { ValidateFunction } from 'ajv'
import type { ProjectMetric } from './project-metric.js'
declare const validate: ((value: unknown) => value is ProjectMetric) & Pick<ValidateFunction<ProjectMetric>, 'errors'>
export = validate
