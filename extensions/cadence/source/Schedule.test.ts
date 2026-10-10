import { it, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'

import { Schedule } from './Schedule.ts'
import type { Definition } from './Schedule.ts'
import type { Local } from './Local.ts'
import type { Locator } from '@toa.io/core'
import type { Request } from '@toa.io/core/types'

type Invoke = (endpoint: string, request: Request) => Promise<unknown>

interface Stored {
  query: { id: string }
  entity: {
    id: string
    lane: number
    due: number
    expires: number
    endpoint: string
    request: { input: { at: number } }
    trail?: string[]
  }
}

let local: Local & { invoke: ReturnType<typeof mock.fn<Invoke>> }

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const locator = { id: 'tea.pots' } as Locator

/** what a Schedule reaches for, with a lifecycle it can connect through */
const connector = (properties: object): any => ({
  ...properties,
  link: mock.fn(),
  connect: async () => {},
  disconnect: async () => {},
  halt: async () => {},
  restore: async () => {}
})

const create = (definition: Partial<Definition> = {}): Schedule =>
  new Schedule(
    { locator, endpoint: 'report', schedule: '0 12 * * *', zone: 'UTC', ...definition },
    local
  )

/** the timers a schedule arms are the only ones, so a tick is a jump and its microtasks */
const advance = async (ms: number): Promise<void> => {
  mock.timers.tick(ms)

  for (let i = 0; i < 20; i++) await Promise.resolve()
}

/** what was handed over, in the order it was */
const stored = (): Stored[] =>
  local.invoke.mock.calls.map((call) => call.arguments[1] as unknown as Stored)

const moments = (): number[] => stored().map(({ entity }) => entity.due)

beforeEach(() => {
  // midnight of the first of January 1970, so noon is twelve hours in
  mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 0 })

  local = connector({ invoke: mock.fn<Invoke>(async () => undefined) })
})

afterEach(() => {
  mock.timers.reset()
})

it('should hand over the next occurrence as it opens', async () => {
  const schedule = create()

  await schedule.connect()
  await advance(0)

  assert.equal(local.invoke.mock.callCount(), 1)
  assert.equal(local.invoke.mock.calls[0].arguments[0], 'ensure')

  const [{ entity }] = stored()

  assert.equal(entity.due, 12 * HOUR)
  assert.equal(entity.endpoint, 'tea.pots.report')
  assert.deepEqual(entity.request, { input: { at: 12 * HOUR } })

  await schedule.disconnect()
})

it('should store a row under an id of its own, and look for it by that id', async () => {
  const schedule = create()

  await schedule.connect()
  await advance(0)

  const [{ query, entity }] = stored()

  assert.match(entity.id, /^[0-9a-f]{32}$/)
  assert.equal(query.id, entity.id)

  await schedule.disconnect()
})

it('should give one occurrence one id, whoever hands it over', async () => {
  const one = create()
  const other = create()

  await one.connect()
  await other.connect()
  await advance(0)

  const [first, second] = stored()

  assert.equal(first.entity.id, second.entity.id)

  await one.disconnect()
  await other.disconnect()
})

it('should give the occurrences of two regions two ids', async () => {
  const one = create({ region: 0 })
  const other = create({ region: 1 })

  await one.connect()
  await other.connect()
  await advance(0)

  const [first, second] = stored()

  assert.notEqual(first.entity.id, second.entity.id)

  await one.disconnect()
  await other.disconnect()
})

it('should begin a chain of its own', async () => {
  const schedule = create()

  await schedule.connect()
  await advance(0)

  assert.equal(stored()[0].entity.trail, undefined)

  await schedule.disconnect()
})

it('should hand over the one after as each comes due', async () => {
  const schedule = create()

  await schedule.connect()
  await advance(0)
  await advance(12 * HOUR)
  await advance(DAY)

  assert.deepEqual(moments(), [12 * HOUR, DAY + 12 * HOUR, 2 * DAY + 12 * HOUR])

  await schedule.disconnect()
})

it('should hand over nothing before the one waited for comes due', async () => {
  const schedule = create()

  await schedule.connect()
  await advance(12 * HOUR - 1)

  assert.equal(local.invoke.mock.callCount(), 1)

  await schedule.disconnect()
})

it('should wait out a moment further off than one timer reaches', async () => {
  // the first of April, which is ninety days out and past what `setTimeout` takes
  const schedule = create({ schedule: '0 0 1 4 *' })

  await schedule.connect()

  // a mocked timer fires each instalment in turn, as a real one would over three months
  for (let day = 0; day < 89; day++) await advance(DAY)

  assert.deepEqual(moments(), [90 * DAY], 'nothing on the way is taken for the moment')

  await advance(DAY)

  assert.equal(local.invoke.mock.callCount(), 2)
  assert.equal(moments()[1], (90 + 365) * DAY)

  await schedule.disconnect()
})

it('should owe an occurrence until the next one is due', async () => {
  const schedule = create()

  await schedule.connect()
  await advance(0)

  assert.equal(stored()[0].entity.expires, DAY + 12 * HOUR)

  await schedule.disconnect()
})

it('should owe an occurrence for as long as the schedule states', async () => {
  const schedule = create({ overdue: 3600 })

  await schedule.connect()
  await advance(0)

  assert.equal(stored()[0].entity.expires, 12 * HOUR + HOUR)

  await schedule.disconnect()
})

it('should read the expression in its zone', async () => {
  // New York is five hours behind UTC in January
  const schedule = create({ zone: 'America/New_York' })

  await schedule.connect()
  await advance(0)

  assert.equal(moments()[0], 17 * HOUR)

  await schedule.disconnect()
})

it('should try again where the occurrence could not be stored', async () => {
  local.invoke.mock.mockImplementationOnce(async () => {
    throw new Error('away')
  })

  const schedule = create()

  await schedule.connect()
  await advance(0)
  await advance(5000)

  assert.deepEqual(moments(), [12 * HOUR, 12 * HOUR])

  await advance(5000)

  assert.equal(
    local.invoke.mock.callCount(),
    2,
    'one that was stored is not stored again'
  )

  await schedule.disconnect()
})

it('should give up an occurrence that came due unstored, for the one after it', async () => {
  local.invoke.mock.mockImplementation(async () => {
    throw new Error('away')
  })

  const schedule = create({ schedule: '* * * * *' })

  await schedule.connect()
  await advance(0)
  await advance(MINUTE)

  local.invoke.mock.resetCalls()

  await advance(5000)

  assert.deepEqual(moments(), [2 * MINUTE], 'the one that passed is not tried again')

  await schedule.disconnect()
})

it('should hand over nothing once closed', async () => {
  const schedule = create()

  await schedule.connect()
  await advance(0)
  await schedule.disconnect()
  await advance(2 * DAY)

  assert.equal(local.invoke.mock.callCount(), 1)
})

it('should go quiet when halted, and hand over the next one when restored', async () => {
  const schedule = create()

  await schedule.connect()
  await advance(0)
  await schedule.halt()
  await advance(2 * DAY)

  assert.equal(local.invoke.mock.callCount(), 1)

  await schedule.restore()
  await advance(0)

  assert.deepEqual(moments(), [12 * HOUR, 2 * DAY + 12 * HOUR])

  await schedule.disconnect()
})
