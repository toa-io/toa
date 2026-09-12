import { registry } from 'openspan'

/**
 * The gap `discussions/convergence.md` named: *"alerting on it would need a metrics facility that
 * does not exist here."*
 *
 * The lag is this region's clock less the timestamp the record carries from the region that wrote
 * it, so it is one subtraction across two clocks with the skew ignored — there is no way to do it
 * that is not. Choose an alert threshold well above the skew you expect; a lag of hundreds of
 * milliseconds read against a skew of a few is worth reading, and nothing precise should be built
 * on it.
 */
const meters = registry()

/** From a hop inside a datacentre to a region that has been behind for a quarter of an hour. */
const LAGS = [0.05, 0.1, 0.5, 1, 5, 15, 60, 300, 900]

const lag = meters.histogram(
  'toa.convergence.lag',
  { buckets: LAGS, unit: 's' },
  { region: null, outcome: ['applied', 'stale'] }
)

/**
 * A lag that came out negative, which is this region's clock behind the writer's. Recorded as
 * zero in the histogram, because a distribution has nowhere to put it and clamping silently would
 * turn the low buckets into a report about the clocks. This counter is that report.
 */
const backward = meters.counter('toa.convergence.backward', { region: null })

export function merged(region: unknown, outcome: string, updated?: number): void {
  if (updated === undefined) return

  const seconds = (Date.now() - updated) / 1000
  const labels = { region: String(region ?? 'none') }

  if (seconds < 0) backward.add(1, labels)

  lag.record(Math.max(0, seconds), { ...labels, outcome })
}
