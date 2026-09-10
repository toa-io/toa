import { describe, it, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { Connector } from '@toa.io/core'
import { environment, timeout } from '@toa.io/generic'

/*
 * The probe binds a port and the halt listener reaches a broker, and this suite is about
 * neither: what it exercises is the workload's own lifecycle, so the extensions that would
 * contribute a resident are off. `TOA_INTROSPECTION` is unset, so introspection's is `null`.
 */
environment.set('TOA_TELEMETRY_READY', 'false')
environment.set('TOA_HALT_LEAD', '1')
environment.set('TOA_HALT_BACKOFF', '1')

let Workload

before(async () => {
  ;({ Workload } = await import('./workload.js'))
})

let sequence

beforeEach(() => {
  sequence = []
})

class TestConnector extends Connector {
  #label

  constructor(label) {
    super()
    this.#label = label
  }

  async open() {
    sequence.push(`+${this.#label}`)
  }

  async close() {
    sequence.push(`-${this.#label}`)
  }

  async dispose() {
    sequence.push(`*${this.#label}`)
  }
}

/** Waits for a condition the halt reaches on its own timers. */
async function until(condition, limit = 2000) {
  const deadline = Date.now() + limit

  while (Date.now() < deadline) {
    if (condition()) return

    await timeout(5)
  }

  assert.fail('condition was not reached')
}

describe('Workload', () => {
  it('should connect what the command built', async () => {
    const workload = new Workload(async () => new TestConnector('a'))

    await workload.connect()

    assert.deepStrictEqual(sequence, ['+a'])

    await workload.disconnect()
  })

  it('should take down what a gate holds, and leave the rest connected', async () => {
    let built = 0

    const workload = new Workload(async (workload) => {
      const gate = workload.gate(async () => {
        built++

        return new TestConnector('gated')
      })
      const root = new Connector()

      root.depends([gate, new TestConnector('above')])

      return root
    })

    await workload.connect()

    assert.deepStrictEqual(sequence.sort(), ['+above', '+gated'])

    sequence = []

    // a hundredth of a second, so the window is over before the assertions are
    workload.halt(0.01)

    // `-gated` and not `-above`: what a gate holds is closed, and nothing else is
    await until(() => sequence.includes('*gated'))

    assert.deepStrictEqual(sequence, ['-gated', '*gated'])

    await until(() => built === 2)

    assert.deepStrictEqual(sequence, ['-gated', '*gated', '+gated'])

    await workload.disconnect()
  })

  it('should build again rather than reconnect', async () => {
    const held = []

    const workload = new Workload(async (workload) =>
      workload.gate(async () => {
        const connector = new TestConnector('a')

        held.push(connector)

        return connector
      })
    )

    await workload.connect()

    workload.halt(0.01)

    await until(() => held.length === 2)

    assert.notEqual(held[0], held[1])

    await workload.disconnect()
  })

  it('should return before anything is closed', async () => {
    const workload = new Workload(async (workload) =>
      workload.gate(async () => new TestConnector('a'))
    )

    await workload.connect()

    sequence = []
    workload.halt(0.01)

    // the caller is a consumer callback: the teardown must not have begun under it
    assert.deepStrictEqual(sequence, [])

    await until(() => sequence.includes('+a'))
    await workload.disconnect()
  })

  it('should make one cycle of two overlapping halts', async () => {
    let built = 0

    const workload = new Workload(async (workload) =>
      workload.gate(async () => {
        built++

        return new TestConnector('a')
      })
    )

    await workload.connect()

    workload.halt(0.01)
    workload.halt(0.01)

    await until(() => built === 2)
    await timeout(50)

    assert.equal(built, 2)

    await workload.disconnect()
  })

  it('should not halt what is not connected', async () => {
    const workload = new Workload(async () => new TestConnector('a'))

    workload.halt(0.01)

    await timeout(30)

    assert.deepStrictEqual(sequence, [])
  })

  it('should take the gates down on its own disconnection', async () => {
    const workload = new Workload(async (workload) =>
      workload.gate(async () => new TestConnector('a'))
    )

    await workload.connect()
    await workload.disconnect()

    assert.deepStrictEqual(sequence, ['+a', '-a', '*a'])
  })
})
