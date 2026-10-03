/* Generated from contracts/project-metric.schema.json. Do not edit. */
import validate from './validate.cjs';
export function decode(text) {
    try {
        const value = JSON.parse(text);
        return validate(value) ? { status: 'valid', value }
            : { status: 'invalid', reason: 'schema', issues: (validate.errors ?? []).map(({ keyword, instancePath }) => ({ keyword, instancePath })) };
    }
    catch {
        return { status: 'invalid', reason: 'syntax' };
    }
}
