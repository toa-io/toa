import { attempt } from '../attempts.js'

export async function effect(input, context) {
  await context.remote.continued.tally.bump({ query: { id: input.a } })

  if (attempt('react', input) <= input.fail) throw new Error('Failing on purpose')

  await context.remote.continued.tally.bump({ query: { id: input.b } })
}
