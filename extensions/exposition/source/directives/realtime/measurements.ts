import { registry } from 'openspan'

/**
 * Counted where the gateway sends an event to the readers of a key it serves. Against
 * `toa.realtime.routed` and `toa.realtime.pushed`, it says what arrived; `toa.realtime.dropped`
 * is a pushed event a reader was not sent because it did not keep up.
 */
const meters = registry()

const delivered = meters.counter('toa.realtime.delivered', { event: null })
const pushed = meters.counter('toa.realtime.pushed', { event: null })
const dropped = meters.counter('toa.realtime.dropped', { event: null })

export function deliver(event: string): void {
  delivered.add(1, { event })
}

export function push(event: string): void {
  pushed.add(1, { event })
}

export function drop(event: string): void {
  dropped.add(1, { event })
}
