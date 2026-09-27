# project-metric-contract

A small, versioned contract for one project-owned metric snapshot. This public repository contains the format, its generated TypeScript types, validator and JSON decoder. It contains no producer, reader, credentials or provider integration. The package is private to npm publishing; consumers install it from Git by reviewed commit SHA.

The handwritten authority is [contracts/project-metric.schema.json](contracts/project-metric.schema.json). Types and validation derive from it. [Timezone metadata](contracts/time-zones.schema.json) is generated from the lockfile-pinned `moment-timezone` IANA names and links, with package and tzdata provenance in `$comment`.

## Snapshot semantics

A metric has a stable `id`, human `label`, `unit` and `scope`. Repository identity belongs to the consumer, not the payload. The period is either inclusive calendar dates with an IANA timezone or a point in time. `observedAt` is the underlying measurement time, not the export time; `validUntil` is the freshness deadline, with equality still fresh. UTC RFC3339 timestamps allow up to millisecond precision. Real dates, ordered intervals and `validUntil >= observedAt` are enforced.

Coverage (`complete`, `partial`, `unknown`) is independent of the result. A measured zero is a real measurement. Missing measurements use `not-configured`, `no-data` or `unavailable`. Signed fractional values are allowed within JavaScript's safe integer magnitude. Unknown fields and versions are rejected. Human text is bounded and excludes C0/C1 controls and bidi formatting characters.

## Install by commit

Replace `<sha>` with the full reviewed commit SHA, then commit the consumer lockfile:

```sh
npm install 'github:Regani/project-metric-contract#<sha>'
pnpm add 'github:Regani/project-metric-contract#<sha>'
```

Node 24 or newer is required. The package is ESM; Ajv's generated validator is CommonJS with typed ESM interop. Repository scripts and tests use Node's native type stripping. The installed decoder uses committed generated JavaScript and declarations because [Node does not strip TypeScript in dependencies](https://nodejs.org/docs/latest-v24.x/api/typescript.html#type-stripping-in-dependencies). There is no install-time build or lifecycle hook. Ajv and ajv-formats are runtime dependencies; generation tools are development dependencies.

| Export | Purpose |
| --- | --- |
| `project-metric-contract/schema` | Owning JSON Schema |
| `project-metric-contract/time-zones` | Referenced timezone schema |
| `project-metric-contract/types` | Type-only `ProjectMetric` and derived declarations |
| `project-metric-contract/validator` | Default Ajv validator/type guard for an external value |
| `project-metric-contract/decoder` | Named `decode` for external JSON text |

## Validate at the boundary

A producer constructs a typed snapshot, validates at its output boundary, then publishes it:

```ts
import type { ProjectMetric } from 'project-metric-contract/types'
import validate from 'project-metric-contract/validator'

export function serializeSnapshot(snapshot: ProjectMetric): string {
  if (!validate(snapshot)) throw new Error('Invalid metric snapshot')
  return JSON.stringify(snapshot)
}
```

Static types cannot enforce real dates or relative ordering, so producer output validation is necessary. Add the destination snapshot to the producing project's `.gitignore`. Write a temporary regular file in the **same directory** as `metric.json`, then atomically rename it over the destination. Never edit the published file in place. The consumer integration chooses the directory; the producer owns scheduling, credentials and delivery.

A reader decodes external JSON text once and consumes the typed result:

```ts
import { decode } from 'project-metric-contract/decoder'

const result = decode(textFromFile)
if (result.status === 'valid') {
  console.log(result.value.label, result.value.result)
} else if (result.reason === 'schema') {
  console.error(result.issues) // Only keyword and instancePath; no payload values.
} else {
  console.error('Invalid JSON syntax')
}
```

Do not parse before calling `decode`, or revalidate its typed success in internal flows. Byte limits, UTF-8 decoding, filesystem safety, caching and current freshness evaluation belong to the consuming reader. The contract does not perform I/O.

JSON consumers can import schemas with `with { type: 'json' }`. Custom validators must register both schemas and support Ajv `$data` plus ajv-formats comparison keywords; generic JSON Schema validation alone does not enforce this contract's ordering rules. Prefer the exported validator.

## Regenerate and verify

```sh
npm ci
npm run gen:metric
npm run check
```

Commit all generated outputs and the lockfile. `check` compares regeneration byte for byte, rejects superseded generated files, checks handwritten architecture constraints, typechecks and runs conformance tests. No separate application build is needed; `gen:metric` generates the distributable files.

The generator uses [json-schema-to-typescript](https://github.com/bcherny/json-schema-to-typescript) for declarations, [Ajv standalone generation](https://ajv.js.org/standalone.html) with [ajv-formats](https://github.com/ajv-validator/ajv-formats) for validation, and the [TypeScript compiler](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API) for the decoder's JavaScript and declaration. Its narrow generated adapter owns JSON decoding and exposes a schema-derived typed result. Generated files are never separate handwritten authorities. To refresh timezones, update `moment-timezone` and the lockfile, regenerate, review the metadata diff, and rerun `check`.
