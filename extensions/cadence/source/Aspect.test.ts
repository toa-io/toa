import { it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'

import { trail } from '@toa.io/core'
import { Aspect } from './Aspect.js'
import type { Local } from './Local.js'

type Invoke = (endpoint: string, request: any) => Promise<unknown>

let metronome: Local & { invoke: ReturnType<typeof mock.fn<Invoke>> }
let aspect: Aspect

const options = { interval: 1000, overdue: null }

/** what the aspect asked the metronome to store */
const stored = (): any => metronome.invoke.mock.calls[0].arguments[1].input

beforeEach(() => {
  metronome = {
    invoke: mock.fn<Invoke>(async () => 'id'),
    link: mock.fn()
  } as any

  aspect = new Aspect(metronome)
})

it('should store the chain that asked for the call', async () => {
  const hops = ['default.orders.place', '~default.orders.sync']

  await trail.follow(hops, async () => aspect.invoke('delay', 'a.b.c', null, options))

  assert.deepStrictEqual(stored().trail, hops)
})

it('should store none where the caller detached the call', async () => {
  await trail.follow(['default.orders.place'], async () =>
    aspect.invoke('delay', 'a.b.c', null, { ...options, detached: true })
  )

  assert.ok(!('trail' in stored()))
})

it('should store none where there was no chain to store', async () => {
  await aspect.invoke('delay', 'a.b.c', null, options)

  assert.ok(!('trail' in stored()))
})

// the chain rides the row rather than the request, so a call that carries no request goes on
// carrying none — `features/cadence/delay.feature` states it
it('should leave a call that carries no request carrying none', async () => {
  await trail.follow(['default.orders.place'], async () =>
    aspect.invoke('delay', 'a.b.c', null, options)
  )

  assert.ok(!('request' in stored()))
})

it('should leave the request the caller handed over alone', async () => {
  const request = { input: { foo: 1 } }

  await trail.follow(['default.orders.place'], async () =>
    aspect.invoke('delay', 'a.b.c', request, options)
  )

  assert.deepStrictEqual(request, { input: { foo: 1 } })
  assert.deepStrictEqual(stored().request, { input: { foo: 1 } })
})
