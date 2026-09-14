/** How long HALT must be held. A click is not enough. */
export const DURATION = 7_000

/** Below this a halt is mostly teardown: a gateway drains for 10 s and comq shuts down over ~5 s. */
export const MINIMUM = 30

/** A halt is invisible from outside, so a runaway one is an outage with a green dashboard. */
export const MAXIMUM = 60 * 60

/** Ten minutes: long enough for the work a halt is for. */
export const DEFAULT = 10 * 60

/** Below this the queues have not had time to drain. */
export const QUIESCENCE_MINIMUM = 30

/** Longer than this and a halt is waiting on work that is not going to finish. */
export const QUIESCENCE_MAXIMUM = 30 * 60

/** What the signal uses when the operator does not say. */
export const QUIESCENCE_DEFAULT = 60
