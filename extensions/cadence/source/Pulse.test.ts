import { it, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'

import { Pulse } from './Pulse.js'
import type { Local } from './Local.js'
import type { Locator, Request, atomicity } from '@toa.io/core'

type Invoke = (endpoint: string, request: Request) => Promise<unknown>
type Slots = (total: number) => number[] | null

let local: Local & { invoke: ReturnType<typeof mock.fn<Invoke>> }
let atom: atomicity.Atom & { slots: ReturnType<typeof mock.fn<Slots>> }

const SECOND = 1000
const HOUR = 3600
const DAY = 24 * HOUR

const locator = { id: 'tea.pots' } as Locator

const range = (total: number): number[] => Array.from({ length: total }, (_, index) => index)

/** what a Pulse reaches for, with a lifecycle it can connect through */
const connector = (properties: object): any =>
  ({ ...properties, link: mock.fn(), connect: async () => {}, disconnect: async () => {} })

const create = (cycle: number, intervals: number): Pulse =>
  new Pulse({ locator, endpoint: 'sweep', cycle, intervals }, local, atom)

/** the timers the tick arms are the only ones, so a tick is a jump and its microtasks */
const advance = async (ms: number): Promise<void> => {
  mock.timers.tick(ms)

  for (let i = 0; i < 20; i++) await Promise.resolve()
}

/** which interval each call was told it was for */
const intervals = (): number[] =>
  local.invoke.mock.calls.map((call) => (call.arguments[1].input as { i: number }).i)


beforeEach(() => {
  mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 0 })

  local = connector({ invoke: mock.fn<Invoke>(async () => undefined) })

  // one replica of one: every slot of the cycle is its own
  atom = connector({ slots: mock.fn<Slots>((total) => range(total)) })
})

afterEach(() => {
  mock.timers.reset()
})

it('should split a cycle into intervals', () => {
  const pulse = create(DAY, 24)

  assert.strictEqual(pulse.index(0), 0)
  assert.strictEqual(pulse.index(HOUR * SECOND - 1), 0)
  assert.strictEqual(pulse.index(HOUR * SECOND), 1)
  assert.strictEqual(pulse.index(23 * HOUR * SECOND), 23)
  assert.strictEqual(pulse.index(DAY * SECOND), 0)
})

it('should give every interval of a cycle that does not divide evenly', () => {
  const pulse = create(DAY, 7)
  const seen = new Set<number>()

  let now = 0

  for (let step = 0; step < 7; step++) {
    seen.add(pulse.index(now))
    now = pulse.boundary(now)
  }

  assert.deepStrictEqual([...seen].sort((a, b) => a - b), [0, 1, 2, 3, 4, 5, 6])
  assert.strictEqual(now, DAY * SECOND, 'seven boundaries land exactly on the next cycle')
})

it('should not drift across cycles', () => {
  const pulse = create(DAY, 7)

  let now = 0

  for (let step = 0; step < 7 * 100; step++) now = pulse.boundary(now)

  assert.strictEqual(now, 100 * DAY * SECOND)
})

it('should treat the interval it starts in as already handled', async () => {
  const pulse = create(DAY, 24)

  mock.timers.setTime(30 * 60 * SECOND) // half past the first hour

  await pulse.connect()
  await advance(0)

  assert.strictEqual(local.invoke.mock.callCount(), 0)
})

it('should call at the boundary', async () => {
  const pulse = create(DAY, 24)

  mock.timers.setTime(30 * 60 * SECOND)

  await pulse.connect()

  await advance(30 * 60 * SECOND - 1)
  assert.strictEqual(local.invoke.mock.callCount(), 0, 'not a millisecond early')

  await advance(1)
  assert.strictEqual(local.invoke.mock.callCount(), 1)
})

it('should tell the operation which interval it is', async () => {
  const pulse = create(DAY, 24)

  await pulse.connect()
  await advance(HOUR * SECOND)

  const [endpoint, request] = local.invoke.mock.calls[0].arguments

  assert.strictEqual(endpoint, 'sweep')
  assert.deepStrictEqual(request, { input: { n: 24, i: 1 } })
})

it('should call once per interval, and every interval of a cycle', async () => {
  const pulse = create(DAY, 24)

  await pulse.connect()

  for (let hour = 0; hour < 24; hour++) await advance(HOUR * SECOND)

  assert.deepStrictEqual(intervals(), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
    17, 18, 19, 20, 21, 22, 23, 0])
})

it('should keep calling a cycle it is not splitting', async () => {
  const pulse = create(HOUR, 1)

  await pulse.connect()

  for (let cycle = 0; cycle < 3; cycle++) await advance(HOUR * SECOND)

  assert.deepStrictEqual(intervals(), [0, 0, 0])
})

it('should not call while this replica owns nothing', async () => {
  atom.slots.mock.mockImplementation(() => null)

  const pulse = create(DAY, 24)

  await pulse.connect()
  await advance(HOUR * SECOND)

  assert.strictEqual(local.invoke.mock.callCount(), 0)
})

it('should not call an interval it acquired after the boundary', async () => {
  atom.slots.mock.mockImplementation(() => [])

  const pulse = create(DAY, 24)

  await pulse.connect()
  await advance(HOUR * SECOND) // the boundary passes, and the interval is not this one's

  atom.slots.mock.mockImplementation((total) => range(total))

  await advance(30 * 60 * SECOND) // and half an hour later it is

  assert.strictEqual(local.invoke.mock.callCount(), 0,
    'the replica that held it at the boundary is the only one that could have called')
})

it('should not call an interval another replica owns', async () => {
  atom.slots.mock.mockImplementation((total) =>
    range(total).filter((slot) => slot % 2 === 0))

  const pulse = create(DAY, 24)

  await pulse.connect()

  for (let hour = 0; hour < 24; hour++) await advance(HOUR * SECOND)

  const called = intervals()

  assert.strictEqual(called.length, 12)
  assert.ok(called.every((i) => i % 2 === 0))
})

it('should not start a call while the one before has not returned', async () => {
  let release: () => void = () => {}

  local.invoke.mock.mockImplementation(async () =>
    await new Promise<void>((resolve) => { release = resolve }))

  const pulse = create(DAY, 24)

  await pulse.connect()

  await advance(HOUR * SECOND)
  await advance(HOUR * SECOND)

  assert.strictEqual(local.invoke.mock.callCount(), 1)

  release()
  await advance(0) // the call settles, and only then is the pulse free again

  await advance(HOUR * SECOND)

  assert.strictEqual(local.invoke.mock.callCount(), 2)
})

it('should keep its cadence when a call raises', async () => {
  local.invoke.mock.mockImplementationOnce(async () => { throw new Error('nope') })

  const pulse = create(DAY, 24)

  await pulse.connect()

  await advance(HOUR * SECOND)
  await advance(HOUR * SECOND)

  assert.strictEqual(local.invoke.mock.callCount(), 2,
    'the interval that raised is skipped, and the next one is called')
})

it('should wait out a cycle longer than one timer in instalments', async () => {
  const YEAR = 365 * DAY

  const pulse = create(YEAR, 1)

  await pulse.connect()

  // more than `setTimeout` takes at once, and nothing is due yet
  await advance(2 ** 31)
  assert.strictEqual(local.invoke.mock.callCount(), 0)

  await advance(YEAR * SECOND)
  assert.strictEqual(local.invoke.mock.callCount(), 1)
})

it('should wait for a call in flight before closing', async () => {
  let release: () => void = () => {}
  let closed = false

  local.invoke.mock.mockImplementation(async () =>
    await new Promise<void>((resolve) => { release = resolve }))

  const pulse = create(DAY, 24)

  await pulse.connect()
  await advance(HOUR * SECOND)

  const closing = pulse.disconnect().then(() => { closed = true })

  await advance(0)
  assert.strictEqual(closed, false, 'the call is still running')

  release()
  await advance(0)
  await closing

  assert.strictEqual(closed, true)
})

it('should stop calling once closed', async () => {
  const pulse = create(DAY, 24)

  await pulse.connect()
  await pulse.disconnect()
  await advance(HOUR * SECOND)

  assert.strictEqual(local.invoke.mock.callCount(), 0)
})
