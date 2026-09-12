import { registry } from 'openspan'

/**
 * What cadence measures. It does two things — a pulse calls an operation on a cadence, a delay
 * hands one call over to be made later — and each half has a way of quietly doing nothing.
 */
const meters = registry()

const COMPONENT = { component: null }

/**
 * Intervals fired. The rate one should keep is `cycle / intervals` from its manifest, so this is
 * the numerator against a denominator nothing has to be asked for — and a rollout, a crash or an
 * operation that ran past its own interval each cost one and are made up by nothing.
 */
const pulses = meters.counter('toa.cadence.pulses', { pulse: null })

const skipped = meters.counter('toa.cadence.skipped', {
  pulse: null,
  reason: ['overlap', 'unowned']
})

/** Calls handed over to be made later. */
const delayed = meters.counter('toa.cadence.delayed', COMPONENT)

/** Those made. What is still waiting is the residue of the three. */
const dispatched = meters.counter('toa.cadence.dispatched', COMPONENT)

/**
 * Those never made, because the row passed the bound its caller gave it. Settled silently, which
 * is what makes it work nothing else sees.
 */
const expired = meters.counter('toa.cadence.expired', COMPONENT)

/**
 * The pass over delayed calls. A pass that outlives its interval takes every pass after it with
 * it, and nothing is dispatched while that lasts.
 */
const scans = meters.counter('toa.cadence.scans', {
  outcome: ['done', 'skipped', 'failed']
})

export function fired(pulse: string): void {
  pulses.add(1, { pulse })
}

export function missed(pulse: string, reason: string): void {
  skipped.add(1, { pulse, reason })
}

export function put(component: string): void {
  delayed.add(1, { component })
}

export function made(component: string): void {
  dispatched.add(1, { component })
}

export function lapsed(component: string): void {
  expired.add(1, { component })
}

export function scanned(outcome: string): void {
  scans.add(1, { outcome })
}
