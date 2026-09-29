export function transition(_, entry) {
  entry.count += 1
  entry.DISCARD = true

  return { count: entry.count }
}
