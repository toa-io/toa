import { registry } from 'openspan'

/**
 * What core measures, declared once for the process.
 *
 * An invocation and a call are two metrics rather than one with a `kind` label: a `Remote` is a
 * `Component` too and names the very endpoint the callee does, so a single name would hold two
 * quantities — the callee's own work, and the caller's round trip with the transport in it — and
 * would count every remote call twice, once in each process.
 */
const meters = registry()

const COMPONENT = { component: null }
const ENDPOINT = { component: null, operation: null }

/** Prometheus' own ladder, in seconds: from five milliseconds to ten seconds. */
export const DURATIONS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]

export const operation = {
  duration: meters.histogram(
    'toa.operation.duration',
    { buckets: DURATIONS, unit: 's' },
    ENDPOINT
  ),

  /** a refusal the operation chose: the operation working */
  errors: meters.counter('toa.operation.errors', {
    ...ENDPOINT,
    code: null
  }),

  /** a failure nobody chose; `outcome` says whether another attempt could pass */
  exceptions: meters.counter('toa.operation.exceptions', {
    ...ENDPOINT,
    code: null,
    outcome: null
  }),

  inflight: meters.gauge('toa.operation.inflight', COMPONENT)
}

export const call = {
  duration: meters.histogram(
    'toa.call.duration',
    { buckets: DURATIONS, unit: 's' },
    ENDPOINT
  ),

  /** only what the transmission raised: what the callee sent back is counted where it happened */
  exceptions: meters.counter('toa.call.exceptions', { ...ENDPOINT, code: null }),

  /** callers waiting, which is held for the whole round trip and not only while one runs */
  inflight: meters.gauge('toa.call.inflight', COMPONENT)
}

export const event = {
  publish: meters.histogram(
    'toa.event.publish.duration',
    { buckets: DURATIONS, unit: 's' },
    { event: null }
  )
}
