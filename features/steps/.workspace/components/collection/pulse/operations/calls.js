export function computation(input, context) {
  const calls = context.state.calls ?? []

  return {
    calls: calls.length,
    // nothing called says nothing about the cycle, and the reply is a number either way
    n: calls[0]?.n ?? 0,
    enough: calls.length >= input.least,
    // every recorded call is the interval after the one before it, wrapping with the cycle.
    // An interval nobody owned leaves a gap, and a gap is what this is here to catch
    consecutive: calls.every(
      (call, index) => index === 0 || call.i === (calls[index - 1].i + 1) % call.n
    )
  }
}
