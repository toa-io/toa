export function computation(input, context) {
  const sweeps = context.state.sweeps ?? []

  return {
    sweeps: sweeps.length,
    enough: sweeps.length >= input.least
  }
}
