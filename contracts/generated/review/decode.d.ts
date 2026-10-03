import type { ErrorObject } from 'ajv';
import type { ProjectReview } from './project-review.js';
/** The most UTF-8 bytes one encoded payload may take; readers bound their read by it. */
export declare const maxEncodedBytes = 65536;
export declare function decode(text: string): {
    status: 'valid';
    value: ProjectReview;
} | {
    status: 'invalid';
    reason: 'syntax';
} | {
    status: 'invalid';
    reason: 'schema';
    issues: Pick<ErrorObject, 'keyword' | 'instancePath'>[];
};
