# project-metric-contract

Small, versioned contracts for what a project shows its consumer: one metric snapshot and the items it offers for review. This public repository contains the formats, their generated TypeScript types, validators and JSON decoders, and generated Python bindings for the review. It contains no producer, reader, credentials or provider integration. The package is private to npm publishing; consumers install it from Git by reviewed commit SHA.

The handwritten authorities are the payload schemas [contracts/project-metric.schema.json](contracts/project-metric.schema.json) and [contracts/project-review.schema.json](contracts/project-review.schema.json), and the [definitions](contracts/definitions.schema.json) both share: bounded text, multiline text, UTC timestamps and dates. Types, validation and bindings derive from them. [Timezone metadata](contracts/time-zones.schema.json) is generated from the lockfile-pinned `moment-timezone` IANA names and links, with package and tzdata provenance in `$comment`.

## Metric semantics

A metric has a stable `id`, human `label`, `unit` and `scope`. Repository identity belongs to the consumer, not the payload. The period is either inclusive calendar dates with an IANA timezone or a point in time. `observedAt` is the underlying measurement time, not the export time; `validUntil` is the freshness deadline, with equality still fresh. UTC RFC3339 timestamps allow up to millisecond precision. Real dates, ordered intervals and `validUntil >= observedAt` are enforced.

Coverage (`complete`, `partial`, `unknown`) is independent of the result. A measured zero is a real measurement. Missing measurements use `not-configured`, `no-data` or `unavailable`. Signed fractional values are allowed within JavaScript's safe integer magnitude. Unknown fields and versions are rejected. Human text is bounded and excludes C0/C1 controls and bidi formatting characters.

## Review semantics

A review lists at most 20 items, in the order the project wants them shown. Each item has an `id` stable within the project, a `title`, a `status` (`needs-decision`, `in-progress`, `done`, `blocked`) with the project's own `statusText`, up to 20 labelled `fields` whose text may contain line feeds, and up to 4 `links` to https pages opened outside the consumer. The project owns every item, status and text; the consumer owns where the file lives, how it is read and how it is shown. `observedAt` is when the project read its own state and `validUntil` the freshness deadline; their order is not enforced, so a deadline before the observation is simply stale. The review is read-only: it carries no media and no actions.

One encoded review takes at most `maxEncodedBytes` (64 KiB) of UTF-8, an annotation in the schema that both bindings export: TypeScript readers bound their read by it and the Python encoder refuses a longer payload. Unknown fields and versions are rejected.

## Install by commit

Replace `<sha>` with the full reviewed commit SHA, then commit the consumer lockfile:

```sh
npm install 'github:Regani/project-metric-contract#<sha>'
pnpm add 'github:Regani/project-metric-contract#<sha>'
uv add 'project-metric-contract @ git+https://github.com/Regani/project-metric-contract@<sha>'
```

Node 24 or newer is required. The package is ESM; Ajv's generated validator is CommonJS with typed ESM interop. Repository scripts and tests use Node's native type stripping. The installed decoder uses committed generated JavaScript and declarations because [Node does not strip TypeScript in dependencies](https://nodejs.org/docs/latest-v24.x/api/typescript.html#type-stripping-in-dependencies). There is no install-time build or lifecycle hook. Ajv and ajv-formats are runtime dependencies; generation tools are development dependencies. The Python distribution needs Python 3.12 or newer and depends only on msgspec.

| Export | Purpose |
| --- | --- |
| `project-metric-contract/schema` | Owning metric JSON Schema |
| `project-metric-contract/definitions` | Shared definitions schema |
| `project-metric-contract/time-zones` | Referenced timezone schema |
| `project-metric-contract/types` | Type-only `ProjectMetric` and derived declarations |
| `project-metric-contract/validator` | Default Ajv metric validator/type guard for an external value |
| `project-metric-contract/decoder` | Named `decode` for external metric JSON text |
| `project-metric-contract/review/schema` | Owning review JSON Schema |
| `project-metric-contract/review/types` | Type-only `ProjectReview`, `ReviewItem`, `ReviewStatus`, `ReviewField`, `ReviewLink` |
| `project-metric-contract/review/validator` | Default Ajv review validator/type guard |
| `project-metric-contract/review/decoder` | Named `decode` for external review JSON text and `maxEncodedBytes` |
| Python `project_metric_contract.review` | msgspec structs, `encode` and `MAX_ENCODED_BYTES` |

## Validate at the boundary

A TypeScript producer constructs a typed snapshot, validates at its output boundary, then publishes it:

```ts
import type { ProjectMetric } from 'project-metric-contract/types'
import validate from 'project-metric-contract/validator'

export function serializeSnapshot(snapshot: ProjectMetric): string {
  if (!validate(snapshot)) throw new Error('Invalid metric snapshot')
  return JSON.stringify(snapshot)
}
```

A Python producer constructs the generated structs and calls `encode`, its one output boundary. msgspec does not check constraints when a struct is constructed, so `encode` decodes its own bytes against the same struct and raises `msgspec.ValidationError` when they break the schema or the byte bound:

```python
from project_metric_contract.review import ProjectReview, ReviewItem, encode

data = encode(ProjectReview(version=1, observed_at=observed, valid_until=until, items=[
    ReviewItem(id="ep-2", title="Title", status="needs-decision", status_text="Waiting", fields=[], links=[]),
]))
```

Static types cannot enforce real dates or relative ordering, so producer output validation is necessary. Add the destination snapshot to the producing project's `.gitignore`. Write a temporary regular file in the **same directory** as `metric.json` or `review.json`, then atomically rename it over the destination. Never edit the published file in place. The consumer integration chooses the directory; the producer owns scheduling, credentials and delivery.

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

JSON consumers can import schemas with `with { type: 'json' }`. Custom validators must register the definitions and timezone schemas, support Ajv `$data` plus ajv-formats comparison keywords, apply keywords beside `$ref` as Ajv does, and accept the `maxEncodedBytes` annotation; generic draft-07 validation alone does not enforce these contracts. Prefer the exported validators.

## Regenerate and verify

```sh
npm ci
uv sync --frozen
npm run gen
npm run check
```

Commit all generated outputs and both lockfiles. `check` compares regeneration byte for byte, rejects superseded generated files, checks handwritten architecture constraints, typechecks and runs conformance tests. The review conformance test builds the Python wheel, installs it alone in an isolated environment and requires the same verdict as the TypeScript decoder on every fixture. No separate application build is needed; `gen` generates the distributable files.

The generator uses [json-schema-to-typescript](https://github.com/bcherny/json-schema-to-typescript) for declarations, [Ajv standalone generation](https://ajv.js.org/standalone.html) with [ajv-formats](https://github.com/ajv-validator/ajv-formats) for validation, the [TypeScript compiler](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API) for the decoder's JavaScript and declaration, and the `uv.lock`-pinned [datamodel-code-generator](https://datamodel-code-generator.koxudaxi.dev/output-model-types/) for the msgspec structs. Its narrow generated adapters own JSON decoding and Python encoding and expose schema-derived typed results. Generated files are never separate handwritten authorities. Patterns use syntax that ECMAScript and Python read alike and end with `(?![\s\S])`, because a Python `$` also matches before a final line feed. To refresh timezones, update `moment-timezone` and the lockfile, regenerate, review the metadata diff, and rerun `check`.
