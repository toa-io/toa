import { setTimeout } from 'node:timers/promises'

export async function effect(input, context) {
  await setTimeout(10)

  return { bar: 'baz' }
}
