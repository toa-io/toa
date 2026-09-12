import { registry } from 'openspan'
import type { Measure } from 'openspan'

/**
 * What the gateway measures.
 *
 * `status` is on the counter and not on the histogram: routes by methods by statuses is the widest
 * label product in a deployment, and a histogram multiplies whatever it is given by its buckets.
 * Latency per route and per method is read; latency per status almost never is, while the count
 * per status is read constantly.
 */
const meters = registry()

/** A request answered over the network, so the ladder is a web request's. */
const DURATIONS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]

const duration = meters.histogram(
  'toa.exposition.request.duration',
  { buckets: DURATIONS, unit: 's' },
  { method: null, route: null }
)

const responses = meters.counter('toa.exposition.responses', {
  method: null,
  route: null,
  status: null
})

/** What a request that matched no route is labelled, so a flood of them is one series. */
export const NONE = 'none'

/**
 * The labels are the request's own object, filled in when the route is known — which is after the
 * span opens and before it completes, since routing happens inside it.
 */
export function request(method = 'GET'): Measure & { labels: Labels } {
  return { histogram: duration, labels: { method, route: NONE } }
}

/**
 * The status is written onto the request's own labels rather than into a copy of them: the
 * object is the request's and dies with it, and the histogram that carries it reads the two
 * labels it declared and nothing else.
 */
export function answered(labels: Labels, status: number): void {
  labels.status = status

  responses.add(1, labels)
}

export interface Labels extends Record<string, unknown> {
  method: string
  route: string
  /** written when the reply is answered, which is after the histogram has read the rest */
  status?: number
}
