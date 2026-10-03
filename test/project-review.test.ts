import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtemp, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { decode, maxEncodedBytes } from '../contracts/generated/review/decode.js'
import type { ReviewStatus } from '../contracts/generated/review/project-review.js'
import { reviewFixture, reviewItem } from './fixtures/project-review.ts'

const statuses: ReviewStatus[] = ['needs-decision', 'in-progress', 'done', 'blocked']
const good = reviewFixture()
const valid = [good, reviewFixture({ items: [] }), reviewFixture({ validUntil: good.observedAt, observedAt: '2026-10-03T09:47:00.123Z' }),
  reviewFixture({ items: statuses.map((status, index) => reviewItem({ id: `item-${index.toString()}`, status })) }),
  reviewFixture({ items: [reviewItem({ fields: [], links: [] })] }),
  reviewFixture({ items: Array.from({ length: 20 }, (_, index) => reviewItem({ id: `i.${index.toString()}_x` })) }),
  reviewFixture({ items: [reviewItem({ title: 'x'.repeat(160), fields: [{ label: 'l'.repeat(64), text: 'y'.repeat(5000) }] })] })]
const invalid = [null, [], {}, { ...good, version: 2 }, { ...good, project: '/other/repo' },
  { ...good, observedAt: '2026-10-03T09:47:00' }, { ...good, validUntil: '2026-10-03T09:47:00+00:00' }, { ...good, observedAt: '2026-10-03T09:47:00.0001Z' },
  { ...good, items: Array.from({ length: 21 }, () => reviewItem()) },
  ...[{ id: '' }, { id: '-leading' }, { id: 'has space' }, { id: 'a'.repeat(129) }, { id: 'trailing\n' },
    { title: '' }, { title: 'x'.repeat(161) }, { title: 'line\nbreak' }, { title: 'title\n' }, { title: 'bidi‮text' }, { statusText: '\u001b[31m' },
    { status: 'approved' }, { fields: Array.from({ length: 21 }, () => ({ label: 'l', text: 't' })) },
    { fields: [{ label: 'l', text: 'y'.repeat(5001) }] }, { fields: [{ label: 'l'.repeat(65), text: 't' }] }, { fields: [{ label: 'l', text: 'tab\there' }] },
    { fields: [{ label: 'l', text: 't', extra: true }] }, { links: [{ label: 'l', url: 'http://example.com' }] },
    { links: [{ label: 'l', url: 'javascript:alert(1)' }] }, { links: [{ label: 'l', url: 'https://example.com/a b' }] },
    { links: [{ label: 'l', url: 'https://example.com\n' }] }, { links: [{ label: 'l', url: `https://${'a'.repeat(2041)}` }] },
    { links: Array.from({ length: 5 }, () => ({ label: 'l', url: 'https://example.com' })) }, { media: [] }, { actions: [] }].map(change => ({ ...good, items: [{ ...reviewItem(), ...change }] })),
]

test('generated decoder accepts every status, empty lists, the bounds and line feeds in field text', () => {
  for (const value of valid) assert.deepEqual(decode(JSON.stringify(value)), { status: 'valid', value })
})

test('generated decoder rejects unknown fields, versions, controls, bidi, unsafe links and exceeded bounds', () => {
  for (const value of invalid) assert.equal(decode(JSON.stringify(value)).status, 'invalid', JSON.stringify(value))
  assert.deepEqual(decode('{'), { status: 'invalid', reason: 'syntax' })
})

test('the built Python wheel decodes the same fixtures to the same verdicts and its encoder enforces the schema and byte bound', async () => {
  // The wheel alone, in an isolated environment, as a consumer installs it; a fresh path defeats uv's build cache.
  const dist = await mkdtemp(join(tmpdir(), 'review-dist-'))
  try {
    execFileSync('uv', ['build', '--quiet', '--wheel', '--out-dir', dist])
    const [wheel] = (await readdir(dist)).filter(file => file.endsWith('.whl'))
    if (!wheel?.endsWith('.whl')) assert.fail(`No wheel was built: ${String(wheel)}`)
    const texts = [...valid, ...invalid].map(value => JSON.stringify(value))
    const stdout = execFileSync('uv', ['run', '--quiet', '--isolated', '--no-project', '--with', join(dist, wheel), 'python', 'test/review_conformance.py'], { input: JSON.stringify(texts), encoding: 'utf8' })
    assert.equal(stdout, JSON.stringify({
      verdicts: [...valid.map(() => 'valid'), ...invalid.map(() => 'invalid')],
      maxBytes: maxEncodedBytes, constraint: 'rejected', bound: 'rejected', roundTrip: true,
    }))
  } finally { await rm(dist, { recursive: true, force: true }) }
})
