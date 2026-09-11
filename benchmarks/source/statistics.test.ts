import { it, describe } from 'node:test'
import assert from 'node:assert/strict'

import { median, estimate, verdict, random } from './statistics.ts'
import type { Pair } from './statistics.ts'

describe('median', () => {
  it('should take the middle of an odd count', () => {
    assert.equal(median([3, 1, 2]), 2)
  })

  it('should average the two middles of an even count', () => {
    assert.equal(median([4, 1, 3, 2]), 2.5)
  })

  it('should not reorder its argument', () => {
    const values = [3, 1, 2]

    median(values)

    assert.deepEqual(values, [3, 1, 2])
  })
})

describe('estimate', () => {
  it('should find a constant ratio exactly', () => {
    const pairs = blocks(4, () => ({ base: 100, head: 110 }))
    const result = estimate(pairs)

    assert.ok(Math.abs(result.ratio - 1.1) < 1e-9)
    assert.ok(Math.abs(result.low - 1.1) < 1e-9)
    assert.ok(Math.abs(result.high - 1.1) < 1e-9)
    assert.ok(Math.abs(result.difference - 10) < 1e-9)
  })

  it('should contain a known ratio under noise and exclude none', () => {
    const noise = random(7)
    const pairs = blocks(6, () => {
      const base = 100 * (1 + (noise() - 0.5) * 0.04)

      return { base, head: base * 1.2 * (1 + (noise() - 0.5) * 0.04) }
    })

    const result = estimate(pairs)

    assert.ok(result.low <= 1.2 && result.high >= 1.2, JSON.stringify(result))
    assert.ok(result.low > 1, JSON.stringify(result))
  })

  it('should give the same interval for the same seed', () => {
    const noise = random(3)
    const pairs = blocks(5, () => ({ base: 100 + noise() * 10, head: 100 + noise() * 10 }))

    assert.deepEqual(estimate(pairs, { seed: 11 }), estimate(pairs, { seed: 11 }))
  })

  it('should widen the interval by the spread between blocks', () => {
    // six blocks of eight identical pairs, at 1.00, 1.02 … 1.10: drawn pair by pair, 48 draws
    // would pin the median near 1.05; drawn block by block, six draws reach the outer blocks
    const pairs: Pair[] = []

    for (let block = 0; block < 6; block++)
      for (let i = 0; i < 8; i++) pairs.push({ block, base: 100, head: 100 + block * 2 })

    const result = estimate(pairs)

    assert.ok(result.low <= 1.01, JSON.stringify(result))
    assert.ok(result.high >= 1.09, JSON.stringify(result))
  })

  it('should refuse fewer than two blocks', () => {
    assert.throws(() => estimate(blocks(1, () => ({ base: 1, head: 1 }))))
  })
})

describe('verdict', () => {
  const t = 0.05

  it('should call an interval wholly above the threshold slower', () => {
    assert.equal(verdict({ ratio: 1.1, low: 1.051, high: 1.2, difference: 1 }, t), 'slower')
  })

  it('should call an interval wholly below the threshold faster', () => {
    assert.equal(verdict({ ratio: 0.9, low: 0.8, high: 0.949, difference: -1 }, t), 'faster')
  })

  it('should call an interval wholly within the threshold unchanged', () => {
    assert.equal(verdict({ ratio: 1, low: 0.95, high: 1.05, difference: 0 }, t), 'unchanged')
  })

  it('should call an interval touching the bound from outside inconclusive', () => {
    assert.equal(verdict({ ratio: 1.05, low: 1.05, high: 1.1, difference: 1 }, t), 'inconclusive')
  })

  it('should call an interval straddling a bound inconclusive', () => {
    assert.equal(verdict({ ratio: 1.03, low: 0.99, high: 1.08, difference: 1 }, t), 'inconclusive')
  })
})

function blocks(count: number, pair: () => { base: number; head: number }): Pair[] {
  const pairs: Pair[] = []

  for (let block = 0; block < count; block++)
    for (let i = 0; i < 2; i++) pairs.push({ block, ...pair() })

  return pairs
}
