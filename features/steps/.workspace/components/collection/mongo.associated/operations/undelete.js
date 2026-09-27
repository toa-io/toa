export function transition(input, entry) {
  Object.assign(entry, input)
  entry.DELETED = null

  return entry
}
