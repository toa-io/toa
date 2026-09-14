/** How long HALT must be held. A click is not enough. */
export const DURATION = 7_000

/** What the form asks for where the operator has no reason of their own. */
export const DEFAULT = 10 * 60

/**
 * How long the deployment has between the button being held and the halt being written.
 *
 * The last moment anyone can change their mind: nothing has been asked of the deployment until
 * this reaches zero.
 */
export const COUNTDOWN = 10
