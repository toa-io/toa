import { it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { console } from 'openspan'

import { Regional } from '../source/regional.js'

let error

const row = { id: '0001', event: { state: {} } }

const destination = (name, exported) => ({
  name,
  export: mock.fn(async () => exported),
  import: mock.fn(async () => undefined)
})

beforeEach(() => {
  mock.restoreAll()
  error = mock.method(console, 'error', () => undefined)
})

it('should tell a destination that exports and imports', () => {
  assert.equal(Regional.is(destination('realtime')), true)
  assert.equal(Regional.is({ name: 'events', emit: async () => undefined }), false)
  assert.equal(Regional.is({ name: 'half', export: async () => undefined }), false)
})

it('should export by the names of the destinations', async () => {
  const regional = new Regional([destination('one', [1]), destination('two', { b: 2 })])

  assert.deepEqual(await regional.export(row), { one: [1], two: { b: 2 } })
})

it('should leave out a destination that exported nothing', async () => {
  const regional = new Regional([destination('one', [1]), destination('two', undefined)])

  assert.deepEqual(await regional.export(row), { one: [1] })
})

it('should export nothing where none exported anything', async () => {
  const regional = new Regional([destination('one', undefined)])

  assert.equal(await regional.export(row), undefined)
})

it('should leave out a destination whose export failed, and say so', async () => {
  const failing = destination('two')

  failing.export = mock.fn(async () => {
    throw new Error('payload bridge threw')
  })

  const regional = new Regional([destination('one', [1]), failing])

  assert.deepEqual(await regional.export(row), { one: [1] })
  assert.equal(error.mock.callCount(), 1)
  assert.equal(error.mock.calls[0].arguments[1].destination, 'two')
})

it('should import each part to the destination of its name', async () => {
  const one = destination('one')
  const two = destination('two')

  await new Regional([one, two]).import({ one: [1], two: { b: 2 } })

  assert.deepEqual(one.import.mock.calls[0].arguments, [[1]])
  assert.deepEqual(two.import.mock.calls[0].arguments, [{ b: 2 }])
})

it('should drop a part this component has no destination for', async () => {
  const one = destination('one')

  await new Regional([one]).import({ one: [1], gone: [2] })

  assert.equal(one.import.mock.callCount(), 1)
})

it('should fail the import once every part has landed or failed', async () => {
  const failing = destination('one')
  let landed = false

  failing.import = mock.fn(async () => {
    throw new Error('away')
  })

  const slow = destination('two')

  slow.import = mock.fn(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10))
    landed = true
  })

  await assert.rejects(new Regional([failing, slow]).import({ one: [], two: [] }), /away/)
  assert.equal(landed, true)
})
