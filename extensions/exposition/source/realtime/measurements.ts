import { registry } from 'openspan'

/**
 * Counted where a component writes an event to the streams of its keys, whether or not any of
 * them is read. Against `toa.realtime.delivered`, which the gateway counts, it says what arrived.
 */
const meters = registry()

const routed = meters.counter('toa.realtime.routed', { event: null })

export function route(event: string): void {
  routed.add(1, { event })
}
