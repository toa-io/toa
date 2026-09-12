import { registry } from 'openspan'
import type { Measure } from 'openspan'
import type { Scope } from './Storage.ts'

/**
 * What a BLOB storage measures. Network I/O to a third party, and nothing else reports it.
 *
 * `storage` is the name the component declared it under and `provider` is what stands behind it:
 * a component declares several and uses them for different things, so the provider alone does not
 * say which one was slow where two declarations share one.
 */
const meters = registry()

/** Wider than a query's, because a third party over the network is slower than a database. */
const DURATIONS = [0.01, 0.05, 0.1, 0.5, 1, 2.5, 5, 10, 30]

const duration = meters.histogram(
  'toa.blob.operation.duration',
  { buckets: DURATIONS, unit: 's' },
  { storage: null, provider: null, operation: null }
)

export function operation(method: string, scope?: Scope): Measure {
  return {
    histogram: duration,
    labels: {
      storage: scope?.name,
      provider: scope?.provider,
      operation: method
    }
  }
}
