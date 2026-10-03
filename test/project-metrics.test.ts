import assert from 'node:assert/strict'
import { test } from 'node:test'
import { decode } from '../contracts/generated/metric/decode.js'
import { metricFixture } from './fixtures/project-metric.ts'

test('generated decoder accepts both periods, zero, partial coverage and every no-measurement reason', () => {
  for (const value of [metricFixture(), metricFixture({ coverage: 'partial' }), metricFixture({ period: { kind: 'point', at: '2026-09-27T00:00:00Z' } }),
    metricFixture({ result: { status: 'no-measurement', reason: 'not-configured' } }),
    metricFixture({ result: { status: 'no-measurement', reason: 'no-data' } }),
    metricFixture({ result: { status: 'no-measurement', reason: 'unavailable' } })]) {
    assert.deepEqual(decode(JSON.stringify(value)), { status: 'valid', value })
  }
})

test('IANA metadata accepts modern names and links without relying on the host ICU list', () => {
  const zones: Extract<ReturnType<typeof metricFixture>['period'], { kind: 'interval' }>['timeZone'][] = ['Europe/Kyiv', 'Asia/Kolkata', 'Europe/Warsaw', 'US/Eastern', 'UTC']
  for (const timeZone of zones) {
    const value = metricFixture({ period: { kind: 'interval', start: '2026-09-01', end: '2026-09-26', timeZone } })
    assert.deepEqual(decode(JSON.stringify(value)), { status: 'valid', value })
  }
})

test('generated decoder enforces discriminants, dates, ordering, bounds, IANA names and version', () => {
  const good = metricFixture()
  const invalid = [null, [], {}, { ...good, version: 2 }, { ...good, project: '/other/repo' },
    { ...good, result: { status: 'measured' } }, { ...good, result: { status: 'measured', value: '0' } },
    { ...good, result: { status: 'measured', value: Number.MAX_VALUE } },
    { ...good, result: { status: 'no-measurement', reason: 'no-data', value: 0 } },
    { ...good, result: { status: 'no-measurement', reason: 'other' } },
    { ...good, label: '' }, { ...good, scope: 'store\nspoofed line' }, { ...good, unit: '\u001b[31m' }, { ...good, label: 'x'.repeat(161) }, { ...good, id: 'unstable id' },
    { ...good, coverage: 'maybe' }, { ...good, observedAt: '2026-02-30T00:00:00Z' },
    { ...good, observedAt: '2026-09-27T00:00:00' }, { ...good, validUntil: '2026-09-26T00:00:00Z' },
    { ...good, period: { kind: 'point', at: 'yesterday' } },
    ...[{ start: '2026-02-30' }, { end: '2026-08-01' }, { timeZone: 'Mars/Olympus' }, { kind: 'other' }, { at: good.observedAt }].map(change => ({ ...good, period: { ...good.period, ...change } })),
  ]
  for (const value of invalid) assert.equal(decode(JSON.stringify(value)).status, 'invalid', JSON.stringify(value))
  assert.deepEqual(decode('{'), { status: 'invalid', reason: 'syntax' })
  assert.equal(decode(JSON.stringify(good).replace('"value":0', '"value":1e999')).status, 'invalid')
})

test('text fields reject C1 controls and bidi formatting at the schema boundary', () => {
  const codes = [0x7f, ...Array.from({ length: 32 }, (_, index) => 0x80 + index), 0x061c, 0x200e, 0x200f,
    ...Array.from({ length: 7 }, (_, index) => 0x2028 + index), ...Array.from({ length: 4 }, (_, index) => 0x2066 + index)]
  for (const code of codes) {
    const text = `prefix${String.fromCodePoint(code)}suffix`
    for (const field of ['label', 'unit', 'scope']) {
      assert.equal(decode(JSON.stringify({ ...metricFixture(), [field]: text })).status, 'invalid', `${field}: U+${code.toString(16)}`)
    }
  }
})


test('signed fractional measurements, safe bounds, unknown coverage and equal endpoints are valid', () => {
  for (const value of [-Number.MAX_SAFE_INTEGER, -1.5, 0, 1.5, Number.MAX_SAFE_INTEGER]) {
    const snapshot = metricFixture({ coverage: 'unknown', result: { status: 'measured', value },
      validUntil: metricFixture().observedAt,
      period: { kind: 'interval', start: '2024-02-29', end: '2024-02-29', timeZone: 'UTC' } })
    assert.deepEqual(decode(JSON.stringify(snapshot)), { status: 'valid', value: snapshot })
  }
})

test('nested unknown fields, negative overflow and unsupported timestamp precision are rejected', () => {
  const good = metricFixture()
  for (const value of [
    { ...good, result: { ...good.result, extra: true } },
    { ...good, result: { status: 'measured', value: -Number.MAX_VALUE } },
    { ...good, observedAt: '2026-09-27T00:00:00.0001Z' },
    { ...good, observedAt: '2026-09-27T00:00:00+00:00' },
  ]) assert.equal(decode(JSON.stringify(value)).status, 'invalid')
})

test('schema faults expose only safe locations and keywords', () => {
  const result = decode(JSON.stringify({ ...metricFixture(), 'sensitive-value': true }))
  assert.equal(result.status, 'invalid')
  if (result.status === 'invalid' && result.reason === 'schema') {
    assert.deepEqual(result.issues, [{ keyword: 'additionalProperties', instancePath: '' }])
  } else assert.fail('Expected a schema fault')
})
