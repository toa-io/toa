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
    const pairs = blocks(4, 2, () => ({ base: 100, head: 110 }))
    const result = estimate(pairs)

    assert.ok(Math.abs(result.ratio - 1.1) < 1e-9)
    assert.ok(Math.abs(result.low - 1.1) < 1e-9)
    assert.ok(Math.abs(result.high - 1.1) < 1e-9)
    assert.ok(Math.abs(result.difference - 10) < 1e-9)
  })

  it('should contain a known ratio under noise and exclude none', () => {
    const noise = random(7)
    const pairs = blocks(6, 2, () => {
      const base = 100 * (1 + (noise() - 0.5) * 0.04)

      return { base, head: base * 1.2 * (1 + (noise() - 0.5) * 0.04) }
    })

    const result = estimate(pairs)

    assert.ok(result.low <= 1.2 && result.high >= 1.2, JSON.stringify(result))
    assert.ok(result.low > 1, JSON.stringify(result))
  })

  it('should count blocks, not pairs', () => {
    // pairs of one block share a boot: eight of them are no more evidence than one
    const ratios = [1.0, 1.02, 1.04, 1.06, 1.08, 1.1]
    const few = ratios.flatMap((ratio, block) => [{ block, base: 100, head: 100 * ratio }])
    const many = ratios.flatMap((ratio, block) =>
      Array.from({ length: 8 }, () => ({ block, base: 100, head: 100 * ratio }))
    )

    const a = estimate(few)
    const b = estimate(many)

    assert.ok(Math.abs(a.low - b.low) < 1e-9 && Math.abs(a.high - b.high) < 1e-9, JSON.stringify({ a, b }))
  })

  it('should leave two blocks that differ by 2% inconclusive', () => {
    // two blocks tell a spread of two values and nothing about the next: an A/A run of two
    // blocks at 0.90 and 0.92 must not come out faster
    const pairs: Pair[] = [
      { block: 0, base: 100, head: 90 },
      { block: 0, base: 100, head: 90 },
      { block: 1, base: 100, head: 92 },
      { block: 1, base: 100, head: 92 }
    ]

    assert.equal(verdict(estimate(pairs), 0.05), 'inconclusive')
  })

  it('should refuse fewer than two blocks', () => {
    assert.throws(() => estimate(blocks(1, 2, () => ({ base: 1, head: 1 }))))
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

function blocks(count: number, size: number, pair: () => { base: number; head: number }): Pair[] {
  const pairs: Pair[] = []

  for (let block = 0; block < count; block++)
    for (let i = 0; i < size; i++) pairs.push({ block, ...pair() })

  return pairs
}
