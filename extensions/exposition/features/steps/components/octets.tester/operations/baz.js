import { setTimeout } from 'node:timers/promises'

export async function effect(input, context) {
  await setTimeout(30)

  return input.steps ?? null
}
