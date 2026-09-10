import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import * as trail from '../source/trail.js'
import { codes } from '../source/exceptions.js'

const hop = 'default.orders.place'
const limits = { repeats: 3, depth: 32 }

/** as `Component` calls it: with the limits it read when it was built */
const extend = (inbound, hop) => trail.extend(inbound, hop, limits)

describe('extend', () => {
  it('should start a chain', () => {
    assert.deepEqual(extend(undefined, hop), [hop])
  })

  it('should not touch what it extends', () => {
    const hops = ['default.orders.create']
    const extended = extend(hops, hop)

    assert.notEqual(extended, hops)
    assert.deepEqual(hops, ['default.orders.create'])
  })

  it('should permit a hop below the limit', () => {
    assert.deepEqual(extend([hop], hop), [hop, hop])
  })

  it('should refuse the hop that repeats once too often', () => {
    assert.throws(
      () => extend([hop, hop], hop),
      (exception) => {
        assert.equal(exception.code, codes.Loop)
        assert.deepEqual(exception.trail, [hop, hop, hop])
        assert.match(exception.message, /is hop 3 of this chain/)

        return true
      }
    )
  })

  it('should count one hop only', () => {
    const hops = ['a.b.c', 'd.e.f', 'a.b.c', 'g.h.i']

    assert.deepEqual(extend(hops, 'd.e.f'), [...hops, 'd.e.f'])
  })

  it('should refuse a chain past the depth, whatever it repeats', () => {
    // 32 distinct hops is the cap, so the 33rd is one too many
    const hops = Array.from({ length: 32 }, (_, i) => `default.one.op${i}`)

    assert.throws(
      () => extend(hops, hop),
      (exception) => {
        assert.equal(exception.code, codes.Loop)
        assert.match(exception.message, /33 hops deep/)

        return true
      }
    )
  })

  it('should permit a chain at the depth', () => {
    const hops = Array.from({ length: 31 }, (_, i) => `default.one.op${i}`)

    assert.equal(extend(hops, hop).length, 32)
  })
})

describe('what came off the wire', () => {
  it('should take a chain that is not one as none', () => {
    for (const value of ['nope', 42, { 0: 'a' }, null])
      assert.deepEqual(extend(value, hop), [hop])
  })

  it('should drop what is not a hop', () => {
    assert.deepEqual(extend(['a.b.c', 7, null, {}, 'd.e.f'], hop), [
      'a.b.c',
      'd.e.f',
      hop
    ])
  })

  it('should clip a chain a peer made long, rather than hold it', () => {
    const hops = Array.from({ length: 4096 }, () => 'default.one.op')

    assert.throws(
      () => extend(hops, hop),
      (exception) => {
        assert.equal(exception.code, codes.Loop)

        // one past the cap is enough to be refused; the rest is memory a message bought
        assert.equal(exception.trail.length, 33)

        return true
      }
    )
  })
})

/** as `Component.invoke` builds it */
const invocation = (hops, id) => ({ hops, id, calls: new Map() })

describe('the store', () => {
  it('should carry the invocation into what it runs', async () => {
    assert.equal(trail.current(), undefined)

    const hops = [hop]

    await trail.follow(invocation(hops, 'a1'), async () => {
      await Promise.resolve()

      assert.deepEqual(trail.current().hops, hops)
      assert.equal(trail.current().id, 'a1')
    })

    assert.equal(trail.current(), undefined)
  })

  it("should give siblings the chain they were entered with, not each other's", async () => {
    await trail.follow(invocation(['a.b.c']), async () => {
      const seen = await Promise.all(
        ['d.e.f', 'g.h.i'].map(async (one) =>
          trail.follow(
            invocation(extend(trail.current().hops, one)),
            async () => trail.current().hops
          )
        )
      )

      assert.deepEqual(seen, [
        ['a.b.c', 'd.e.f'],
        ['a.b.c', 'g.h.i']
      ])

      // and the chain they were made from is untouched
      assert.deepEqual(trail.current().hops, ['a.b.c'])
    })
  })

  it('should carry an identity of none where the caller stamped none', async () => {
    await trail.follow(invocation([hop]), async () => {
      assert.equal(trail.current().id, undefined)
    })
  })
})

describe('ordinal', () => {
  it('should count from zero, per endpoint', () => {
    const one = invocation([hop], 'a1')

    assert.equal(trail.ordinal(one, 'default.stock.reserve'), 0)
    assert.equal(trail.ordinal(one, 'default.stock.reserve'), 1)
    assert.equal(trail.ordinal(one, 'default.stock.reserve'), 2)

    // a different endpoint is a different call, and counts on its own
    assert.equal(trail.ordinal(one, 'default.billing.charge'), 0)
  })

  it('should count per invocation', () => {
    const one = invocation([hop], 'a1')
    const other = invocation([hop], 'a2')

    trail.ordinal(one, 'default.stock.reserve')

    assert.equal(trail.ordinal(other, 'default.stock.reserve'), 0)
  })
})
