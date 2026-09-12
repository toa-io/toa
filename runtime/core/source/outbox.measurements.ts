import { registry } from 'openspan'

/**
 * What the outbox measures, and the zone with the most to gain from being measured: the pump
 * swallows a publication failure into a log line, so events stop leaving and nothing says so.
 */
const meters = registry()

const DESTINATION = { destination: null }

/** Rows this replica has read as still outstanding, at the end of a cycle. */
const pending = meters.gauge('toa.outbox.pending', DESTINATION)

/**
 * How long the oldest outstanding row has waited. The number to alert on, because it is one
 * threshold a person can choose — *events are more than N seconds behind* — where a count of rows
 * has none: a handful four hours old is a stuck destination, a thousand a second old is a busy one.
 */
const age = meters.gauge('toa.outbox.age', DESTINATION)

const failures = meters.counter('toa.outbox.failures', DESTINATION)

/**
 * Cycles in a row this replica was given no lane. Past ten it means this outbox recovers nothing:
 * a publication that failed is never retried, and that change is lost with the process that failed
 * to make it.
 */
const unassigned = meters.gauge('toa.outbox.unassigned')

export function failed(destination: string): void {
  failures.add(1, { destination })
}

export function starving(cycles: number): void {
  unassigned.set(cycles)
}

/** What one cycle saw, set together so that a destination it read nothing for reads as zero. */
export function cycled(
  destinations: string[],
  counts: Map<string, number>,
  oldest: Map<string, number>
): void {
  const now = Date.now()

  for (const destination of destinations) {
    pending.set(counts.get(destination) ?? 0, { destination })

    const since = oldest.get(destination)

    age.set(since === undefined ? 0 : Math.max(0, (now - since) / 1000), { destination })
  }
}
