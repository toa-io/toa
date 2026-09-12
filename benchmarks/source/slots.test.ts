import { it, describe } from 'node:test'
import assert from 'node:assert/strict'

import { assign, SLOTS } from './slots.ts'

describe('assign', () => {
  it('should put the base in the first slot in an even block', () => {
    assert.deepEqual(assign(0), { base: SLOTS.a, head: SLOTS.b })
  })

  it('should swap the slots in an odd block', () => {
    // whatever makes one slot cost more — its context, its ports, booting first — falls on each
    // revision in as many blocks as on the other
    assert.deepEqual(assign(1), { base: SLOTS.b, head: SLOTS.a })
    assert.deepEqual(assign(2), { base: SLOTS.a, head: SLOTS.b })
  })
})

describe('SLOTS', () => {
  it('should differ in names only', () => {
    // the context goes into a reply header, so its length is part of every reply
    assert.equal(SLOTS.a.context.length, SLOTS.b.context.length)
  })

  it('should bind ports of the block Toa reserves for them', () => {
    const ports = Object.values(SLOTS).flatMap(({ ports }) => [ports.gateway, ports.probe, ...ports.ready])

    assert.equal(new Set(ports).size, ports.length)
    assert.ok(ports.every((port) => port >= 31090 && port <= 31099), JSON.stringify(ports))
  })
})
