export const SYSTEM = 'system'

/**
 * Which operation a task is for. One queue carries every task a component is given, so what
 * the queue name used to say the message says instead, under the same prefix as the header
 * an event carries.
 */
export const ENDPOINT = 'toa.io/endpoint'

/**
 * How long a call waits before it is sent again, each time it is answered by a process that does
 * not serve its operation: a tenth of a second, doubling. A component is replaced a process at a
 * time, and for as long as that takes a call to an operation the new release adds may be taken by
 * a process of the old one: sent again, it is taken by whichever is next. Eleven times makes
 * some three and a half minutes in all, which is longer than a release takes to come up, and
 * then the caller is told.
 *
 * @param {number} attempt how many times the call has been sent again, from zero
 * @returns {number | undefined} milliseconds, or nothing once it has been sent often enough
 */
export const resending = (attempt) =>
  attempt < RESENDS ? RESEND_BASE * RESEND_FACTOR ** attempt : undefined

const RESENDS = 11
const RESEND_BASE = 100
const RESEND_FACTOR = 2
