import { it, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { Connector } from '@toa.io/core'
import { CHECK_TIMEOUT, HALT_GAP } from '@toa.io/definitions/extensions.introspection'

import { Halt } from './Halt.ts'
import type { Host } from './Factory.ts'
import type { Options } from '@toa.io/definitions/extensions.introspection'
import type { Receiver } from '@toa.io/core/types'

/**
 * The decision, without a deployment: what this proves is that a process asks the map one
 * question, acts on the answer alone, and obeys a stop only for the halt it is quiesced for.
 * That it asks the right question of a real map is what the scenarios are for.
 */

const QUIESCENCE = 30
const GRACE = 2
const SECONDS = 30
const SIGNAL = 'a3f1'

/** What this deployment lets a halt ask for. */
const OPTIONS = {
  samples: false,
  interval: 1,
  threshold: 64,
  ui: false,
  halt: true,
  duration: [30, 600],
  quiescence: [30, 300]
} as Options

class Remote extends Connector {
  public readonly calls: Array<{ endpoint: string; request: any }> = []
  public reply: any = { output: [] }

  public async invoke(endpoint: string, request: any): Promise<any> {
    this.calls.push({ endpoint, request })

    if (this.reply instanceof Error) throw this.reply

    return this.reply
  }
}

let halt: Halt
let receiver: Receiver
let edges: Remote
let signals: Remote
let quiesced: boolean
let cancelled: boolean
let stopped: number | null

beforeEach(async () => {
  mock.timers.enable({ apis: ['setTimeout'] })

  edges = new Remote()
  signals = new Remote()
  quiesced = false
  cancelled = false
  stopped = null

  const host = {
    receive: async (_: string, consumer: Receiver) => {
      receiver = consumer

      return new Connector()
    },
    remote: async (locator: { name: string }) => (locator.name === 'edges' ? edges : signals),
    quiesce: async () => {
      quiesced = true
    },
    cancel: async () => {
      cancelled = true
    },
    stop: (seconds: number) => {
      stopped = seconds
    }
  } as unknown as Host

  halt = new Halt(host, OPTIONS)

  await halt.connect()
  await settled()
})

afterEach(async () => {
  mock.timers.reset()

  await halt.disconnect()
})

it('should stop the deployment where nothing has been called', async () => {
  await signalled()

  assert.equal(quiesced, true)

  await decided()

  const [call] = signals.calls

  assert.equal(call.endpoint, 'create')
  assert.deepEqual(call.request.input, {
    type: 'stop',
    seconds: SECONDS,
    quiescence: QUIESCENCE,
    signal: SIGNAL
  })
  assert.equal(stopped, SECONDS)
})

it('should hold a halt to what the deployment allows', async () => {
  await signalled({ seconds: 5000, quiescence: 1 })
  await decided()

  const [call] = signals.calls

  // asked for more than this deployment allows, and stopped for what it does
  assert.equal(call.request.input.seconds, OPTIONS.duration[1])
  assert.equal(call.request.input.quiescence, OPTIONS.quiescence[0])
})

it('should ignore a halt that does not say how long to go quiet for', async () => {
  await received({ type: 'halt', id: SIGNAL, seconds: SECONDS, CREATED: Date.now() })

  assert.equal(quiesced, false)

  await decided()

  assert.equal(stopped, null)
  assert.equal(signals.calls.length, 0)
})

it('should read the map for this region, since the signal was written', async () => {
  await signalled({ CREATED: 1700 })
  await decided()

  const [call] = edges.calls

  assert.equal(call.endpoint, 'enumerate')
  assert.equal(call.request.query.criteria, 'UPDATED>1700;REGION==0')
  assert.equal(call.request.query.limit, 1)
})

it('should call a halt off where something has been called', async () => {
  edges.reply = { output: [{ id: 'an edge' }] }

  await signalled()
  await decided()

  assert.equal(signals.calls.length, 0)
  assert.equal(stopped, null)

  // and not before the grace is out: someone else may be about to call the stop
  assert.equal(cancelled, false)

  await graced()

  assert.equal(cancelled, true)
})

it('should call a halt off where the map cannot be read', async () => {
  edges.reply = new Error('the explorer is gone')

  await signalled()
  await decided()
  await graced()

  assert.equal(stopped, null)
  assert.equal(cancelled, true)
})

it('should call a halt off where the stop cannot be written', async () => {
  signals.reply = new Error('the explorer is gone')

  await signalled()
  await decided()
  await graced()

  assert.equal(stopped, null)
  assert.equal(cancelled, true)
})

it('should call a halt off where the stop went unanswered', async () => {
  // written, perhaps, and never acknowledged: taking that for a stop would go down alone
  signals.reply = new Promise(() => {})

  await signalled()
  await decided()
  await unanswered()
  await graced()

  assert.equal(stopped, null)
  assert.equal(cancelled, true)
})

it('should obey a stop another process called', async () => {
  edges.reply = { output: [{ id: 'an edge' }] }

  await signalled()
  await decided()
  await received({ type: 'stop', signal: SIGNAL })

  assert.equal(stopped, SECONDS)

  // the grace is over and there is nothing left to give up: it is going down
  await graced()

  assert.equal(cancelled, false)
})

it('should ignore a stop for a halt it is not quiesced for', async () => {
  edges.reply = { output: [{ id: 'an edge' }] }

  await signalled()
  await decided()
  await received({ type: 'stop', signal: 'another halt' })

  assert.equal(stopped, null)
})

it('should ignore a stop where it is quiesced for nothing', async () => {
  await received({ type: 'stop', signal: SIGNAL })

  assert.equal(stopped, null)
  assert.equal(quiesced, false)
})

it('should ignore a stop it has already given up on', async () => {
  edges.reply = { output: [{ id: 'an edge' }] }

  await signalled()
  await decided()
  await graced()
  await received({ type: 'stop', signal: SIGNAL })

  assert.equal(stopped, null)
})

it('should hold one halt at a time', async () => {
  edges.reply = { output: [{ id: 'an edge' }] }

  await signalled()
  await received({ type: 'halt', id: 'another halt', seconds: 60 })
  await decided()
  await received({ type: 'stop', signal: 'another halt' })

  assert.equal(stopped, null)
})

async function signalled(over: object = {}): Promise<void> {
  await received({
    type: 'halt',
    id: SIGNAL,
    seconds: SECONDS,
    quiescence: QUIESCENCE,
    grace: GRACE,
    CREATED: Date.now(),
    ...over
  })
}

async function received(signal: object): Promise<void> {
  await receiver.receive({ payload: signal } as any)

  await settled()
}

/** The quiescence and the gap are out, and the map has answered. */
async function decided(): Promise<void> {
  mock.timers.tick((QUIESCENCE + HALT_GAP) * 1000)

  await settled()
}

/** The deadline on a call the decision rests on. */
async function unanswered(): Promise<void> {
  mock.timers.tick(CHECK_TIMEOUT)

  await settled()
}

async function graced(): Promise<void> {
  mock.timers.tick(GRACE * 1000)

  await settled()
}

/** Whatever the decision is waiting on resolves on a microtask, and this is after them. */
async function settled(): Promise<void> {
  for (let i = 0; i < 8; i++) await new Promise((resolve) => setImmediate(resolve))
}
