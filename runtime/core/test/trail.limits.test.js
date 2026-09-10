import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import * as trail from '../source/trail.js'

// what a deployment states, and what a scenario sets before it composes
process.env.TOA_TRAIL_REPEATS = '0'
process.env.TOA_TRAIL_DEPTH = '4'

const limits = trail.limits()
const hop = 'default.orders.place'

describe('the limits', () => {
  it('should be what the environment says', () => {
    assert.deepEqual(limits, { repeats: 0, depth: 4 })
  })

  it('should refuse nothing where the rule is switched off', () => {
    const hops = Array.from({ length: 64 }, () => hop)

    // sixty-four of one hop, and neither rule applies: the chain is stamped and carried on
    assert.doesNotThrow(() => trail.extend(hops, hop, limits))
  })

  it('should bound the chain even so', () => {
    const hops = Array.from({ length: 64 }, () => hop)

    // what a cycle would otherwise grow without end, and what a peer could otherwise send
    assert.equal(trail.extend(hops, hop, limits).length, 5)
  })

  it('should fall back where what is set is not a number', () => {
    process.env.TOA_TRAIL_REPEATS = 'often'

    assert.equal(trail.limits().repeats, 3)
  })
})
