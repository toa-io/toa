import { attempt } from '../attempts.js'

export async function effect(input, context) {
  const at = context.now()
  const r = context.random()
  const ref = context.id()

  await context.remote.continued.tally.bump({ query: { id: input.a }, input: { at, r, ref } })

  if (attempt('stamped', input) <= input.fail) throw new Error('Failing on purpose')

  await context.remote.continued.tally.bump({ query: { id: input.b } })
}
