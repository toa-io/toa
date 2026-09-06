/**
 * The rows whose calls have been disposed of — made, or found past the bound their caller gave
 * them. They are tombstoned rather than removed: the record of what was asked for outlives the
 * call, and a query answers only what is still owed.
 *
 * `DELETED` is also what the retention index reaps by, so that the record outlives the call
 * without outliving the deployment.
 */
export function transition(_, objects) {
  const now = Date.now()

  for (const object of objects) object.DELETED = now
}
