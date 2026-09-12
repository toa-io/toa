import { registry } from 'openspan'

/**
 * What locking measures.
 *
 * `lock()` waits for as long as it takes to acquire its keys, and that wait is inside the
 * operation that asked for it — so a replica starving on a lock another replica will not release
 * looks exactly like a busy component. The distribution is the signal, because a mean over waits
 * that are usually zero says nothing.
 */
const meters = registry()

/** From a lock taken at once to one waited out for a minute. */
const WAITS = [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5, 15, 60]

const wait = meters.histogram(
  'toa.atomicity.lock.wait',
  { buckets: WAITS, unit: 's' },
  { group: null }
)

const held = meters.gauge('toa.atomicity.locks', { group: null })

export function waited(group, seconds) {
  wait.record(seconds, { group })
}

export function holding(group, delta) {
  held.add(delta, { group })
}
