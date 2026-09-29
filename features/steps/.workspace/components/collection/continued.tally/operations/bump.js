export function transition(_, entry) {
  entry.n++

  return { id: entry.id, n: entry.n }
}
