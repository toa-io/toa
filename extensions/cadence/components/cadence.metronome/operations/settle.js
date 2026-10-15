import { following } from '@toa.io/extensions.cadence'

/**
 * The rows whose calls have been disposed of — made, or found past the bound their caller gave
 * them. They are tombstoned rather than removed: the record of what was asked for outlives the
 * call, and a query answers only what is still owed.
 *
 * `DELETED` is also what the retention index reaps by, so that the record outlives the call
 * without outliving the deployment.
 *
 * A row that carries a schedule is the whole of it, and is moved on to its next occurrence
 * instead — unless it is over, or nothing comes before it expires.
 */
export function transition(input, entries) {
  const now = Date.now()
  const made = input?.made ?? {}
  const ended = new Set(input?.ended ?? [])

  for (const entry of entries) {
    if (entry.schedule === undefined || ended.has(entry.id)) {
      entry.DELETED = now

      continue
    }

    // a settle that arrives after the row has moved on — a second one, or one from a replica
    // whose lane changed hands — leaves it where it is: the occurrence it is at is not made yet
    if (made[entry.id] !== entry.due) continue

    const due = following(entry, now)

    if (due === null) entry.DELETED = now
    else entry.due = due
  }
}
