import { registry } from 'openspan'

/**
 * Counted where the gateway pushes an event to the readers of a key it serves. Against
 * `toa.realtime.routed`, which the components that write events count, it says what arrived.
 */
const meters = registry()

const delivered = meters.counter('toa.realtime.delivered', { event: null })

export function deliver(event: string): void {
  delivered.add(1, { event })
}
