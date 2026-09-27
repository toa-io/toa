export function transition(input, entries) {
  let total = 0

  for (const entry of entries) {
    entry.foo += input.foo
    total += entry.foo
  }

  return { total }
}
