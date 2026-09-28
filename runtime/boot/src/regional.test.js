import { it } from 'node:test'
import assert from 'node:assert/strict'

import { regional } from './regional.js'

const regionalDestination = (name) => ({
  name,
  export: async () => [name],
  import: async () => undefined
})

it('should give a carrier the regional destinations', async () => {
  const carrier = { name: 'convergence', carries: true }
  const events = { name: 'events' }

  regional([events, carrier, regionalDestination('realtime')])

  assert.deepEqual(await carrier.regional.export({}), { realtime: ['realtime'] })
  assert.equal('regional' in events, false)
})

it('should give a carrier nothing where no destination is regional', () => {
  const carrier = { name: 'convergence', carries: true }

  regional([carrier, { name: 'events' }])

  assert.equal(carrier.regional, undefined)
})
