import { registry } from 'openspan'

/**
 * What realtime measures, per event. `routed` is counted where the component writes the event to
 * the streams of its keys, `delivered` where a gateway pushes it to a stream it serves: against
 * each other, and against `toa.event.publish.duration._count`, they say what arrived.
 */
const meters = registry()

const routed = meters.counter('toa.realtime.routed', { event: null })
const delivered = meters.counter('toa.realtime.delivered', { event: null })

export function route(event: string): void {
  routed.add(1, { event })
}

export function deliver(event: string): void {
  delivered.add(1, { event })
}
