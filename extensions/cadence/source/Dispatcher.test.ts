import { it, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'

import { Dispatcher } from './Dispatcher.js'
import { LANES } from './const.js'
import type { Local } from './Local.js'
import type { atomicity } from '@toa.io/core'

type Invoke = (endpoint: string, request: any) => Promise<unknown>
type Slots = (total: number) => number[] | null
type Listener = () => void

const INTERVAL = 100

let metronome: Local & { invoke: ReturnType<typeof mock.fn<Invoke>> }
let target: Local & { invoke: ReturnType<typeof mock.fn<Invoke>> }
let atom: atomicity.Atom & { slots: ReturnType<typeof mock.fn<Slots>> }
let listeners: Listener[]
let rows: Row[]

interface Row {
  id: string
  lane: number
  due: number
  endpoint: string
  request: object | null
}

const row = (id: string, due: number, lane = 0): Row =>
  ({ id, lane, due, endpoint: 'tea.pots.transit', request: { input: { id } } })

const connector = (properties: object): any =>
  ({ ...properties, link: mock.fn(), connect: async () => {}, disconnect: async () => {} })

const advance = async (ms: number): Promise<void> => {
  mock.timers.tick(ms)

  for (let i = 0; i < 30; i++) await Promise.resolve()
}

/** the query one scan made */
const reads = (): any[] => metronome.invoke.mock.calls
  .filter((call) => call.arguments[0] === 'enumerate')
  .map((call) => call.arguments[1].query)

/** what has been settled, flattened */
const settled = (): string[] => metronome.invoke.mock.calls
  .filter((call) => call.arguments[0] === 'settle')
  .flatMap((call) => call.arguments[1].query.ids as string[])

const range = (total: number): number[] => Array.from({ length: total }, (_, i) => i)

const create = (): Dispatcher =>
  new Dispatcher(metronome, () => target, atom)


beforeEach(() => {
  process.env.TOA_CADENCE_DISCRETENESS = String(INTERVAL)
  mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'], now: 0 })

  rows = []
  listeners = []

  metronome = connector({
    invoke: mock.fn<Invoke>(async (endpoint: string) => endpoint === 'enumerate' ? rows : null)
  })

  target = connector({ invoke: mock.fn<Invoke>(async () => null) })

  atom = connector({
    slots: mock.fn<Slots>((total) => range(total)),
    onassigned: (listener: Listener) => {
      listeners.push(listener)
      listener()

      return () => { listeners = listeners.filter((one) => one !== listener) }
    }
  })
})

afterEach(() => {
  mock.timers.reset()
  delete process.env.TOA_CADENCE_DISCRETENESS
})

it('should read what is due within the interval, in the lanes it owns', async () => {
  const dispatcher = create()

  await dispatcher.connect()
  await advance(INTERVAL)

  const [first] = reads()

  // the first scan is the one the subscription runs as it is added, at time zero
  assert.strictEqual(first.criteria,
    `lane=in=(${range(LANES).join(',')});due<${INTERVAL};expires>0`)
  assert.deepStrictEqual(first.sort, ['due:asc'])
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

  assert.strictEqual(target.invoke.mock.callCount(), 1,
    'a scan reads what is overdue along with what is coming')
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
  target.invoke.mock.mockImplementation(async () =>
    await new Promise<void>((resolve) => { release = resolve }))

  const dispatcher = create()

  await dispatcher.connect()
  await advance(10) // the call goes out, and does not come back

  assert.strictEqual(target.invoke.mock.callCount(), 1)

  // a scan while it is in flight reads the row again, and settles what it thinks was called
  await advance(INTERVAL)

  // far enough for anything that scan armed to have fired
  await advance(INTERVAL)

  assert.strictEqual(target.invoke.mock.callCount(), 1, 'and does not send it a second time')

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
  target.invoke.mock.mockImplementationOnce(async () => { throw new Error('nope') })

  const dispatcher = create()

  await dispatcher.connect()
  await advance(20)

  assert.strictEqual(target.invoke.mock.callCount(), 2, 'the one after it is still called')

  rows = []
  await advance(INTERVAL)

  assert.deepStrictEqual(settled().sort(), ['a', 'b'], 'and the one that failed is settled')
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

  assert.strictEqual(target.invoke.mock.callCount(), 0, 'lane 7 is somebody else\'s now')
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

  assert.strictEqual(target.invoke.mock.callCount(), 0,
    'whoever holds lane 7 now is the one to make that call')
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
