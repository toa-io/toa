export async function effect(input, context) {
  context.state.marks ??= []
  context.state.marks.push('round')

  if (input.rounds === 0) return 'done'

  const options = { interval: input.delay, overdue: null }

  if (input.unchained !== undefined) options.unchained = input.unchained
  if (input.detached !== undefined) options.detached = input.detached

  return await context.delay(
    'default.delaying.rearm',
    { input: { ...input, rounds: input.rounds - 1 } },
    options
  )
}
