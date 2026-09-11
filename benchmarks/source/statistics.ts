/**
 * Two windows measured next to each other, one on each side. Windows of one block ran between the
 * same two boots, so they share whatever a boot decided — the JIT's choices, the heap's layout —
 * and are resampled together.
 */
export interface Pair {
  block: number
  base: number
  head: number
}

/** The median of the head/base ratios, its interval, and the median of the differences. */
export interface Estimate {
  ratio: number
  low: number
  high: number
  difference: number
}

export type Verdict = 'slower' | 'faster' | 'unchanged' | 'inconclusive'

export interface EstimateOptions {
  resamples?: number
  seed?: number
  confidence?: number
}

export function median(values: readonly number[]): number {
  if (values.length === 0) throw new RangeError('Median of no values')

  const sorted = [...values].sort((a, b) => a - b)
  const middle = sorted.length >> 1

  return sorted.length % 2 === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

/**
 * A percentile bootstrap over whole blocks. Pairs of one block are correlated through the boot
 * they share, so drawing pairs one by one would count them as independent evidence and narrow
 * the interval below what the data supports.
 */
export function estimate(pairs: readonly Pair[], options: EstimateOptions = {}): Estimate {
  const { resamples = 10_000, seed = 1, confidence = 0.95 } = options
  const blocks = group(pairs)

  if (blocks.length < 2) throw new RangeError('An interval needs at least two blocks')

  const next = random(seed)
  const medians = new Float64Array(resamples)

  for (let r = 0; r < resamples; r++) {
    const sample: number[] = []

    for (let b = 0; b < blocks.length; b++)
      sample.push(...blocks[Math.floor(next() * blocks.length)])

    medians[r] = median(sample)
  }

  medians.sort()

  const tail = (1 - confidence) / 2

  return {
    ratio: median(pairs.map(ratio)),
    low: quantile(medians, tail),
    high: quantile(medians, 1 - tail),
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

/** mulberry32: a seeded generator, so a report can be recomputed to the same interval */
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

function group(pairs: readonly Pair[]): number[][] {
  const blocks = new Map<number, number[]>()

  for (const pair of pairs) {
    let block = blocks.get(pair.block)

    if (block === undefined) {
      block = []
      blocks.set(pair.block, block)
    }

    block.push(ratio(pair))
  }

  return [...blocks.values()]
}

function ratio({ base, head }: Pair): number {
  return head / base
}

function quantile(sorted: Float64Array, q: number): number {
  const index = Math.round(q * (sorted.length - 1))

  return sorted[Math.min(sorted.length - 1, Math.max(0, index))]
}
