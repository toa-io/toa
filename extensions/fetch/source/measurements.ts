import { registry } from 'openspan'
import type { Measure } from 'openspan'

/**
 * What an outgoing fetch measures. `origin` is bounded by the allowlist a component already writes
 * for another reason, so the one label that would otherwise be unbounded is bounded by a
 * constraint that exists anyway.
 *
 * The attempt is measured and the call around it is not: an attempt is a real HTTP request, the
 * call is the policy around it, and `retries` is what says the difference — a rising retry count
 * against a flat response count is an origin degrading before it fails.
 */
const meters = registry()

/** A third party over the internet, so the ladder runs out to half a minute. */
const DURATIONS = [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30]

const ORIGIN = { origin: null, method: null }

const duration = meters.histogram(
  'toa.fetch.duration',
  { buckets: DURATIONS, unit: 's' },
  ORIGIN
)

const responses = meters.counter('toa.fetch.responses', { ...ORIGIN, status: null })

const retries = meters.counter('toa.fetch.retries', { origin: null })

export function attempt(origin: string, method: string): Measure {
  return { histogram: duration, labels: { origin, method } }
}

export function answered(origin: string, method: string, status: number): void {
  responses.add(1, { origin, method, status })
}

export function retried(origin: string): void {
  retries.add(1, { origin })
}
