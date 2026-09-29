import { setTimeout } from 'node:timers/promises'

export async function effect(input, context) {
  await setTimeout(500)
  await context.remote.continued.tally.bump({ query: { id: input.id }, input: {} })
}
