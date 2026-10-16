import { it, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'

import { exceptions } from '@toa.io/core'
import { Scheduler } from './Scheduler.ts'
import type { Local } from './Local.ts'

type Invoke = (endpoint: string, request: any) => Promise<unknown>

let metronome: Local & { invoke: ReturnType<typeof mock.fn<Invoke>> }
let scheduler: Scheduler

/** what the metronome was found to hold: nothing, a live row, or a tombstone */
let found: object | null

// 2026-10-12 is a Monday
const NOW = Date.UTC(2026, 9, 12, 8)
const NINE = Date.UTC(2026, 9, 12, 9)

const calls = (endpoint: string): any[] =>
  metronome.invoke.mock.calls
    .filter((call) => call.arguments[0] === endpoint)
    .map((call) => call.arguments[1])

const schedule = async (...args: unknown[]): Promise<string> =>
  (await scheduler.invoke('schedule', ...args)) as string

beforeEach(() => {
  mock.timers.enable({ apis: ['Date'], now: NOW })

  found = null

  metronome = {
    invoke: mock.fn<Invoke>(async (endpoint) => (endpoint === 'observe' ? found : null)),
    link: mock.fn()
  } as any

  scheduler = new Scheduler(metronome)
})

afterEach(() => {
  mock.timers.reset()
})

it('should store one row waiting for the first occurrence', async () => {
  const id = await schedule('a.b.c', { input: { pot: 1 } }, '0 9 * * 1')
  const [{ query, entity }] = calls('ensure')

  assert.deepStrictEqual(query, { id })
  assert.equal(entity.id, id)
  assert.equal(entity.due, NINE)
  assert.equal(entity.schedule, '0 9 * * 1')
  assert.equal(entity.zone, 'UTC')
  assert.equal(entity.expires, Number.MAX_SAFE_INTEGER)
  assert.deepStrictEqual(entity.request, { input: { pot: 1 } })
  assert.ok(!('trail' in entity), 'every call begins a chain of its own')
})

it('should read the expression in its zone, and keep its bound and its end', async () => {
  const expires = NINE + 30 * 24 * 3600 * 1000

  await schedule('a.b.c', null, {
    schedule: '0 9 * * 1',
    zone: 'Europe/Berlin',
    overdue: 60_000,
    expires
  })

  const [{ entity }] = calls('ensure')

  // nine in Berlin is seven in UTC, which is already past on Monday the twelfth
  assert.equal(entity.due, Date.UTC(2026, 9, 19, 7))
  assert.equal(entity.overdue, 60_000)
  assert.equal(entity.expires, expires)
  assert.ok(!('request' in entity))
})

it('should be the same schedule however often it is handed over', async () => {
  const first = await schedule('a.b.c', { input: { x: 1, y: 2 } }, '0 9 * * 1')
  const second = await schedule('a.b.c', { input: { y: 2, x: 1 } }, '0 9 * * 1')

  assert.equal(first, second)
})

it('should be another schedule for another request, calendar or end', async () => {
  const ids = new Set([
    await schedule('a.b.c', { input: { x: 1 } }, '0 9 * * 1'),
    await schedule('a.b.c', { input: { x: 2 } }, '0 9 * * 1'),
    await schedule('a.b.c', { input: { x: 1 } }, '0 9 * * 2'),
    await schedule(
      'a.b.c',
      { input: { x: 1 } },
      { schedule: '0 9 * * 1', zone: 'Asia/Tokyo' }
    ),
    await schedule(
      'a.b.c',
      { input: { x: 1 } },
      { schedule: '0 9 * * 1', expires: 2 * NOW }
    )
  ])

  assert.equal(ids.size, 5)
})

it('should name a component without a namespace as delay does', async () => {
  assert.equal(
    await schedule('b.c', null, '0 9 * * 1'),
    await schedule('default.b.c', null, '0 9 * * 1')
  )
})

it('should revive a schedule that was cancelled', async () => {
  found = { DELETED: NOW - 1000 }

  const id = await schedule('a.b.c', null, '0 9 * * 1')
  const [{ query, input }] = calls('resume')

  assert.deepStrictEqual(query, { id, deleted: true })
  assert.equal(input.due, NINE)
  assert.equal(calls('ensure').length, 0)
})

it('should revive a schedule cancelled between the read and the write', async () => {
  metronome.invoke.mock.mockImplementation(async (endpoint) => {
    if (endpoint === 'ensure')
      throw new exceptions.DuplicateException('cadence_metronome')

    return null
  })

  await schedule('a.b.c', null, '0 9 * * 1')

  assert.equal(calls('resume').length, 1)
})

it('should refuse what it cannot schedule, and store nothing', async () => {
  const refused = [
    ['a.b.c', null, 'every day'],
    ['a.b.c', null, { schedule: '0 9 * * 1', zone: 'Mars/Olympus' }],
    ['a.b.c', null, { schedule: '0 9 * * 1', expires: NOW - 1 }],
    ['a.b.c', null, { schedule: '0 9 * * 1', expires: NINE - 1 }],
    ['a.b.c', null, { schedule: '0 9 * * 1', overdue: -1 }],
    ['a.b.c', null, {}],
    ['a.b.c', { instance: 'x' }, '0 9 * * 1'],
    ['a.b.c', { input: 'hello' }, '0 9 * * 1'],
    ['a.b.c', { input: [1] }, '0 9 * * 1'],
    ['a.b.c', { input: { at: 1 } }, '0 9 * * 1']
  ]

  for (const args of refused)
    await assert.rejects(
      schedule(...args),
      exceptions.RequestContractException,
      JSON.stringify(args)
    )

  assert.equal(metronome.invoke.mock.callCount(), 0)
})

it('should cancel by tombstoning the row', async () => {
  await scheduler.invoke('cancel', 'id')

  assert.deepStrictEqual(calls('terminate'), [{ query: { id: 'id' }, input: null }])
})
