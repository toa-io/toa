import { LANES } from '@toa.io/definitions/extensions.cadence'

/**
 * What is stored of a call to make later, as whoever hands one over states it: `context.delay`,
 * and a schedule storing its next occurrence. Written once, so that the two store one kind of
 * row and the dispatcher reads one.
 *
 * The lane is random, not one this replica owns. An outbox row is written into an owned lane so
 * that in steady state a replica settles its own rows before it ever reads them — but a delayed
 * row has no immediate path to settle, so nothing is gained, and an even spread is what the
 * dispatchers want.
 */
export function row(call: Call): Stored {
  const { endpoint, due, overdue, request, trail } = call

  const stored: Stored = {
    lane: Math.floor(Math.random() * LANES),
    due,
    endpoint,

    // absolute, because the bound is the caller's and a scan reads rows of many callers at once.
    // No bound is the end of representable time rather than an absent field, so that one
    // comparison answers for every row
    expires: overdue === null ? Number.MAX_SAFE_INTEGER : due + overdue
  }

  // a call that takes no request has none: the entity's `request` is an object where it is
  // there at all, and a null would not fit it
  if (request !== undefined) stored.request = request

  // the chain that asked for the call, absent where the call begins one of its own
  if (trail !== undefined) stored.trail = trail

  return stored
}

export interface Call {
  /** what to call, as `namespace.component.operation` */
  endpoint: string

  /** when, in milliseconds since the epoch */
  due: number

  /** milliseconds the call may be late and still be made, or `null` for no bound */
  overdue: number | null

  request?: object
  trail?: string[]
}

export interface Stored {
  lane: number
  due: number
  expires: number
  endpoint: string
  request?: object
  trail?: string[]
}
