export function transition(input, entry) {
  entry.foo += input.inc
  entry.TRAILERS.inc = input.inc

  return entry
}
