import type { ProjectReview, ReviewItem } from '../../contracts/generated/review/project-review.js'

export function reviewItem(overrides: Partial<ReviewItem> = {}): ReviewItem {
  return {
    id: 'ink-history-20261007T190000Z', title: 'Why Did Ancient Humans Hunt in the Hottest Hour?',
    status: 'needs-decision', statusText: 'Чекає схвалення',
    fields: [{ label: 'Опис', text: 'Noon, the hottest hour.\n\n0:00 Noon' }, { label: 'Слот', text: '2026-10-07 19:00 UTC' }],
    links: [{ label: 'Відкрити в YouTube Studio', url: 'https://studio.youtube.com/video/1yeeoMJ1mBc/edit' }],
    ...overrides,
  }
}

export function reviewFixture(overrides: Partial<ProjectReview> = {}): ProjectReview {
  return { version: 1, observedAt: '2026-10-03T09:47:00Z', validUntil: '2026-10-10T09:47:00Z', items: [reviewItem()], ...overrides }
}
