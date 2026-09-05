import { it, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'

import { Outbox } from '../source/outbox/index.js'

let emission, storage, atom, outbox, listeners

const BATCH = 4

/** rows as the storage hands them back, ids ascending like the uuid v7 they are */
const page = (from, count) =>
  Array.from({ length: count }, (_, i) => ({
    id: String(from + i).padStart(4, '0'),
    event: { state: {} }
  }))

beforeEach(() => {
  resetCalls()
  mock.timers.enable()

  emission = { emit: mock.fn(async () => undefined), link: mock.fn() }

  storage = {
    link: mock.fn(),
    outbox: {
      pending: mock.fn(async () => []),
      settle: mock.fn(async () => undefined)
    }
  }

  listeners = []

  atom = {
    slots: mock.fn(() => [0]),
    onassigned: (listener) => {
      listeners.push(listener)
      listener({ i: 0, n: 1 })

      return () => { listeners = listeners.filter((one) => one !== listener) }
    },
    link: mock.fn()
  }
  outbox = new Outbox(emission, storage, atom, { interval: 1000, batch: BATCH })
})

afterEach(() => {
  mock.timers.reset()
})

/** everything the current turn awaited, without moving the clock */
const settled = async () => {
  for (let i = 0; i < 20; i++) await Promise.resolve()
}

/** one cycle, and everything it awaited */
const cycle = async () => {
  mock.timers.tick(1000)

  for (let i = 0; i < 20; i++) await Promise.resolve()
}

it('should read nothing more when the first page is short', async () => {
  storage.outbox.pending.mock.mockImplementationOnce(async () => page(0, 3))

  await outbox.open()
  await cycle()

  assert.strictEqual(storage.outbox.pending.mock.callCount(), 1)
  assert.strictEqual(emission.emit.mock.callCount(), 3)
})

it('should keep reading while a page comes back full', async () => {
  storage.outbox.pending.mock.mockImplementationOnce(async () => page(0, BATCH), storage.outbox.pending.mock.callCount())
  storage.outbox.pending.mock.mockImplementationOnce(async () => page(BATCH, BATCH), storage.outbox.pending.mock.callCount() + 1)
  storage.outbox.pending.mock.mockImplementationOnce(async () => page(2 * BATCH, 5), storage.outbox.pending.mock.callCount() + 2)

  await outbox.open()
  await cycle()

  assert.strictEqual(storage.outbox.pending.mock.callCount(), 3)
  assert.strictEqual(emission.emit.mock.callCount(), 2 * BATCH + 5)
})

it('should continue each page from the id the one before ended on', async () => {
  storage.outbox.pending.mock.mockImplementationOnce(async () => page(0, BATCH), storage.outbox.pending.mock.callCount())
  storage.outbox.pending.mock.mockImplementationOnce(async () => page(BATCH, 1), storage.outbox.pending.mock.callCount() + 1)

  await outbox.open()
  await cycle()

  const [, second] = storage.outbox.pending.mock.calls

  assert.strictEqual(storage.outbox.pending.mock.calls[0].arguments[3], undefined)
  assert.deepStrictEqual(second.arguments[3], String(BATCH - 1).padStart(4, '0'))
})

it('should mark what it published, once, after the last page', async () => {
  storage.outbox.pending.mock.mockImplementationOnce(async () => page(0, BATCH), storage.outbox.pending.mock.callCount())
  storage.outbox.pending.mock.mockImplementationOnce(async () => page(BATCH, 2), storage.outbox.pending.mock.callCount() + 1)

  await outbox.open()
  await cycle()

  assert.strictEqual(storage.outbox.settle.mock.callCount(), 1)
  assert.strictEqual(storage.outbox.settle.mock.calls[0].arguments[0].length, BATCH + 2)
})

it('should not publish a row it has published and not yet marked', async () => {
  storage.outbox.settle.mock.mockImplementationOnce(async () => { throw new Error('mongo is out') })
  storage.outbox.pending.mock.mockImplementationOnce(async () => page(0, 2), storage.outbox.pending.mock.callCount())
  storage.outbox.pending.mock.mockImplementationOnce(async () => page(0, 2), storage.outbox.pending.mock.callCount() + 1)

  await outbox.open()
  await cycle()
  await cycle()

  assert.strictEqual(emission.emit.mock.callCount(), 2)
})

it('should read nothing while it owns no slots', async () => {
  atom.slots.mock.mockImplementation(() => null)

  await outbox.open()
  await cycle()

  assert.strictEqual(storage.outbox.pending.mock.callCount(), 0)
})

function resetCalls (target = [assert, BATCH, page, cycle], seen = new Set()) {
  if (target === null || typeof target !== 'object' || seen.has(target)) return

  seen.add(target)

  for (const value of Object.values(target))
    if (typeof value === 'function' && value.mock !== undefined) value.mock.resetCalls()
    else resetCalls(value, seen)
}

it('should read as soon as a claim arrives, rather than on its next cycle', async () => {
  atom.slots.mock.mockImplementation(() => null)

  await outbox.open()
  await settled()

  assert.strictEqual(storage.outbox.pending.mock.callCount(), 0, 'nothing is owned yet')

  atom.slots.mock.mockImplementation(() => [0])

  for (const listener of listeners) listener({ i: 0, n: 1 })

  await settled()

  assert.strictEqual(storage.outbox.pending.mock.callCount(), 1,
    'the lane is its own now, and the cycle is up to five seconds away')
})

it('should read the lanes it inherits when the group resizes', async () => {
  await outbox.open()
  await settled()

  const before = storage.outbox.pending.mock.callCount()

  for (const listener of listeners) listener({ i: 0, n: 2 })

  await settled()

  assert.strictEqual(storage.outbox.pending.mock.callCount(), before + 1)
})
