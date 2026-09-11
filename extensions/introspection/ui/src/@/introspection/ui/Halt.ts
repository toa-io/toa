/** How long HALT must be held. A click is not enough. */
export const DURATION = 7_000

/** Below this a halt is mostly teardown: a gateway drains for 10 s and comq shuts down over ~5 s. */
export const MINIMUM = 30

/** A halt is invisible from outside, so a runaway one is an outage with a green dashboard. */
export const MAXIMUM = 60 * 60

/** The shortest halt worth having. */
export const DEFAULT = 60
