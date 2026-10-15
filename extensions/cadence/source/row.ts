import { LANES, occurrences } from '@toa.io/definitions/extensions.cadence'

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

/**
 * What is stored of a schedule an operation handed over: one row, whose `due` is the occurrence it
 * waits for and which `settle` moves on to the next one, rather than a row per occurrence.
 *
 * `expires` keeps the meaning it has on every row — nothing of the row is made after it — and is
 * the end of the schedule, or the end of representable time where it has none. How late one
 * occurrence may be is what `overdue` says, and is derived where it is read: see `bound`.
 */
export function recurring(call: Recurring): Stored {
  const { endpoint, due, request, schedule, zone, overdue, expires } = call

  const stored: Stored = {
    lane: Math.floor(Math.random() * LANES),
    due,
    endpoint,
    expires: expires ?? Number.MAX_SAFE_INTEGER,
    schedule,
    zone
  }

  if (overdue !== undefined) stored.overdue = overdue
  if (request !== undefined) stored.request = request

  return stored
}

/**
 * The moment past which the occurrence a recurring row waits for is no longer made: `overdue`
 * after it where one was stated, and the next occurrence where none was, so that at most one is
 * ever owed.
 */
export function bound(stored: Stored): number {
  if (stored.overdue !== undefined) return stored.due + stored.overdue

  return next(stored, stored.due) ?? Number.MAX_SAFE_INTEGER
}

/**
 * The occurrence a recurring row moves on to once the one it waited for is disposed of: the first
 * after now and never one already past, so a metronome that was away owes one occurrence and not
 * every one it missed. Never the one it was at, either — a call made a moment early, or a clock
 * behind the one that wrote `due`, would otherwise make it again. `null` where nothing comes
 * before the row expires.
 */
export function following(stored: Stored, now: number): number | null {
  const at = next(stored, Math.max(now, stored.due))

  return at === null || at > stored.expires ? null : at
}

function next(stored: Stored, after: number): number | null {
  return occurrences(stored.schedule!, stored.zone!)(after)
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

export interface Recurring {
  /** what to call, as `namespace.component.operation` */
  endpoint: string

  /** the first occurrence, in milliseconds since the epoch */
  due: number

  request?: object

  /** the cron expression */
  schedule: string

  /** the time zone it is read in */
  zone: string

  /** milliseconds an occurrence may be late and still be made; until the next one where absent */
  overdue?: number

  /** milliseconds since the epoch after which nothing is made; never where absent */
  expires?: number
}

export interface Stored {
  lane: number
  due: number
  expires: number
  endpoint: string
  request?: object
  trail?: string[]

  /** what a recurring row recurs by, absent on a row that is made once */
  schedule?: string
  zone?: string

  /** milliseconds an occurrence of a recurring row may be late */
  overdue?: number
}
