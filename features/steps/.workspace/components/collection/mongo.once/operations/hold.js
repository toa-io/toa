export function transition(input, entry) {
  entry.foo = input.foo
  entry.DISCARD = true

  return { foo: entry.foo }
}
