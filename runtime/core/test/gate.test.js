import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import { Connector } from '../source/connector.js'
import { Gate } from '../source/gate.js'
import * as fixtures from './connector.fixtures.js'

let sequence
let built

beforeEach(() => {
  sequence = []
  built = 0
})

/** A gate over one connector, counting how many times it was asked for one. */
function gate(label = 'a') {
  return new Gate(async () => {
    built++

    return new fixtures.TestConnector(label, sequence)
  })
}

describe('Gate', () => {
  it('should connect what it holds', async () => {
    const g = gate()

    await g.connect()

    assert.deepStrictEqual(sequence, ['+a'])
    assert.equal(g.holding(), true)
  })

  it('should close what it holds gracefully while it is connected itself', async () => {
    const g = gate()

    await g.connect()
    await g.down()

    // `-a` rather than `*a` alone: the subtree was closed, not interrupted
    assert.deepStrictEqual(sequence, ['+a', '-a', '*a'])
    assert.equal(g.connected, true)
    assert.equal(g.holding(), false)
  })

  it('should close what it holds with a live dependant above it', async () => {
    const g = gate()
    const above = new fixtures.TestConnector('p', sequence)

    above.depends(g)

    await above.connect()
    await g.down()

    assert.deepStrictEqual(sequence, ['+a', '+p', '-a', '*a'])
    assert.equal(above.connected, true)
  })

  it('should build again rather than reconnect', async () => {
    const g = gate()

    await g.connect()
    await g.down()
    await g.up()

    assert.equal(built, 2)
    assert.deepStrictEqual(sequence, ['+a', '-a', '*a', '+a'])
  })

  it('should hold a different connector after a rebuild', async () => {
    const held = []
    const g = new Gate(async () => {
      const connector = new Connector()

      held.push(connector)

      return connector
    })

    await g.connect()
    await g.down()
    await g.up()

    assert.equal(held.length, 2)
    assert.notEqual(held[0], held[1])
  })

  it('should do nothing when taken down twice', async () => {
    const g = gate()

    await g.connect()
    await g.down()
    await g.down()

    assert.deepStrictEqual(sequence, ['+a', '-a', '*a'])
  })

  it('should do nothing when brought up twice', async () => {
    const g = gate()

    await g.connect()
    await g.up()

    assert.equal(built, 1)
  })

  it('should take what it holds down on its own disconnection', async () => {
    const g = gate()

    await g.connect()
    await g.disconnect()

    assert.deepStrictEqual(sequence, ['+a', '-a', '*a'])
    assert.equal(g.connected, false)
  })

  it('should hold nothing when the build throws', async () => {
    const g = new Gate(async () => {
      throw new Error('nope')
    })

    await assert.rejects(g.connect(), /nope/)
    assert.equal(g.holding(), false)
  })

  it('should hold nothing when what it built fails to connect', async () => {
    const g = new Gate(async () => new fixtures.FailingConnector())

    await assert.rejects(g.connect(), /FailingConnector/)
    assert.equal(g.holding(), false)
  })

  it('should report what it holds in the debug tree', async () => {
    const g = gate()

    await g.connect()

    const node = g.debug()

    assert.equal(Object.keys(node[g.id]).length, 2)
  })
})
