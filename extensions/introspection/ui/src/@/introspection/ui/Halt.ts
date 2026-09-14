/** How long HALT must be held. A click is not enough. */
export const HOLD = 7_000

/**
 * How long the deployment has between the button being held and the halt being written.
 *
 * The last moment anyone can change their mind: nothing has been asked of the deployment until
 * this reaches zero.
 */
export const COUNTDOWN = 10

/**
 * What the form opens on where the operator has no reason of their own, in seconds.
 *
 * Held to what the deployment allows, which is not known until it says: neither of these is a
 * value the form can insist on, only one it would start from.
 */
export const DURATION = 10 * 60
export const QUIESCENCE = 60
