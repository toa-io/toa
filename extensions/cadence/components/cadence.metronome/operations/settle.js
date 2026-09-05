/**
 * The rows whose calls have been made. They are tombstoned rather than removed: the record of
 * what was asked for outlives the call, and a query answers only what is still owed.
 */
export function transition (_, objects) {
  const now = Date.now()

  for (const object of objects) object._deleted = now
}
