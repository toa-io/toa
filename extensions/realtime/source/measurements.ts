import { registry } from 'openspan'

/**
 * What realtime measures, per event — which is the whole reason it exists. The push itself is an
 * operation invocation and core counts it, but by component and operation, where the event is the
 * input and invisible. Here it is the label, and that is what makes the comparison possible:
 * `toa.event.publish.duration._count` against this is published versus arrived.
 */
const meters = registry()

const pushed = meters.counter('toa.realtime.pushed', { event: null })

/** A push failure is swallowed into a log line and nothing else. */
const failures = meters.counter('toa.realtime.failures', { event: null })

export function delivered(event: string): void {
  pushed.add(1, { event })
}

export function failed(event: string): void {
  failures.add(1, { event })
}
