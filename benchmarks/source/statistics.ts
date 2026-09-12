/**
 * Two windows measured next to each other, one on each side. Windows of one block ran between the
 * same two boots, so they share whatever a boot decided — the JIT's choices, the heap's layout —
 * and count as one observation together.
 */
export interface Pair {
  block: number
  base: number
  head: number
}

/** The ratio head/base, its 95% interval, and the median of the differences. */
export interface Estimate {
  ratio: number
  low: number
  high: number
  difference: number
}

export type Verdict = 'slower' | 'faster' | 'unchanged' | 'inconclusive'

export function median(values: readonly number[]): number {
  if (values.length === 0) throw new RangeError('Median of no values')

  const sorted = [...values].sort((a, b) => a - b)
  const middle = sorted.length >> 1

  return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

/**
 * A t-interval over blocks: each block is the mean log-ratio of its pairs, and the interval is
 * Student's, with as many degrees of freedom as blocks less one. Few blocks give a wide interval,
 * which is what few blocks can support; drawing pairs as independent evidence would not.
 */
export function estimate(pairs: readonly Pair[]): Estimate {
  const blocks = group(pairs)

  if (blocks.length < 2) throw new RangeError('An interval needs at least two blocks')

  const means = blocks.map(mean)
  const center = mean(means)
  const n = means.length
  const deviation = Math.sqrt(means.reduce((sum, value) => sum + (value - center) ** 2, 0) / (n - 1))
  const half = (student(n - 1) * deviation) / Math.sqrt(n)

  return {
    ratio: Math.exp(center),
    low: Math.exp(center - half),
    high: Math.exp(center + half),
    difference: median(pairs.map(({ base, head }) => head - base))
  }
}

export function verdict(estimate: Estimate, threshold: number): Verdict {
  const { low, high } = estimate

  if (low > 1 + threshold) return 'slower'
  if (high < 1 - threshold) return 'faster'
  if (low >= 1 - threshold && high <= 1 + threshold) return 'unchanged'

  return 'inconclusive'
}

/** mulberry32: a seeded generator, for data a test can repeat */
export function random(seed: number): () => number {
  let state = seed >>> 0

  return () => {
    state = (state + 0x6d2b79f5) >>> 0

    let t = state

    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** The log-ratios of each block's pairs. */
function group(pairs: readonly Pair[]): number[][] {
  const blocks = new Map<number, number[]>()

  for (const { block, base, head } of pairs) {
    let values = blocks.get(block)

    if (values === undefined) {
      values = []
      blocks.set(block, values)
    }

    values.push(Math.log(head / base))
  }

  return [...blocks.values()]
}

function mean(values: readonly number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

/** The two-sided 95% quantile of Student's t. */
function student(freedom: number): number {
  return T[freedom - 1] ?? 1.96
}

const T = [
  12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228, 2.201, 2.179, 2.16, 2.145, 2.131, 2.12,
  2.11, 2.101, 2.093, 2.086, 2.08, 2.074, 2.069, 2.064, 2.06, 2.056, 2.052, 2.048, 2.045, 2.042
]
