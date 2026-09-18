export function transition(input, object) {
  object.foo += input.inc
  object.TRAILERS.inc = input.inc

  return object
}
