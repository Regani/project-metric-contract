/* Generated from contracts/project-review.schema.json. Do not edit. */
import validate from './validate.cjs';
/** The most UTF-8 bytes one encoded payload may take; readers bound their read by it. */
export const maxEncodedBytes = 65536;
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
