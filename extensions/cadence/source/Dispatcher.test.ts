import { it, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { console } from 'openspan'

import { Dispatcher } from './Dispatcher.js'
import { BATCH, LANES } from '@toa.io/definitions/extensions.cadence'
import type { Local } from './Local.js'
import type { atomicity } from '@toa.io/core/types'

type Invoke = (endpoint: string, request: any) => Promise<unknown>
type Slots = (total: number) => number[] | null
type Listener = () => void

const INTERVAL = 100

let metronome: Local & { invoke: ReturnType<typeof mock.fn<Invoke>> }
let target: Local & { invoke: ReturnType<typeof mock.fn<Invoke>> }
let atom: atomicity.Atom & { slots: ReturnType<typeof mock.fn<Slots>> }
let listeners: Listener[]
let rows: Row[]
let warn: ReturnType<typeof mock.method<typeof console, 'warn'>>

interface Row {
  id: string
  lane: number
  due: number
  expires: number
  endpoint: string
  request: object | null
}

/** `expires` defaults to no bound at all, which is what `overdue: null` writes */
const row = (
  id: string,
  due: number,
  lane = 0,
  expires = Number.MAX_SAFE_INTEGER
): Row => ({
  id,
  lane,
  due,
  expires,
  endpoint: 'tea.pots.transit',
  request: { input: { id } }
})

const connector = (properties: object): any => ({
  ...properties,
  link: mock.fn(),
  connect: async () => {},
  disconnect: async () => {}
})

const advance = async (ms: number): Promise<void> => {
  mock.timers.tick(ms)

  for (let i = 0; i < 30; i++) await Promise.resolve()
}

/** the query one scan made */
const reads = (): any[] =>
  metronome.invoke.mock.calls
    .filter((call) => call.arguments[0] === 'enumerate')
    .map((call) => call.arguments[1].query)

/** what has been settled, flattened */
const settled = (): string[] =>
  metronome.invoke.mock.calls
    .filter((call) => call.arguments[0] === 'settle')
    .flatMap((call) => call.arguments[1].query.ids as string[])

const range = (total: number): number[] => Array.from({ length: total }, (_, i) => i)

const create = (): Dispatcher => new Dispatcher(metronome, () => target, atom)

beforeEach(() => {
  process.env.TOA_CADENCE_DISCRETENESS = String(INTERVAL)
  mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'], now: 0 })

  rows = []
  listeners = []
  warn = mock.method(console, 'warn', () => undefined)

  metronome = connector({
    invoke: mock.fn<Invoke>(async (endpoint: string) =>
      endpoint === 'enumerate' ? rows : null
    )
  })

  target = connector({ invoke: mock.fn<Invoke>(async () => null) })

  atom = connector({
    slots: mock.fn<Slots>((total) => range(total)),
    onassigned: (listener: Listener) => {
      listeners.push(listener)
      listener()

      return () => {
        listeners = listeners.filter((one) => one !== listener)
      }
    }
  })
})

afterEach(() => {
  mock.timers.reset()
  warn.mock.restore()
  delete process.env.TOA_CADENCE_DISCRETENESS
})

it('should read two intervals ahead, in the lanes it owns', async () => {
  const dispatcher = create()

  await dispatcher.connect()
  await advance(INTERVAL)

  const [first] = reads()

  // the first scan is the one the subscription runs as it is added, at time zero. Two
  // intervals, so that consecutive passes overlap; and no bound on `expires`, because an
  // expired row is settled rather than left where nothing will ever read it again
  assert.strictEqual(
    first.criteria,
    `lane=in=(${range(LANES).join(',')});due<${2 * INTERVAL}`
  )
  assert.deepStrictEqual(first.sort, ['due:asc'])
})

it('should reach past the next pass, so a row on its horizon is armed before it is due', async () => {
  rows = [row('a', INTERVAL + 10)]

  const dispatcher = create()

  await dispatcher.connect()

  // gone from the store before the next pass, so nothing but the scan at time zero can have
  // armed it — which is what reaching two intervals rather than one is for
  rows = []

  await advance(INTERVAL)

  assert.strictEqual(target.invoke.mock.callCount(), 0, 'armed, not yet due')

  await advance(10)

  assert.strictEqual(target.invoke.mock.callCount(), 1, 'and called at its due time')
})

it('should settle an expired row without calling it', async () => {
  rows = [row('a', -10_000, 0, -5_000)]

  const dispatcher = create()

  await dispatcher.connect()
  await advance(0)

  assert.strictEqual(
    target.invoke.mock.callCount(),
    0,
    'past the bound its caller gave it'
  )

  rows = []
  await advance(INTERVAL)

  assert.deepStrictEqual(
    settled(),
    ['a'],
    'and settled, or nothing would ever read it again'
  )
})

it('should settle what it has called even while it owns nothing', async () => {
  rows = [row('a', 10)]

  const dispatcher = create()

  await dispatcher.connect()
  await advance(10)

  assert.strictEqual(target.invoke.mock.callCount(), 1)

  // the lane is somebody else's now, and a row left live is one they call again
  rows = []
  atom.slots.mock.mockImplementation(() => null)

  await advance(INTERVAL)

  assert.deepStrictEqual(settled(), ['a'])
})

it('should say so when a scan fills its batch', async () => {
  rows = Array.from({ length: BATCH }, (_, i) => row(String(i), 10_000))

  const dispatcher = create()

  await dispatcher.connect()
  await advance(0)

  const warned = warn.mock.calls.map((call) => call.arguments[0] as string)

  assert.ok(
    warned.some((message) => message.includes('filled its batch')),
    'the horizon is truncated and the rest arrive late'
  )
})

it('should say so when a pass is skipped because the one before it is still running', async () => {
  let release: () => void = () => {}

  metronome.invoke.mock.mockImplementation(async (endpoint: string) => {
    if (endpoint !== 'enumerate') return null

    await new Promise<void>((resolve) => {
      release = resolve
    })

    return []
  })

  const dispatcher = create()

  await dispatcher.connect()
  await advance(0) // the scan at time zero, which does not come back

  await advance(INTERVAL)

  const warned = warn.mock.calls.map((call) => call.arguments[0] as string)

  assert.ok(
    warned.some((message) => message.includes('has not returned')),
    'a dispatcher that stops dispatching says so'
  )

  release()
  await advance(0)
})

it('should read nothing while it owns nothing', async () => {
  atom.slots.mock.mockImplementation(() => null)

  const dispatcher = create()

  await dispatcher.connect()
  await advance(INTERVAL * 3)

  assert.strictEqual(reads().length, 0)
})

it('should call at the due time and not before', async () => {
  rows = [row('a', 60)]

  const dispatcher = create()

  await dispatcher.connect()
  await advance(1)

  assert.strictEqual(target.invoke.mock.callCount(), 0, 'armed, not called')

  await advance(60)

  assert.strictEqual(target.invoke.mock.callCount(), 1)

  const [endpoint, request] = target.invoke.mock.calls[0].arguments

  assert.strictEqual(endpoint, 'transit')
  assert.deepStrictEqual(request, { input: { id: 'a' }, task: true })
})

it('should call one whose time has already passed at once', async () => {
  rows = [row('a', -10_000)]

  const dispatcher = create()

  await dispatcher.connect()
  await advance(0)

  assert.strictEqual(
    target.invoke.mock.callCount(),
    1,
    'a scan reads what is overdue along with what is coming'
  )
})

it('should arm a row once, however often a scan reads it', async () => {
  rows = [row('a', 10_000)]

  const dispatcher = create()

  await dispatcher.connect()

  // one interval at a time: a scan is one at a time, and a single jump would find the first
  // still running and skip the rest
  for (let cycle = 0; cycle < 4; cycle++) await advance(INTERVAL)

  assert.ok(reads().length >= 3, 'it kept scanning')
  assert.strictEqual(target.invoke.mock.callCount(), 0, 'and armed it only once')
})

it('should not arm a row again while its call is in flight', async () => {
  let release: () => void = () => {}

  rows = [row('a', 10)]
  target.invoke.mock.mockImplementation(
    async () =>
      await new Promise<void>((resolve) => {
        release = resolve
      })
  )

  const dispatcher = create()

  await dispatcher.connect()
  await advance(10) // the call goes out, and does not come back

  assert.strictEqual(target.invoke.mock.callCount(), 1)

  // a scan while it is in flight reads the row again, and settles what it thinks was called
  await advance(INTERVAL)

  // far enough for anything that scan armed to have fired
  await advance(INTERVAL)

  assert.strictEqual(
    target.invoke.mock.callCount(),
    1,
    'and does not send it a second time'
  )

  release()
  await advance(0)
})

it('should settle what it has called', async () => {
  rows = [row('a', 10)]

  const dispatcher = create()

  await dispatcher.connect()
  await advance(10)

  assert.strictEqual(target.invoke.mock.callCount(), 1)

  rows = []
  await advance(INTERVAL)

  assert.deepStrictEqual(settled(), ['a'])
})

it('should settle a row whose call failed, and keep dispatching', async () => {
  rows = [row('a', 10), row('b', 20)]
  target.invoke.mock.mockImplementationOnce(async () => {
    throw new Error('nope')
  })

  const dispatcher = create()

  await dispatcher.connect()
  await advance(20)

  assert.strictEqual(
    target.invoke.mock.callCount(),
    2,
    'the one after it is still called'
  )

  rows = []
  await advance(INTERVAL)

  assert.deepStrictEqual(
    settled().sort(),
    ['a', 'b'],
    'and the one that failed is settled'
  )
})

it('should drop timers for lanes it no longer owns', async () => {
  rows = [row('a', 10_000, 7)]

  const dispatcher = create()

  await dispatcher.connect()
  await advance(INTERVAL)

  rows = []
  atom.slots.mock.mockImplementation(() => [0])

  for (const listener of listeners) listener()

  await advance(20_000)

  assert.strictEqual(target.invoke.mock.callCount(), 0, "lane 7 is somebody else's now")
})

it('should drop everything it holds when it owns nothing', async () => {
  rows = [row('a', 10_000, 7)]

  const dispatcher = create()

  await dispatcher.connect()
  await advance(INTERVAL)

  rows = []
  atom.slots.mock.mockImplementation(() => null)

  for (const listener of listeners) listener()

  await advance(20_000)

  assert.strictEqual(
    target.invoke.mock.callCount(),
    0,
    'whoever holds lane 7 now is the one to make that call'
  )
})

it('should scan at once when what it owns changes', async () => {
  atom.slots.mock.mockImplementation(() => null)

  const dispatcher = create()

  await dispatcher.connect()
  await advance(0)

  assert.strictEqual(reads().length, 0)

  atom.slots.mock.mockImplementation((total) => range(total))

  for (const listener of listeners) listener()

  await advance(0)

  assert.strictEqual(reads().length, 1, 'without waiting out an interval')
})

it('should give up a row a scan stops reading, so a cancellation still lands', async () => {
  rows = [row('a', INTERVAL + 50)]

  const dispatcher = create()

  await dispatcher.connect()
  await advance(1)

  // cancelled: the row is tombstoned, so the next scan does not read it
  rows = []

  await advance(INTERVAL) // the scan that finds it gone
  await advance(INTERVAL) // and past when it would have been called

  assert.strictEqual(
    target.invoke.mock.callCount(),
    0,
    'the timer was given up with the row'
  )
})

it('should keep a row the scan still reads', async () => {
  rows = [row('a', INTERVAL + 50)]

  const dispatcher = create()

  await dispatcher.connect()
  await advance(INTERVAL)

  assert.strictEqual(target.invoke.mock.callCount(), 0, 'not yet due')

  await advance(50)

  assert.strictEqual(target.invoke.mock.callCount(), 1)
})

it('should not give up a row when the batch was filled', async () => {
  const held = row('held', INTERVAL + 50)

  rows = [held, ...Array.from({ length: BATCH - 1 }, (_, i) => row('b' + i, 10_000))]

  const dispatcher = create()

  await dispatcher.connect()
  await advance(1)

  // a full batch is a read that was cut short, so absence from the next one is not a
  // cancellation — these are rows it never reached, not rows nobody owes
  rows = Array.from({ length: BATCH }, (_, i) => row('c' + i, 20_000))

  await advance(INTERVAL)
  await advance(50)

  const called = target.invoke.mock.calls.map((call) => call.arguments[1].input.id)

  assert.deepStrictEqual(called, ['held'], 'the row it armed is still called')
})
