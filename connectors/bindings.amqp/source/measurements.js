import { registry } from 'openspan'

/**
 * What the binding measures.
 *
 * Publication only: an arriving message is an invocation, and core measures that. So there is one
 * direction here and no ambiguity about which.
 *
 * `toa.amqp.published` is not a second copy of core's rates. Core cannot tell a task from a
 * request — both go through `Call.invoke` and land in `toa.call.duration`, where a task's
 * measurement is the enqueue rather than the work.
 */
const meters = registry()

const published = meters.counter('toa.amqp.published', {
  topology: ['request', 'task', 'event']
})

/**
 * The conditions comq reports. Every one of them reaches the log today and nothing else — an
 * undeliverable message, a discarded request, a shard dropping out, a failed reconnect.
 */
const diagnostics = meters.counter('toa.amqp.diagnostics', {
  condition: null,
  shard: null
})

export function publish(topology) {
  published.add(1, { topology })
}

export function reported(condition, shard) {
  diagnostics.add(1, { condition, shard: shard ?? 'none' })
}
