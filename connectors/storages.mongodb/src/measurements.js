import { registry } from 'openspan'

/**
 * What this storage measures. `provider` is which database it is, so that a deployment running more
 * than one can be read a kind at a time. No database label: the database is the context, which
 * every series already carries as its resource.
 */
const meters = registry()

/** Prometheus' own ladder, in seconds: from five milliseconds to ten seconds. */
const DURATIONS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]

const PROVIDER = 'mongodb'

const duration = meters.histogram(
  'toa.storage.query.duration',
  { buckets: DURATIONS, unit: 's' },
  { provider: null, collection: null, operation: null }
)

/**
 * A compare-and-swap that lost. Whether it is retried or raised is the operation's to declare, and
 * the retried one succeeds — so without this it is a duration that grew and nothing else.
 */
const conflicts = meters.counter('toa.storage.conflicts', {
  provider: null,
  collection: null
})

export function query(collection, operation) {
  return {
    histogram: duration,
    labels: { provider: PROVIDER, collection, operation }
  }
}

export function conflicted(collection) {
  conflicts.add(1, { provider: PROVIDER, collection })
}
