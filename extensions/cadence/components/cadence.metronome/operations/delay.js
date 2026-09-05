import { LANES } from '@toa.io/extensions.cadence'

/**
 * A call to make later. The request carries no query, so the transition is handed a new object.
 *
 * The lane is random, not one this replica owns. An outbox row is written into an owned lane so
 * that in steady state a replica settles its own rows before it ever reads them — but a delayed
 * row has no immediate path to settle, so nothing is gained, and an even spread is what the
 * dispatchers want.
 */
export function transition (input, object) {
  const due = Date.now() + input.interval

  object.lane = Math.floor(Math.random() * LANES)
  object.due = due
  object.endpoint = input.endpoint

  // absolute, because the bound is the caller's and a scan reads rows of many callers at once.
  // No bound is the end of representable time rather than an absent field, so that one
  // comparison answers for every row
  object.expires = input.overdue === null ? Number.MAX_SAFE_INTEGER : due + input.overdue

  // a call that takes no request has none: the entity's `request` is an object where it is
  // there at all, and a null would not fit it
  if (input.request !== undefined) object.request = input.request

  return object.id
}
