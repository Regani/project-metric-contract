import type { ProjectMetric } from '../../contracts/generated/metric/project-metric.js'

export function metricFixture(overrides: Partial<ProjectMetric> = {}): ProjectMetric {
  return {
    version: 1, id: 'orders', label: 'Замовлення', unit: 'замовлень', scope: 'Магазин',
    period: { kind: 'interval', start: '2026-09-01', end: '2026-09-26', timeZone: 'Europe/Warsaw' },
    observedAt: '2026-09-27T00:00:00Z', validUntil: '2026-09-28T00:00:00Z',
    coverage: 'complete', result: { status: 'measured', value: 0 }, ...overrides,
  }
}
