import type { ErrorObject } from 'ajv';
import type { ProjectMetric } from './project-metric.js';
export declare function decode(text: string): {
    status: 'valid';
    value: ProjectMetric;
} | {
    status: 'invalid';
    reason: 'syntax';
} | {
    status: 'invalid';
    reason: 'schema';
    issues: Pick<ErrorObject, 'keyword' | 'instancePath'>[];
};
