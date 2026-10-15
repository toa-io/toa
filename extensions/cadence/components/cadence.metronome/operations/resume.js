/**
 * A schedule handed over again after it was cancelled or had ended. What it is is its id, so the
 * row is the same one: committed without touching `DELETED`, a tombstone is revived, and it waits
 * for the first occurrence from now.
 */
export function transition(input, entry) {
  entry.due = input.due
  entry.lane = input.lane
}
