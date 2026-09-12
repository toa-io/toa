import { it } from 'node:test'
import assert from 'node:assert/strict'

import { registry } from 'openspan'
import { answered, request } from './measurements.ts'

it('should count an answer by the method, the route and the status', () => {
  const measure = request('POST')

  measure.labels.route = '/items/'

  answered(measure.labels, 201)

  const series = registry()
    .collect()
    .find(({ name, labels }) => name === 'toa.exposition.responses' && labels.route === '/items/')

  assert.deepEqual(series?.labels, { method: 'POST', route: '/items/', status: '201' })
  assert.equal(series?.value, 1)
})
