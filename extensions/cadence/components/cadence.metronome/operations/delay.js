import { row } from '@toa.io/extensions.cadence'

/**
 * A call to make later. The request carries no query, so the transition is handed a new object.
 * What is stored of it is what `row` says, which a schedule stores as well.
 */
export function transition(input, entry) {
  const { endpoint, interval, overdue, request, trail } = input

  Object.assign(
    entry,
    row({ endpoint, due: Date.now() + interval, overdue, request, trail })
  )

  return entry.id
}
