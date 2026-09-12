import { registry } from 'openspan'
import type { Measure } from 'openspan'

/**
 * What the stash measures. `command` and not a key: the commands a component uses are a fixed set
 * of its source, and a key is whatever the data is.
 */
const meters = registry()

/** A local Redis answers in well under a millisecond, so the ladder starts there. */
const DURATIONS = [0.0005, 0.001, 0.0025, 0.005, 0.01, 0.025, 0.05, 0.1, 0.5, 1]

const duration = meters.histogram(
  'toa.stash.command.duration',
  { buckets: DURATIONS, unit: 's' },
  { command: null }
)

export function command(name: string): Measure {
  return { histogram: duration, labels: { command: name } }
}
