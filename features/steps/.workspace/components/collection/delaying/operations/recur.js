export async function effect(input, context) {
  context.state.marks ??= []
  context.state.marks.push('round')

  if (input.rounds === 0) return 'done'

  return await context.delay(
    'default.delaying.recur',
    { input: { ...input, rounds: input.rounds - 1 } },
    { interval: input.delay, overdue: null }
  )
}
