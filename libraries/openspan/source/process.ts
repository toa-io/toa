import { monitorEventLoopDelay } from 'node:perf_hooks'
import type { Registry } from './Registry.ts'

/**
 * What the process itself is doing, read at every collection.
 *
 * Loop delay is the one saturation signal Node gives, and nothing else here reports it. It is a
 * gauge and still has no blind spot: `monitorEventLoopDelay` keeps its own histogram between
 * reads, so what the gauge carries is the whole interval rather than the moment it was read, and
 * the monitor is reset once it has been.
 *
 * The prefix is given rather than built in, because this library is not the runtime that uses it.
 */
export function observe(registry: Registry, prefix: string): void {
  const name = prefix === '' ? '' : prefix + '.'

  const delay = registry.gauge(`${name}process.loop.delay`, {
    quantile: QUANTILES.map(([label]) => label)
  })

  const memory = registry.gauge(`${name}process.memory`, {
    kind: ['rss', 'heap', 'external']
  })

  const monitor = monitorEventLoopDelay({ resolution: RESOLUTION })

  monitor.enable()

  registry.observe(() => {
    for (const [label, quantile] of QUANTILES)
      delay.set(nanoseconds(monitor, quantile), { quantile: label })

    monitor.reset()

    const usage = process.memoryUsage()

    memory.set(usage.rss, { kind: 'rss' })
    memory.set(usage.heapUsed, { kind: 'heap' })
    memory.set(usage.external, { kind: 'external' })
  })
}

function nanoseconds(
  monitor: ReturnType<typeof monitorEventLoopDelay>,
  quantile: number
): number {
  const value = quantile === 100 ? monitor.max : monitor.percentile(quantile)

  // the monitor answers in nanoseconds, and every duration here is seconds
  return Number.isFinite(value) ? value / 1e9 : 0
}

const QUANTILES: Array<[string, number]> = [
  ['p50', 50],
  ['p90', 90],
  ['p99', 99],
  ['max', 100]
]

/** Milliseconds between the monitor's own samples: finer costs more than the thing measured. */
const RESOLUTION = 10
