import { it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'

import { drain, duration } from './drain.js'

/** @type {Array<object[]>} what each poll answers */
let polls

/** @type {toa.operations.Process} */
let process

beforeEach(() => {
  polls = []
  process = /** @type {toa.operations.Process} */ {
    execute: mock.fn(async () => JSON.stringify({ items: polls.shift() ?? [] }))
  }
})

it('should answer once no pod of the application is terminating', async () => {
  polls.push([pod('composition-a', true), pod('composition-b')], [pod('composition-b')])

  await drain(process, { namespace: 'acme', timeout: '1m' })

  assert.strictEqual(process.execute.mock.callCount(), 2)

  const [, args, options] = process.execute.mock.calls[0].arguments

  assert.deepStrictEqual(args, ['get', 'pods', '-o', 'json', '-n', 'acme'])
  assert.deepStrictEqual(options, { silently: true })
})

it('should not wait for a pod that is not the application', async () => {
  polls.push([pod('redis-0', true, {})])

  await drain(process, {})

  assert.strictEqual(process.execute.mock.callCount(), 1)
})

it('should give up at the timeout', async () => {
  polls.push([pod('composition-a', true)], [pod('composition-a', true)])

  await assert.rejects(drain(process, { timeout: '1ms' }), /still terminating after 1ms/)
})

it('should read a helm duration', () => {
  assert.strictEqual(duration('12m'), 720_000)
  assert.strictEqual(duration('1h30m'), 5_400_000)
  assert.strictEqual(duration('90s'), 90_000)
  assert.throws(() => duration('soon'), /not a duration/)
})

/**
 * @param {string} name
 * @param {boolean} [terminating]
 * @param {object} [labels]
 */
function pod(name, terminating = false, labels = { 'toa/composition': 'a' }) {
  const metadata = { name, labels }

  if (terminating) metadata.deletionTimestamp = '2026-01-01T00:00:00Z'

  return { metadata }
}
