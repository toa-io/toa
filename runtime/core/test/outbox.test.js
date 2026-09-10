import { it, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { console } from 'openspan'

import { Outbox } from '../source/outbox.js'

let emission, storage, atom, outbox, listeners

const BATCH = 4

/** rows as the storage hands them back, ids ascending like the uuid v7 they are */
const page = (from, count, outstanding = ['events']) =>
  Array.from({ length: count }, (_, i) => ({
    id: String(from + i).padStart(4, '0'),
    outstanding,
    event: { state: {} }
  }))

beforeEach(() => {
  resetCalls()
  mock.timers.enable()

  emission = { name: 'events', emit: mock.fn(async () => undefined), link: mock.fn() }

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

      return () => {
        listeners = listeners.filter((one) => one !== listener)
      }
    },
    link: mock.fn()
  }
  outbox = new Outbox([emission], storage, atom, { interval: 1000, batch: BATCH })
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
  storage.outbox.pending.mock.mockImplementationOnce(
    async () => page(0, BATCH),
    storage.outbox.pending.mock.callCount()
  )
  storage.outbox.pending.mock.mockImplementationOnce(
    async () => page(BATCH, BATCH),
    storage.outbox.pending.mock.callCount() + 1
  )
  storage.outbox.pending.mock.mockImplementationOnce(
    async () => page(2 * BATCH, 5),
    storage.outbox.pending.mock.callCount() + 2
  )

  await outbox.open()
  await cycle()

  assert.strictEqual(storage.outbox.pending.mock.callCount(), 3)
  assert.strictEqual(emission.emit.mock.callCount(), 2 * BATCH + 5)
})

it('should continue each page from the id the one before ended on', async () => {
  storage.outbox.pending.mock.mockImplementationOnce(
    async () => page(0, BATCH),
    storage.outbox.pending.mock.callCount()
  )
  storage.outbox.pending.mock.mockImplementationOnce(
    async () => page(BATCH, 1),
    storage.outbox.pending.mock.callCount() + 1
  )

  await outbox.open()
  await cycle()

  const [, second] = storage.outbox.pending.mock.calls

  assert.strictEqual(storage.outbox.pending.mock.calls[0].arguments[3], undefined)
  assert.deepStrictEqual(second.arguments[3], String(BATCH - 1).padStart(4, '0'))
})

it('should mark what it published, once, after the last page', async () => {
  storage.outbox.pending.mock.mockImplementationOnce(
    async () => page(0, BATCH),
    storage.outbox.pending.mock.callCount()
  )
  storage.outbox.pending.mock.mockImplementationOnce(
    async () => page(BATCH, 2),
    storage.outbox.pending.mock.callCount() + 1
  )

  await outbox.open()
  await cycle()

  assert.strictEqual(storage.outbox.settle.mock.callCount(), 1)
  assert.strictEqual(storage.outbox.settle.mock.calls[0].arguments[0].length, BATCH + 2)
  assert.deepStrictEqual(storage.outbox.settle.mock.calls[0].arguments[1], ['events'])
})

it('should not publish a row it has published and not yet marked', async () => {
  storage.outbox.settle.mock.mockImplementationOnce(async () => {
    throw new Error('mongo is out')
  })
  storage.outbox.pending.mock.mockImplementationOnce(
    async () => page(0, 2),
    storage.outbox.pending.mock.callCount()
  )
  storage.outbox.pending.mock.mockImplementationOnce(
    async () => page(0, 2),
    storage.outbox.pending.mock.callCount() + 1
  )

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

function resetCalls(target = [assert, BATCH, page, cycle], seen = new Set()) {
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

  assert.strictEqual(
    storage.outbox.pending.mock.callCount(),
    1,
    'the lane is its own now, and the cycle is up to five seconds away'
  )
})

it('should read the lanes it inherits when the group resizes', async () => {
  await outbox.open()
  await settled()

  const before = storage.outbox.pending.mock.callCount()

  for (const listener of listeners) listener({ i: 0, n: 2 })

  await settled()

  assert.strictEqual(storage.outbox.pending.mock.callCount(), before + 1)
})

it('should publish a row to every destination it is outstanding for', async () => {
  const other = destination('convergence')

  outbox = new Outbox([emission, other], storage, atom, { interval: 1000, batch: BATCH })

  storage.outbox.pending.mock.mockImplementationOnce(
    async () => page(0, 2, ['events', 'convergence']),
    storage.outbox.pending.mock.callCount()
  )

  await outbox.open()
  await cycle()

  assert.strictEqual(emission.emit.mock.callCount(), 2)
  assert.strictEqual(other.emit.mock.callCount(), 2)
})

it('should settle every destination of a row in one write', async () => {
  const other = destination('convergence')

  outbox = new Outbox([emission, other], storage, atom, { interval: 1000, batch: BATCH })

  storage.outbox.pending.mock.mockImplementationOnce(
    async () => page(0, 2, ['events', 'convergence']),
    storage.outbox.pending.mock.callCount()
  )

  await outbox.open()
  await cycle()

  assert.strictEqual(storage.outbox.settle.mock.callCount(), 1)
  assert.deepStrictEqual(storage.outbox.settle.mock.calls[0].arguments[1], [
    'events',
    'convergence'
  ])
})

it('should settle the destination that landed when another refused', async () => {
  const other = destination('convergence')

  other.emit.mock.mockImplementation(async () => {
    throw new Error('the far broker is out')
  })

  outbox = new Outbox([emission, other], storage, atom, { interval: 1000, batch: BATCH })

  storage.outbox.pending.mock.mockImplementationOnce(
    async () => page(0, 2, ['events', 'convergence']),
    storage.outbox.pending.mock.callCount()
  )

  await outbox.open()
  await cycle()

  assert.strictEqual(storage.outbox.settle.mock.callCount(), 1)
  assert.deepStrictEqual(storage.outbox.settle.mock.calls[0].arguments[1], ['events'])
})

it('should not republish a destination that has landed while another has not', async () => {
  const other = destination('convergence')

  other.emit.mock.mockImplementation(async () => {
    throw new Error('the far broker is out')
  })

  outbox = new Outbox([emission, other], storage, atom, { interval: 1000, batch: BATCH })

  // the row comes back because it is still outstanding for `convergence`
  storage.outbox.pending.mock.mockImplementation(async () =>
    storage.outbox.pending.mock.callCount() > 2 ? [] : page(0, 1, ['convergence'])
  )

  await outbox.open()
  await cycle()
  await cycle()

  assert.strictEqual(emission.emit.mock.callCount(), 0)
  assert.strictEqual(other.emit.mock.callCount(), 2)
})

it('should keep pumping while one destination never answers', async () => {
  const stuck = destination('convergence')

  stuck.emit.mock.mockImplementation(async () => new Promise(() => {}))

  outbox = new Outbox([emission, stuck], storage, atom, { interval: 1000, batch: BATCH })

  storage.outbox.pending.mock.mockImplementation(async () =>
    storage.outbox.pending.mock.callCount() > 4 ? [] : page(0, 2, ['events', 'convergence'])
  )

  await outbox.open()
  await cycle()
  await cycle()

  // the events landed and were settled, though nothing came back from the other
  assert.ok(emission.emit.mock.callCount() >= 2)
  assert.ok(storage.outbox.settle.mock.callCount() >= 1)
  assert.deepStrictEqual(storage.outbox.settle.mock.calls[0].arguments[1], ['events'])
})

function destination (name) {
  return { name, emit: mock.fn(async () => undefined), link: mock.fn() }
}

it('should say it recovers nothing where it is never assigned a lane', async () => {
  const warn = mock.method(console, 'warn', () => undefined)

  atom.slots.mock.mockImplementation(() => null)

  await outbox.open()

  // a replica that has just started owns nothing for a moment, and that is not worth saying
  for (let i = 0; i < 8; i++) await cycle()

  assert.strictEqual(warn.mock.callCount(), 0)

  for (let i = 0; i < 3; i++) await cycle()

  assert.strictEqual(warn.mock.callCount(), 1, 'said at the tenth, not every cycle after')
  assert.match(warn.mock.calls[0].arguments[0], /recovers nothing/)
  assert.strictEqual(warn.mock.calls[0].arguments[1].cycles, 10)

  // and again every ten, so it is there to be found in a log read later
  for (let i = 0; i < 10; i++) await cycle()

  assert.strictEqual(warn.mock.callCount(), 2)
  assert.strictEqual(warn.mock.calls[1].arguments[1].cycles, 20)

  warn.mock.restore()
})

it('should say when a lane is assigned after all', async () => {
  const warn = mock.method(console, 'warn', () => undefined)
  const info = mock.method(console, 'info', () => undefined)

  atom.slots.mock.mockImplementation(() => null)

  await outbox.open()

  for (let i = 0; i < 11; i++) await cycle()

  assert.strictEqual(warn.mock.callCount(), 1)

  atom.slots.mock.mockImplementation(() => [0])

  await cycle()

  const said = info.mock.calls.map((call) => call.arguments[0])

  assert.ok(said.some((message) => /recovery resumed/.test(message)))

  warn.mock.restore()
  info.mock.restore()
})

it('should say nothing while it owns a lane', async () => {
  const warn = mock.method(console, 'warn', () => undefined)
  const info = mock.method(console, 'info', () => undefined)

  await outbox.open()

  for (let i = 0; i < 15; i++) await cycle()

  assert.strictEqual(warn.mock.callCount(), 0)

  // and nothing is said of recovery either: an outbox that was never in trouble has none
  const said = info.mock.calls.map((call) => call.arguments[0])

  assert.ok(!said.some((message) => /recover/.test(message)))

  warn.mock.restore()
  info.mock.restore()
})
